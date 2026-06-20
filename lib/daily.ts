import { Scientist } from "@/data/scientists";
import { findScientist, gameDayKey, getDailyScientist, puzzleNumber } from "@/lib/game";
import { prisma } from "@/lib/prisma";

// Lê o override secreto (env DAILY_OVERRIDES) para o dia de jogo, se houver.
function readOverride(date: Date): Scientist | undefined {
  try {
    const raw = process.env.DAILY_OVERRIDES;
    if (raw) {
      const map = JSON.parse(raw) as Record<string, string>;
      const wanted = map[gameDayKey(date)];
      return wanted ? findScientist(wanted) : undefined;
    }
  } catch {
    /* JSON inválido: ignora */
  }
  return undefined;
}

// Resolve o cientista do dia no SERVIDOR — fonte de verdade. Ordem de prioridade:
//   1) override secreto (intenção administrativa, sempre vence);
//   2) escolha já congelada no banco para o dia;
//   3) sorteio determinístico — que é então gravado, congelando o dia.
// Isso deixa o diário imune a rebuilds, edições na lista e troca de algoritmo.
// NÃO importar de componentes do cliente (usa process.env e o Prisma).
export async function resolveDailyTarget(date = new Date()): Promise<Scientist> {
  const override = readOverride(date);
  if (override) return override;

  const dayKey = gameDayKey(date);

  // Já congelado? usa o registro (a menos que o nome tenha saído da lista).
  try {
    const existing = await prisma.dailyPuzzle.findUnique({ where: { dayKey } });
    if (existing) {
      const s = findScientist(existing.scientistName);
      if (s) return s;
      // Nome não existe mais no dataset: cai no cálculo, sem quebrar.
    }
  } catch {
    // Banco indisponível: cai no sorteio determinístico (jogo nunca quebra).
    return getDailyScientist(date);
  }

  // Primeira resolução do dia: calcula e congela.
  const computed = getDailyScientist(date);
  try {
    await prisma.dailyPuzzle.upsert({
      where: { dayKey },
      update: {}, // imutável após o primeiro registro
      create: {
        dayKey,
        puzzleNumber: puzzleNumber(date),
        scientistName: computed.name,
      },
    });
  } catch {
    /* falha ao gravar não bloqueia o jogo */
  }
  return computed;
}
