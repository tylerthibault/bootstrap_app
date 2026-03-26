import type { Metadata } from "next";
import { cssVariables } from "@smn/design-tokens";

import "./globals.css";

export const metadata: Metadata = {
  title: "Bootstrap Platform",
  description: "SEO frontend for the bootstrap application platform."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={cssVariables as React.CSSProperties}>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
