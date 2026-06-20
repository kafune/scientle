import type { MetadataRoute } from "next";

// Web App Manifest: torna o Scientle instalável ("adicionar à tela inicial"),
// ideal para um jogo diário.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scientle — adivinhe o cientista do dia",
    short_name: "Scientle",
    description:
      "Um jogo diário no estilo Wordle: descubra o cientista misterioso pelas pistas de área, nascimento, país, prêmios e mais.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0c0f",
    theme_color: "#0b0c0f",
    lang: "pt-BR",
    categories: ["games", "education"],
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  };
}
