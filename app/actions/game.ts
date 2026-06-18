"use server";

import { auth } from "@/auth";
import { gameDayKey, MAX_GUESSES, puzzleNumber } from "@/lib/game";
import { prisma } from "@/lib/prisma";

// Salva o resultado do dia (gated por sessão). O servidor decide dia/puzzle
// (anti-trapaça) e o primeiro envio do dia é imutável.
export async function saveGameResult(input: {
  won: boolean;
  guessNames: string[];
}): Promise<{ saved: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { saved: false };

  const userId = session.user.id;
  const dayKey = gameDayKey();
  const guessNames = input.guessNames.slice(0, MAX_GUESSES);
  const guessCount = Math.min(input.guessNames.length, MAX_GUESSES);

  await prisma.gameResult.upsert({
    where: { userId_dayKey: { userId, dayKey } },
    update: {}, // imutável após o primeiro registro do dia
    create: {
      userId,
      dayKey,
      puzzleNumber: puzzleNumber(),
      won: input.won,
      guessCount,
      guessNames,
    },
  });

  return { saved: true };
}
