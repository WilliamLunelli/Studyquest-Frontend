import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { OfflineStatus } from "@/components/OfflineStatus";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const themeInitializer = `(() => {
  try {
    const stored = localStorage.getItem("studyquest_theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const theme = stored === "dark" || stored === "light" ? stored : preferred;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {}
})();`;

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "StudyQuest | Aprenda com constância",
  description: "Planeje seu ciclo de estudos, acompanhe seu progresso e revise com constância no StudyQuest.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "data:," },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={spaceGrotesk.variable}>
      <head>
        <Script id="studyquest-theme" strategy="beforeInteractive">
          {themeInitializer}
        </Script>
      </head>
      <body>
        <ServiceWorkerRegistration />
        <OfflineStatus />
        {children}
      </body>
    </html>
  );
}
