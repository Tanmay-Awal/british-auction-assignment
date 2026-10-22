from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from decimal import Decimal
from pydantic import BaseModel
from app.models.enums import ExtensionTriggerType


class StrategyEvaluationContext(BaseModel):
    carrier_name: str
    new_bid_total: Decimal
    new_rank: int
    previous_rank_of_carrier: Optional[int] = None
    previous_l1_carrier: Optional[str] = None
    previous_l1_total: Optional[Decimal] = None
    total_existing_bids: int = 0


class ExtensionStrategyResult(BaseModel):
    should_extend: bool
    reason: str


class BaseExtensionStrategy(ABC):
    @abstractmethod
    def evaluate(self, ctx: StrategyEvaluationContext) -> ExtensionStrategyResult:
        """
        Evaluate whether the bid qualifies for an auction time extension.
        """
        pass


class BidReceivedStrategy(BaseExtensionStrategy):
    """
    Rule 6.3(a): Bid Received in Last X Minutes.
    If any supplier submits a new bid during the trigger window, the auction extends.
    """
    def evaluate(self, ctx: StrategyEvaluationContext) -> ExtensionStrategyResult:
        return ExtensionStrategyResult(
            should_extend=True,
            reason=f"Bid submitted by '{ctx.carrier_name}' ($ {ctx.new_bid_total:,.2f}) during active trigger window."
        )


class AnyRankChangeStrategy(BaseExtensionStrategy):
    """
    Rule 6.3(b): Any Supplier Rank Change in Last X Minutes.
    If any change in supplier ranking occurs during the trigger window, the auction extends.
    """
    def evaluate(self, ctx: StrategyEvaluationContext) -> ExtensionStrategyResult:
        # If this is the very first bid, ranking was established
        if ctx.total_existing_bids == 0:
            return ExtensionStrategyResult(
                should_extend=True,
                reason=f"First bid in RFQ placed by '{ctx.carrier_name}' (established initial L1 position)."
            )

        # If carrier had a previous bid and their rank improved, or if new carrier entered and took rank <= total bids
        if ctx.previous_rank_of_carrier is not None:
            if ctx.new_rank != ctx.previous_rank_of_carrier:
                return ExtensionStrategyResult(
                    should_extend=True,
                    reason=f"Rank change: '{ctx.carrier_name}' shifted from L{ctx.previous_rank_of_carrier} to L{ctx.new_rank}."
                )
            else:
                return ExtensionStrategyResult(
                    should_extend=False,
                    reason=f"No rank change: '{ctx.carrier_name}' remained at rank L{ctx.new_rank}."
                )
        else:
            # First bid from this specific carrier
            # If they enter at rank <= total existing bids, they displaced at least one existing supplier!
            if ctx.new_rank <= ctx.total_existing_bids:
                return ExtensionStrategyResult(
                    should_extend=True,
                    reason=f"Rank change: New entrant '{ctx.carrier_name}' placed at rank L{ctx.new_rank}, displacing competitors."
                )
            else:
                # Carrier placed lower than all existing bids (e.g. rank 4 when 3 bids existed)
                return ExtensionStrategyResult(
                    should_extend=False,
                    reason=f"No rank displacement: '{ctx.carrier_name}' entered at lowest position L{ctx.new_rank}."
                )


class L1RankChangeStrategy(BaseExtensionStrategy):
    """
    Rule 6.3(c): Lowest Bidder (L1) Rank Change in Last X Minutes.
    The auction extends only when the lowest-priced supplier changes.
    """
    def evaluate(self, ctx: StrategyEvaluationContext) -> ExtensionStrategyResult:
        # First bid establishes L1
        if ctx.previous_l1_carrier is None or ctx.total_existing_bids == 0:
            return ExtensionStrategyResult(
                should_extend=True,
                reason=f"Initial L1 established by '{ctx.carrier_name}' ($ {ctx.new_bid_total:,.2f})."
            )

        # Extension only if new rank is 1 and carrier displaced previous L1 (or lowered existing L1)
        if ctx.new_rank == 1:
            if ctx.previous_l1_carrier != ctx.carrier_name:
                return ExtensionStrategyResult(
                    should_extend=True,
                    reason=f"L1 Leader Dethroned! '{ctx.carrier_name}' ($ {ctx.new_bid_total:,.2f}) beat '{ctx.previous_l1_carrier}' ($ {ctx.previous_l1_total:,.2f})."
                )
            else:
                # Same carrier lowered their own L1 price
                return ExtensionStrategyResult(
                    should_extend=True,
                    reason=f"L1 Leader '{ctx.carrier_name}' lowered their winning quote to $ {ctx.new_bid_total:,.2f}."
                )
        
        return ExtensionStrategyResult(
            should_extend=False,
            reason=f"L1 leader did not change. Current L1 remains '{ctx.previous_l1_carrier}' ($ {ctx.previous_l1_total:,.2f})."
        )


def get_extension_strategy(trigger_type: str) -> BaseExtensionStrategy:
    """Factory method for extension strategies"""
    if trigger_type == ExtensionTriggerType.BID_RECEIVED.value:
        return BidReceivedStrategy()
    elif trigger_type == ExtensionTriggerType.ANY_RANK_CHANGE.value:
        return AnyRankChangeStrategy()
    elif trigger_type == ExtensionTriggerType.L1_RANK_CHANGE.value:
        return L1RankChangeStrategy()
    else:
        # Default fallback to BID_RECEIVED
        return BidReceivedStrategy()
