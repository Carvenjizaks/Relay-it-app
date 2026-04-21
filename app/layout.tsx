import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relay-it - Event Lead Generation",
  description: "Event lead generation through creditable referrals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[var(--background)]">
      <body className="antialiased">{children}</body>
    </html>
  );
}
