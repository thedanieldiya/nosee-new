import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOSEE",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-default focus:px-4 focus:py-2 focus:text-primary focus:outline-2 focus:outline-offset-2 focus:outline-accent"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
