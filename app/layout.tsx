import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotle Científico",
  description: "Adivinhe o cientista do dia — um jogo diário no estilo Wordle.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
