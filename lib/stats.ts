import { MAX_GUESSES } from "./game";

// Estatísticas exibidas/compartilhadas. Mesmo formato para localStorage (anônimo)
// e para o banco (usuário logado).
export interface GameStats {
  totalGames: number;
  wins: number;
  winRate: number; // 0..1
  currentStreak: number;
  maxStreak: number;
  avgGuesses: number | null; // média de palpites só dos jogos ganhos
  distribution: number[]; // length MAX_GUESSES; índice = guessCount - 1
}

export function emptyStats(): GameStats {
  return {
    totalGames: 0,
    wins: 0,
    winRate: 0,
    currentStreak: 0,
    maxStreak: 0,
    avgGuesses: null,
    distribution: Array.from({ length: MAX_GUESSES }, () => 0),
  };
}

// Acumulador persistido no navegador (mínimo necessário p/ derivar GameStats).
interface StoredStats {
  totalGames: number;
  wins: number;
  sumWinGuesses: number;
  distribution: number[];
  currentStreak: number;
  maxStreak: number;
  lastDayKey: string | null;
  lastPuzzle: number | null;
}

const STATS_KEY = "spotle-cientifico:stats";

function emptyStored(): StoredStats {
  return {
    totalGames: 0,
    wins: 0,
    sumWinGuesses: 0,
    distribution: Array.from({ length: MAX_GUESSES }, () => 0),
    currentStreak: 0,
    maxStreak: 0,
    lastDayKey: null,
    lastPuzzle: null,
  };
}

function loadStored(): StoredStats {
  if (typeof window === "undefined") return emptyStored();
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return emptyStored();
    const parsed = JSON.parse(raw) as Partial<StoredStats>;
    return { ...emptyStored(), ...parsed };
  } catch {
    return emptyStored();
  }
}

function toStats(s: StoredStats): GameStats {
  return {
    totalGames: s.totalGames,
    wins: s.wins,
    winRate: s.totalGames > 0 ? s.wins / s.totalGames : 0,
    currentStreak: s.currentStreak,
    maxStreak: s.maxStreak,
    avgGuesses: s.wins > 0 ? s.sumWinGuesses / s.wins : null,
    distribution: s.distribution,
  };
}

export function readLocalStats(): GameStats {
  return toStats(loadStored());
}

// Registra o resultado do dia uma única vez (idempotente por dayKey).
export function recordLocalResult(args: {
  dayKey: string;
  puzzleNumber: number;
  won: boolean;
  guessCount: number;
}): GameStats {
  const s = loadStored();
  // Já registrado hoje: não conta em dobro.
  if (s.lastDayKey === args.dayKey) return toStats(s);

  s.totalGames += 1;
  if (args.won) {
    s.wins += 1;
    s.sumWinGuesses += args.guessCount;
    const idx = Math.min(Math.max(args.guessCount, 1), MAX_GUESSES) - 1;
    s.distribution[idx] += 1;
    // Streak: só conta se for o dia imediatamente seguinte ao último registrado.
    if (s.lastPuzzle !== null && args.puzzleNumber === s.lastPuzzle + 1) {
      s.currentStreak += 1;
    } else {
      s.currentStreak = 1;
    }
    s.maxStreak = Math.max(s.maxStreak, s.currentStreak);
  } else {
    s.currentStreak = 0;
  }
  s.lastDayKey = args.dayKey;
  s.lastPuzzle = args.puzzleNumber;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(s));
    } catch {
      /* ignora indisponibilidade de storage */
    }
  }
  return toStats(s);
}
