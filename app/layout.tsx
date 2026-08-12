import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const matrixBody = Manrope({
  variable: "--font-matrix-body",
  subsets: ["latin"],
});

const matrixDisplay = Space_Grotesk({
  variable: "--font-matrix-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rookie ADP Hit Rates",
  description:
    "Fantasy football rookie hit rates by draft position and positional group.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
        className={`${geistSans.variable} ${geistMono.variable} ${matrixBody.variable} ${matrixDisplay.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
