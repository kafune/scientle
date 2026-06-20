import { NextResponse } from "next/server";
import { resolveDailyTarget } from "@/lib/daily";
import { getDailyScientist } from "@/lib/game";

// Sempre avaliado no servidor a cada request (lê o env atual, sem cache).
export const dynamic = "force-dynamic";

// Override secreto do cientista do dia. Configure na VPS via env:
//   DAILY_OVERRIDES={"2026-06-20":"Leo Testoni","2026-12-25":"Amanda Lanzotti"}
// As chaves são o "dia de jogo" (YYYY-MM-DD, mesma régua do reset 21h).
// Só retorna um nome quando há override; senão devolve null e o cliente usa o
// sorteio determinístico padrão (evita expor a resposta de todo dia na rede).
export function GET() {
  const target = resolveDailyTarget();
  const isOverride = target.name !== getDailyScientist().name;
  return NextResponse.json({ name: isOverride ? target.name : null });
}
