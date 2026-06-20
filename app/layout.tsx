import type { Metadata, Viewport } from "next";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import "./globals.css";

const SITE_URL = "https://scientle.kafune.xyz";
const TITLE = "Scientle — adivinhe o cientista do dia";
const DESCRIPTION =
  "Um jogo diário no estilo Wordle: descubra o cientista misterioso pelas pistas de área, nascimento, país, prêmios e mais. Um novo desafio todo dia às 21h.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Scientle",
  },
  description: DESCRIPTION,
  applicationName: "Scientle",
  keywords: [
    "Scientle",
    "jogo de cientistas",
    "Wordle",
    "jogo diário",
    "ciência",
    "adivinhação",
    "cientistas",
  ],
  authors: [{ name: "Scientle" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Scientle",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
