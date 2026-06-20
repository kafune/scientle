"use server";

import { auth } from "@/auth";
import { resolveDailyTarget } from "@/lib/daily";
import { findScientist, gameDayKey, MAX_GUESSES, puzzleNumber } from "@/lib/game";
import { prisma } from "@/lib/prisma";

// Salva o resultado do dia (gated por sessão). O servidor é a fonte de verdade:
// resolve o alvo do dia, valida os palpites e RECALCULA vitória/contagem — nunca
// confia no `won`/contagem reportados pelo cliente. O 1º envio do dia é imutável.
export async function saveGameResult(input: {
  guessNames: string[];
}): Promise<{ saved: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { saved: false };

  const userId = session.user.id;
  const dayKey = gameDayKey();
  const target = resolveDailyTarget();

  // Mantém só palpites que correspondem a cientistas reais, na ordem enviada,
  // sem duplicatas, limitado ao máximo de tentativas.
  const seen = new Set<string>();
  const validNames: string[] = [];
  for (const raw of input.guessNames) {
    const s = findScientist(raw);
    if (!s || seen.has(s.name)) continue;
    seen.add(s.name);
    validNames.push(s.name);
    if (validNames.length >= MAX_GUESSES) break;
  }

  // Vitória e contagem derivadas no servidor a partir dos palpites validados.
  const winIndex = validNames.indexOf(target.name);
  const won = winIndex !== -1;
  const guessCount = won
    ? winIndex + 1
    : Math.min(validNames.length, MAX_GUESSES);
  const guessNames = won ? validNames.slice(0, winIndex + 1) : validNames;

  await prisma.gameResult.upsert({
    where: { userId_dayKey: { userId, dayKey } },
    update: {}, // imutável após o primeiro registro do dia
    create: {
      userId,
      dayKey,
      puzzleNumber: puzzleNumber(),
      won,
      guessCount,
      guessNames,
    },
  });

  return { saved: true };
}
