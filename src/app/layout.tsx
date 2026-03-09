import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Research MVP",
  description: "A simple AI research workspace prototype"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
