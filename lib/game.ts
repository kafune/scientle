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

// Fuso e horário do reset diário. O "dia de jogo" vai das 21h às 21h de São Paulo:
// às 21h um novo cientista é sorteado. Usamos Intl com timezone fixo para não
// depender do fuso do servidor (o container roda em UTC).
const GAME_TZ = "America/Sao_Paulo";
const RESET_HOUR = 21;
const DAY_MS = 86_400_000;
// Época do jogo: o puzzle de 2024-01-01 (dia de jogo) é o #1. Ajustável.
const PUZZLE_EPOCH = Date.UTC(2024, 0, 1);

// Componentes de data/hora no fuso de São Paulo.
function spParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: GAME_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(
    fmt.formatToParts(date).map((x) => [x.type, x.value]),
  );
  // Alguns ambientes formatam meia-noite como "24"; normaliza para 0.
  const hour = p.hour === "24" ? 0 : Number(p.hour);
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: hour };
}

// Data UTC no formato YYYY-MM-DD (mantido para compatibilidade).
export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

// Chave do "dia de jogo" (YYYY-MM-DD): às 21h de SP avança para o dia seguinte.
export function gameDayKey(date = new Date()): string {
  const { y, m, d, h } = spParts(date);
  let ms = Date.UTC(y, m - 1, d);
  if (h >= RESET_HOUR) ms += DAY_MS;
  return new Date(ms).toISOString().slice(0, 10);
}

// Número sequencial do puzzle (ex.: #1053), determinístico a partir da época.
export function puzzleNumber(date = new Date()): number {
  const ms = Date.parse(gameDayKey(date) + "T00:00:00Z");
  return Math.floor((ms - PUZZLE_EPOCH) / DAY_MS) + 1;
}

// Cientista do dia: determinístico a partir do dia de jogo (igual para todos).
export function getDailyScientist(date = new Date()): Scientist {
  const index = hashString(gameDayKey(date)) % SCIENTISTS.length;
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

// --- Compartilhamento estilo Metazooa: um quadrado por palpite ---

// Quadrado colorido pela proximidade do palpite (6 atributos comparados).
export function proximityEmoji(g: GuessResult): string {
  if (g.isWin) return "🟩";
  const cells = [g.field, g.birthYear, g.nationality, g.gender, g.award, g.alive];
  const score = cells.reduce(
    (s, c) => s + (c.match === "correct" ? 1 : c.match === "close" ? 0.5 : 0),
    0,
  );
  if (score >= 3.5) return "🟨"; // quente
  if (score >= 2) return "🟧"; // morno
  return "🟥"; // frio
}

export interface ShareOptions {
  guesses: GuessResult[];
  won: boolean;
  streak: number;
  avg: number | null;
  url: string;
}

// Monta o texto compartilhável no estilo Metazooa.
export function buildShareText(opts: ShareOptions): string {
  const n = puzzleNumber();
  const squares = opts.guesses.map(proximityEmoji).join("");
  const head = `🔬 Cientista #${n} 🧪`;
  const line = opts.won
    ? `Acertei em ${opts.guesses.length} ${
        opts.guesses.length === 1 ? "tentativa" : "tentativas"
      }!`
    : `X/${MAX_GUESSES} — não consegui hoje 😢`;
  const avg = opts.avg != null ? ` · Média: ${opts.avg.toFixed(1)}` : "";
  const stats = `🔥 ${opts.streak}${avg}`;
  return `${head}\n${line}\n${squares}\n${stats}\n${opts.url}\n#spotlecientifico`;
}
