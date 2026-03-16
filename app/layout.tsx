import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Backend Interview Gym",
  description: "Practice backend interviews with AI-generated questions and feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
