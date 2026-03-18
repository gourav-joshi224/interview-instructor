import type { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "BackendGym",
  description: "Practice backend interviews with AI-generated questions and feedback.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
