import {
  FIELD_GROUP,
  NOBEL_AWARDS,
  Scientist,
  SCIENTISTS,
} from "@/data/scientists";

// Estado de uma célula de pista.
export type Match = "correct" | "close" | "wrong";
export type Direction = "up" | "down" | null; // alvo nasceu depois / antes

export interface CellResult {
  match: Match;
  // Direção da seta para o ano de nascimento (null nas demais colunas).
  direction?: Direction;
}

export interface GuessResult {
  scientist: Scientist;
  field: CellResult;
  birthYear: CellResult;
  nationality: CellResult;
  gender: CellResult;
  award: CellResult;
  alive: CellResult;
  isWin: boolean;
}

export const MAX_GUESSES = 8;

// Tolerância em anos para a pista "amarela" do nascimento.
const YEAR_CLOSE_RANGE = 25;

export function compareGuess(guess: Scientist, target: Scientist): GuessResult {
  const field: CellResult = {
    match:
      guess.field === target.field
        ? "correct"
        : FIELD_GROUP[guess.field] === FIELD_GROUP[target.field]
          ? "close"
          : "wrong",
  };

  const yearDiff = Math.abs(guess.birthYear - target.birthYear);
  const birthYear: CellResult = {
    match:
      guess.birthYear === target.birthYear
        ? "correct"
        : yearDiff <= YEAR_CLOSE_RANGE
          ? "close"
          : "wrong",
    direction:
      guess.birthYear === target.birthYear
        ? null
        : target.birthYear > guess.birthYear
          ? "up"
          : "down",
  };

  const nationality: CellResult = {
    match: guess.nationality === target.nationality ? "correct" : "wrong",
  };

  const gender: CellResult = {
    match: guess.gender === target.gender ? "correct" : "wrong",
  };

  const award: CellResult = {
    match:
      guess.award === target.award
        ? "correct"
        : NOBEL_AWARDS.includes(guess.award) && NOBEL_AWARDS.includes(target.award)
          ? "close"
          : "wrong",
  };

  const alive: CellResult = {
    match: guess.alive === target.alive ? "correct" : "wrong",
  };

  return {
    scientist: guess,
    field,
    birthYear,
    nationality,
    gender,
    award,
    alive,
    isWin: guess.name === target.name,
  };
}

// Hash determinístico de string -> inteiro (FNV-1a simplificado).
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Data UTC no formato YYYY-MM-DD.
export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

// Cientista do dia: determinístico a partir da data (igual para todos).
export function getDailyScientist(date = new Date()): Scientist {
  const index = hashString(todayKey(date)) % SCIENTISTS.length;
  return SCIENTISTS[index];
}

// Cientista aleatório para o modo prática ilimitado.
export function getRandomScientist(): Scientist {
  const index = Math.floor(Math.random() * SCIENTISTS.length);
  return SCIENTISTS[index];
}

export function findScientist(name: string): Scientist | undefined {
  const normalized = normalize(name);
  return SCIENTISTS.find((s) => normalize(s.name) === normalized);
}

export function normalize(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Sugestões de autocomplete que ainda não foram tentadas.
export function searchScientists(
  query: string,
  exclude: Set<string>,
  limit = 6,
): Scientist[] {
  const q = normalize(query);
  if (!q) return [];
  return SCIENTISTS.filter(
    (s) => !exclude.has(s.name) && normalize(s.name).includes(q),
  ).slice(0, limit);
}
