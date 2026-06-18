import { NextResponse } from "next/server";
import { findScientist, gameDayKey } from "@/lib/game";

// Sempre avaliado no servidor a cada request (lê o env atual, sem cache).
export const dynamic = "force-dynamic";

// Override secreto do cientista do dia. Configure na VPS via env:
//   DAILY_OVERRIDES={"2026-06-20":"Leo Testoni","2026-12-25":"Amanda Lanzotti"}
// As chaves são o "dia de jogo" (YYYY-MM-DD, mesma régua do reset 21h).
// Sem override para hoje, retorna name:null e o jogo usa o sorteio padrão.
export function GET() {
  let name: string | null = null;
  try {
    const raw = process.env.DAILY_OVERRIDES;
    if (raw) {
      const map = JSON.parse(raw) as Record<string, string>;
      const wanted = map[gameDayKey()];
      const found = wanted ? findScientist(wanted) : undefined;
      if (found) name = found.name;
    }
  } catch {
    /* JSON inválido: ignora e usa o sorteio padrão */
  }
  return NextResponse.json({ name });
}
