import { Geist, Geist_Mono, Inter, Mulish } from "next/font/google";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const fontMullish = Mulish({
  subsets: ["latin"],
  variable: "--font-mullish",
});

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});


export const fontVariables = [
  fontSans.variable,
  fontMono.variable,
  fontMullish.variable,
  fontInter.variable,
].join(" ");
