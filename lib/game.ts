import {
  Award,
  COUNTRY_CONTINENT,
  FIELD_GROUP,
  Scientist,
  SCIENTISTS,
} from "@/data/scientists";
import { SCIENTIST_HINTS } from "@/data/hints";
import { SCIENTIST_BIOS } from "@/data/bios";

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

export const MAX_GUESSES = 20;

// Cada cientista tem até 3 dicas (fraca, média, forte), com custo crescente.
export const HINT_COSTS = [3, 5, 7];
export const MAX_HINTS = HINT_COSTS.length;

// Penalidade total (em tentativas) por ter usado `n` dicas.
export function hintPenalty(n: number): number {
  let sum = 0;
  for (let i = 0; i < n && i < HINT_COSTS.length; i++) sum += HINT_COSTS[i];
  return sum;
}

// Custo da próxima dica a revelar (null quando não há mais).
export function nextHintCost(used: number): number | null {
  return used < HINT_COSTS.length ? HINT_COSTS[used] : null;
}

// Tolerância em anos para a pista "amarela" do nascimento.
const YEAR_CLOSE_RANGE = 25;

// Compara os prêmios como multiconjuntos (um cientista pode ter vários, com
// repetição — ex.: um duplo-laureado tem dois "Nobel de Química"):
//   verde  → os conjuntos de prêmios são idênticos (mesmos prêmios e mesma
//            quantidade); dois "sem prêmio" também dão verde.
//   amarelo → não são idênticos, mas compartilham ao menos um prêmio em comum.
//   cinza  → nenhum prêmio em comum.
// Não há mais o antigo "amarelo" entre dois Nobel de categorias diferentes:
// sem prêmio idêntico em comum, a caixa fica cinza.
export function awardMatch(guess: Award[], target: Award[]): Match {
  if (sameMultiset(guess, target)) return "correct";
  const targetSet = new Set(target);
  if (guess.some((a) => targetSet.has(a))) return "close";
  return "wrong";
}

function sameMultiset(a: Award[], b: Award[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((x, i) => x === sb[i]);
}

// Rótulo legível dos prêmios de um cientista. Vazio vira "Nenhum"; repetições
// viram "Nobel de Física (2×)"; múltiplos prêmios ficam separados por " · ".
export function formatAwards(awards: Award[]): string {
  if (awards.length === 0) return "Nenhum";
  const counts = new Map<Award, number>();
  for (const a of awards) counts.set(a, (counts.get(a) ?? 0) + 1);
  return [...counts.entries()]
    .map(([a, n]) => (n > 1 ? `${a} (${n}×)` : a))
    .join(" · ");
}

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

  const guessContinent = COUNTRY_CONTINENT[guess.nationality];
  const targetContinent = COUNTRY_CONTINENT[target.nationality];
  const nationality: CellResult = {
    match:
      guess.nationality === target.nationality
        ? "correct"
        : guessContinent && guessContinent === targetContinent
          ? "close"
          : "wrong",
  };

  const gender: CellResult = {
    match: guess.gender === target.gender ? "correct" : "wrong",
  };

  const award: CellResult = {
    match: awardMatch(guess.awards, target.awards),
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

// PRNG determinístico (mulberry32): mesma seed -> mesma sequência.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Permutação (Fisher-Yates) dos índices [0..n) para um "ciclo" do calendário,
// embaralhada de forma determinística pela seed do ciclo.
function rawCycleOrder(cycle: number, n: number): number[] {
  const rand = mulberry32(hashString(`scientle-cycle:${cycle}`));
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Ordem do ciclo evitando repetir, no 1º dia, o mesmo cientista do último dia
// do ciclo anterior (o swap em índices 0/1 não altera a última posição, então
// comparar com a ordem "crua" do ciclo anterior é suficiente).
function cycleOrder(cycle: number, n: number): number[] {
  const order = rawCycleOrder(cycle, n);
  if (cycle > 0 && n > 1) {
    const prevLast = rawCycleOrder(cycle - 1, n)[n - 1];
    if (order[0] === prevLast) {
      [order[0], order[1]] = [order[1], order[0]];
    }
  }
  return order;
}

// Cientista do dia: determinístico e igual para todos. Em vez de um hash módulo
// (que pode repetir e não cobre todos), percorre uma permutação por ciclo, de
// modo que os N cientistas apareçam uma vez antes de qualquer repetição.
export function getDailyScientist(date = new Date()): Scientist {
  const n = SCIENTISTS.length;
  const seq = puzzleNumber(date) - 1; // índice 0-based do dia de jogo
  const cycle = Math.floor(seq / n);
  const within = ((seq % n) + n) % n;
  const order = cycleOrder(cycle, n);
  return SCIENTISTS[order[within]];
}

// Cientista aleatório para o modo prática ilimitado.
export function getRandomScientist(): Scientist {
  const index = Math.floor(Math.random() * SCIENTISTS.length);
  return SCIENTISTS[index];
}

export function normalize(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Índice de busca pré-computado: normalizar (NFD + regex) e tokenizar os nomes
// é caro e antes era refeito para os ~128 cientistas a cada tecla digitada.
// Calculamos uma única vez no carregamento do módulo e reaproveitamos.
interface IndexedScientist {
  s: Scientist;
  norm: string; // nome completo normalizado
  words: string[]; // palavras normalizadas do nome
}

const SEARCH_INDEX: IndexedScientist[] = SCIENTISTS.map((s) => {
  const norm = normalize(s.name);
  return { s, norm, words: norm.split(/\s+/) };
});

// Mapa nome-normalizado -> cientista, para lookup O(1) em findScientist.
const BY_NORM_NAME = new Map(SEARCH_INDEX.map((e) => [e.norm, e.s]));

export function findScientist(name: string): Scientist | undefined {
  return BY_NORM_NAME.get(normalize(name));
}

// Sugestões de autocomplete que ainda não foram tentadas.
// Busca tolerante a acentos com ranqueamento: prefixo do nome completo →
// prefixo de alguma palavra → todas as palavras buscadas batem início de
// alguma palavra → substring solta. Aceita múltiplos termos (ex.: "marie c"),
// exigindo que todos apareçam. O limite alto deixa a lista rolável.
export function searchScientists(
  query: string,
  exclude: Set<string>,
  limit = 40,
): Scientist[] {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);

  const scored: { s: Scientist; score: number }[] = [];
  for (const { s, norm, words } of SEARCH_INDEX) {
    if (exclude.has(s.name)) continue;
    // Todos os termos digitados precisam aparecer em algum ponto do nome.
    if (!tokens.every((t) => norm.includes(t))) continue;

    let score: number;
    if (norm.startsWith(q)) score = 0;
    else if (words.some((w) => w.startsWith(q))) score = 1;
    else if (tokens.every((t) => words.some((w) => w.startsWith(t)))) score = 2;
    else score = 3;
    scored.push({ s, score });
  }

  scored.sort(
    (a, b) => a.score - b.score || a.s.name.localeCompare(b.s.name, "pt"),
  );
  return scored.slice(0, limit).map((x) => x.s);
}

// --- Link/QR de desafio: prática com um alvo definido por quem compartilha ---

// Codifica/decodifica o nome do alvo num token opaco para a URL de desafio.
// Não é segurança real (roda no cliente), só evita revelar o nome de cara na
// própria URL. XOR leve + Base64 "URL-safe".
const CHALLENGE_KEY = 0x5c;

function xorString(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i++) {
    out += String.fromCharCode(input.charCodeAt(i) ^ CHALLENGE_KEY);
  }
  return out;
}

export function encodeChallenge(name: string): string {
  const masked = xorString(encodeURIComponent(name));
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(masked)
      : Buffer.from(masked, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeChallenge(token: string): Scientist | undefined {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const masked =
      typeof atob !== "undefined"
        ? atob(b64)
        : Buffer.from(b64, "base64").toString("binary");
    const name = decodeURIComponent(xorString(masked));
    return findScientist(name);
  } catch {
    return undefined;
  }
}

// Monta a URL completa de desafio a partir da origem do site.
export function buildChallengeUrl(origin: string, name: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/?desafio=${encodeChallenge(name)}`;
}

// --- Sistema de dicas: 3 dicas biográficas próprias (fraca -> média -> forte) ---

// Dicas específicas do cientista; cai num fallback genérico se faltar entrada.
export function getHints(target: Scientist): string[] {
  return SCIENTIST_HINTS[target.name] ?? fallbackHints(target);
}

function fallbackHints(t: Scientist): string[] {
  return [
    `Atua em ${t.field}`,
    `Trabalhou em ${t.nationality}`,
    `Nasceu nos anos ${Math.floor(t.birthYear / 10) * 10}`,
  ];
}

// Biografia curta exibida ao fim do jogo (o que estudou e pelo que é
// reconhecido). Retorna "" quando não há bio cadastrada.
export function getBio(target: Scientist): string {
  return SCIENTIST_BIOS[target.name] ?? "";
}

// --- Compartilhamento estilo Metazooa: um quadrado por palpite ---

export type Proximity = "win" | "hot" | "warm" | "cold";

// Nível de proximidade do palpite (6 atributos comparados), reaproveitado pelo
// emoji de compartilhamento e pelos pontos da linha do tempo.
export function guessProximity(g: GuessResult): Proximity {
  if (g.isWin) return "win";
  const cells = [g.field, g.birthYear, g.nationality, g.gender, g.award, g.alive];
  const score = cells.reduce(
    (s, c) => s + (c.match === "correct" ? 1 : c.match === "close" ? 0.5 : 0),
    0,
  );
  if (score >= 3.5) return "hot";
  if (score >= 2) return "warm";
  return "cold";
}

// Quadrado colorido pela proximidade do palpite (6 atributos comparados).
export function proximityEmoji(g: GuessResult): string {
  const map: Record<Proximity, string> = {
    win: "🟩",
    hot: "🟨",
    warm: "🟧",
    cold: "🟥",
  };
  return map[guessProximity(g)];
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
  return `${head}\n${line}\n${squares}\n${stats}\n${opts.url}\n#scientle`;
}

export interface ChallengeShareOptions {
  guesses: GuessResult[];
  won: boolean;
  url: string;
}

// Texto para quem recebeu um desafio mostrar o próprio desempenho a quem enviou.
// Foca no resultado (quadradinhos + nº de tentativas); o link aponta para a
// home, para o amigo jogar ou criar o próprio desafio.
export function buildChallengeShareText(opts: ChallengeShareOptions): string {
  const squares = opts.guesses.map(proximityEmoji).join("");
  const head = `🔬 Desafio Scientle 🔗`;
  const line = opts.won
    ? `Resolvi seu desafio em ${opts.guesses.length} ${
        opts.guesses.length === 1 ? "tentativa" : "tentativas"
      }! 🎉`
    : `Não consegui resolver seu desafio dessa vez 😢 (X/${MAX_GUESSES})`;
  return `${head}\n${line}\n${squares}\n${opts.url}\n#scientle`;
}
