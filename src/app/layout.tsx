import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clairvo IoT - Air Quality Monitoring | Bengkel Harum Motor",
  description: "Real-time air quality monitoring system for Bengkel Harum Motor. Built by Clairvo Team",
  icons: {
    icon: "/clairvo-logo-white.png",
    shortcut: "/clairvo-logo-white.png",
    apple: "/clairvo-logo-white.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
