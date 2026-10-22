"use client";

export default function ShipIllustration() {
  return (
    <div className="w-[360px] h-[190px] relative shrink-0 select-none pointer-events-none hidden lg:block">
      <svg
        viewBox="0 0 380 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Soft Background Clouds */}
        <circle cx="280" cy="55" r="42" fill="#e8f2fe" opacity="0.8" />
        <path
          d="M 120 75 C 120 52, 145 42, 165 52 C 178 36, 210 36, 222 52 C 235 45, 252 50, 256 65 C 265 67, 270 78, 265 88 L 120 88 Z"
          fill="#edf5ff"
        />
        <circle cx="230" cy="50" r="24" fill="#e4f0fe" opacity="0.9" />

        {/* -------------------- PORT GANTRY CRANE (STS) -------------------- */}
        <g stroke="#4f8ee8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Main Vertical Leg 1 (Left leg) */}
          <line x1="298" y1="165" x2="298" y2="60" />
          {/* Main Vertical Leg 2 (Right leg) */}
          <line x1="318" y1="165" x2="318" y2="60" />

          {/* Cross braces between legs */}
          <line x1="298" y1="140" x2="318" y2="120" strokeWidth="1.8" />
          <line x1="318" y1="140" x2="298" y2="120" strokeWidth="1.8" />
          <line x1="298" y1="110" x2="318" y2="90" strokeWidth="1.8" />
          <line x1="318" y1="110" x2="298" y2="90" strokeWidth="1.8" />
          <line x1="298" y1="75" x2="318" y2="75" strokeWidth="2" />

          {/* Crane Upper Apex / A-frame */}
          <polygon points="308,30 294,60 322,60" fill="#e3efff" stroke="#4f8ee8" strokeWidth="2.5" />
          <line x1="308" y1="30" x2="308" y2="60" strokeWidth="1.8" />

          {/* Horizontal Boom / Arm (Spans from x=350 to x=190 over ship) */}
          <line x1="345" y1="58" x2="190" y2="58" strokeWidth="3" />
          <line x1="345" y1="48" x2="190" y2="48" strokeWidth="2" />

          {/* Truss Triangles inside Boom */}
          <polyline
            points="
              190,58 200,48 210,58 220,48 230,58 240,48 250,58 
              260,48 270,58 280,48 290,58 300,48 310,58 320,48 
              330,58 340,48 345,58
            "
            fill="none"
            stroke="#4f8ee8"
            strokeWidth="1.6"
          />

          {/* Crane Suspension Tie Rods */}
          <line x1="308" y1="30" x2="225" y2="48" strokeWidth="1.6" />
          <line x1="308" y1="30" x2="340" y2="48" strokeWidth="1.6" />

          {/* Hoist Trolley & Cables */}
          <rect x="236" y="58" width="14" height="6" fill="#3b7edc" stroke="#3b7edc" rx="1" />
          <line x1="240" y1="64" x2="240" y2="88" strokeWidth="1.2" stroke="#4f8ee8" />
          <line x1="246" y1="64" x2="246" y2="88" strokeWidth="1.2" stroke="#4f8ee8" />

          {/* Spreader & Lifted Container Box */}
          <rect x="233" y="88" width="14" height="3" fill="#2d6ecb" stroke="#2d6ecb" />
        </g>

        {/* -------------------- CONTAINER SHIP -------------------- */}
        {/* Tier 1 (Base deck level) Container Stacks */}
        <g stroke="#ffffff" strokeWidth="1.5">
          {/* Row 1 - Deck Level */}
          <rect x="95" y="112" width="22" height="15" fill="#5895ec" rx="1" />
          <rect x="117" y="112" width="22" height="15" fill="#4281db" rx="1" />
          <rect x="139" y="112" width="22" height="15" fill="#75abf5" rx="1" />
          <rect x="161" y="112" width="22" height="15" fill="#5895ec" rx="1" />
          <rect x="183" y="112" width="22" height="15" fill="#4281db" rx="1" />
          <rect x="205" y="112" width="22" height="15" fill="#6ba5f2" rx="1" />
          <rect x="227" y="112" width="22" height="15" fill="#3b78d4" rx="1" />

          {/* Row 2 */}
          <rect x="106" y="97" width="22" height="15" fill="#4281db" rx="1" />
          <rect x="128" y="97" width="22" height="15" fill="#6ba5f2" rx="1" />
          <rect x="150" y="97" width="22" height="15" fill="#3b78d4" rx="1" />
          <rect x="172" y="97" width="22" height="15" fill="#5895ec" rx="1" />
          <rect x="194" y="97" width="22" height="15" fill="#75abf5" rx="1" />
          <rect x="216" y="97" width="22" height="15" fill="#4281db" rx="1" />

          {/* Row 3 */}
          <rect x="128" y="82" width="22" height="15" fill="#5895ec" rx="1" />
          <rect x="150" y="82" width="22" height="15" fill="#75abf5" rx="1" />
          <rect x="172" y="82" width="22" height="15" fill="#4281db" rx="1" />
          <rect x="194" y="82" width="22" height="15" fill="#6ba5f2" rx="1" />

          {/* Row 4 (Top tier) */}
          <rect x="150" y="67" width="22" height="15" fill="#3b78d4" rx="1" />
          <rect x="172" y="67" width="22" height="15" fill="#5895ec" rx="1" />
        </g>

        {/* Ship Hull */}
        {/* Main upper hull with angled bow pointing left */}
        <path
          d="M 68 127 L 254 127 L 254 146 L 90 146 Z"
          fill="#5895ec"
        />
        {/* Bow Wedge (angled nose) */}
        <polygon
          points="68,127 90,146 54,146"
          fill="#4b89e2"
        />

        {/* Lower Hull Waterline Shading */}
        <path
          d="M 54 146 L 90 146 L 254 146 L 252 153 C 248 155 240 156 220 156 L 80 156 L 54 146 Z"
          fill="#3b78d4"
        />

        {/* Deck white accent stripe */}
        <line x1="68" y1="127" x2="254" y2="127" stroke="#ffffff" strokeWidth="1.5" />

        {/* Water Surface Lines & Ripples */}
        <g stroke="#bdd8fc" strokeWidth="2.5" strokeLinecap="round">
          <line x1="40" y1="162" x2="265" y2="162" />
          <line x1="20" y1="168" x2="190" y2="168" stroke="#d5e8ff" strokeWidth="2" />
          <line x1="120" y1="174" x2="240" y2="174" stroke="#e0edff" strokeWidth="2" />
          <line x1="60" y1="175" x2="105" y2="175" stroke="#e5f1ff" strokeWidth="1.8" />
        </g>
      </svg>
    </div>
  );
}
