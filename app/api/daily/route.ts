import { NextResponse } from "next/server";
import { resolveDailyTarget } from "@/lib/daily";

// Sempre avaliado no servidor a cada request (lê o env/banco atuais, sem cache).
export const dynamic = "force-dynamic";

// Fonte de verdade do cientista do dia: aplica override secreto, senão usa a
// escolha congelada no banco (ou calcula e congela na 1ª vez). O cliente confia
// neste nome; só recorre ao cálculo local se a requisição falhar (offline).
export async function GET() {
  const target = await resolveDailyTarget();
  return NextResponse.json({ name: target.name });
}
