import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GoComet | British Auction in RFQ System",
  description: "Dynamic British Auction system with automated trigger window extensions and forced close ceiling rules.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased flex flex-col font-sans transition-colors duration-150">
        <Navbar />
        {/* Full-width container with generous max-width to remove unnecessary side margins */}
        <main className="flex-1 w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
