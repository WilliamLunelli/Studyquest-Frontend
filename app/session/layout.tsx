import { IBM_Plex_Mono } from "next/font/google";
import type { ReactNode } from "react";

const timerFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-ibm-plex-mono",
});

export default function SessionLayout({ children }: { children: ReactNode }) {
  return <div className={timerFont.variable}>{children}</div>;
}
