"use server";

import { auth } from "@/auth";
import { MAX_GUESSES } from "@/lib/game";
import { prisma } from "@/lib/prisma";
import { GameStats } from "@/lib/stats";

// Estatísticas do usuário logado (fonte de verdade quando há login).
export async function getUserStats(): Promise<GameStats | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const games = await prisma.gameResult.findMany({
    where: { userId: session.user.id },
    orderBy: { puzzleNumber: "asc" },
    select: { puzzleNumber: true, won: true, guessCount: true },
  });

  const totalGames = games.length;
  const wonGames = games.filter((g) => g.won);
  const wins = wonGames.length;
  const avgGuesses =
    wins > 0 ? wonGames.reduce((s, g) => s + g.guessCount, 0) / wins : null;

  const distribution = Array.from({ length: MAX_GUESSES }, () => 0);
  for (const g of wonGames) {
    const idx = Math.min(Math.max(g.guessCount, 1), MAX_GUESSES) - 1;
    distribution[idx] += 1;
  }

  // Maior sequência histórica de vitórias em puzzles consecutivos.
  let maxStreak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const g of games) {
    if (g.won) {
      run = prev !== null && g.puzzleNumber === prev + 1 ? run + 1 : 1;
      maxStreak = Math.max(maxStreak, run);
    } else {
      run = 0;
    }
    prev = g.puzzleNumber;
  }

  // Sequência atual: do registro mais recente para trás, quebra na 1ª derrota/lacuna.
  let currentStreak = 0;
  for (let i = games.length - 1; i >= 0; i--) {
    const g = games[i];
    if (!g.won) break;
    if (currentStreak === 0) {
      currentStreak = 1;
    } else {
      const next = games[i + 1];
      if (next && next.puzzleNumber === g.puzzleNumber + 1) currentStreak += 1;
      else break;
    }
  }

  return {
    totalGames,
    wins,
    winRate: totalGames > 0 ? wins / totalGames : 0,
    currentStreak,
    maxStreak,
    avgGuesses,
    distribution,
  };
}
