import { cssVariables } from "@smn/design-tokens";

import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body style={cssVariables as React.CSSProperties}>
        <main className="app-shell">{children}</main>
      </body>
    </html>
  );
}
