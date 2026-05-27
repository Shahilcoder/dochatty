import type { Metadata } from "next";
import { Space_Grotesk, Press_Start_2P, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const pressStart = Press_Start_2P({
  variable: "--font-pixel-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const pixelify = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dochatty — Ask your documents",
  description:
    "Upload a research paper, a contract, a spec, or a textbook — and just ask. Every answer cites its source.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${pressStart.variable} ${pixelify.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-on-surface font-sans">
        {children}
      </body>
    </html>
  );
}
