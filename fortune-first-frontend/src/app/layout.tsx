import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from "./StoreProvider";
import { ThemeProvider } from "./theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fortune First",
  description: "Investment Management Platform",
};

// This Next.js version has an internal webpack module-resolution bug during
// `next build`'s static-export pass: client components' hooks (useState,
// useContext — confirmed against multiple, unrelated components, not one
// library) intermittently resolve React's restricted "react-server" build
// instead of the full client build, crashing the prerender. Every route in
// this app is behind auth or otherwise personalized already, so there's no
// real loss in opting the whole tree out of static generation — it renders
// per-request instead, which sidesteps the bug entirely.
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Runs before hydration so there's no flash of the wrong theme —
          // mirrors what ThemeProvider (src/app/theme-provider.tsx) applies
          // client-side afterward.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <StoreProvider>
            {children}
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}