import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantQuest — Gamified Investing",
  description: "Make investing engaging, educational, and accessible.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
