import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCP Next.js Production Starter",
  description: "A production-oriented MCP and ChatGPT UI starter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
