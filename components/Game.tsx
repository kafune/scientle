"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { saveGameResult } from "@/app/actions/game";
import { getUserStats } from "@/app/actions/stats";
import { Scientist } from "@/data/scientists";
import {
  buildChallengeShareText,
  buildShareText,
  compareGuess,
  decodeChallenge,
  findScientist,
  gameDayKey,
  getBio,
  getDailyScientist,
  getHints,
  getRandomScientist,
  GuessResult,
  HINT_COSTS,
  hintPenalty,
  MAX_GUESSES,
  MAX_HINTS,
  nextHintCost,
  puzzleNumber,
  searchScientists,
} from "@/lib/game";
import { GameStats, recordLocalResult } from "@/lib/stats";
import AuthButton from "./AuthButton";
import BioWidget from "./BioWidget";
import ChallengeModal from "./ChallengeModal";
import GuessDistribution from "./GuessDistribution";
import GuessTable from "./GuessTable";
import HowToPlay from "./HowToPlay";
import { IslandToast, ToastFeedback } from "./IslandToast";
import ScientistImage from "./ScientistImage";
import Timeline from "./Timeline";

const HOWTO_SEEN_KEY = "scientle:seen-howto";

type Mode = "daily" | "unlimited" | "challenge";

export default function Game() {
  const { data: session } = useSession();
  const [mode, setMode] = useState<Mode>("daily");

  // Alvo: derivado da data no modo diário; sorteado no modo prática; definido
  // pelo link no modo desafio. O diário é resolvido por fetch para permitir o
  // override secreto do servidor.
  const [dailyTarget, setDailyTarget] = useState<Scientist | null>(null);
  const [unlimitedTarget, setUnlimitedTarget] = useState<Scientist | null>(null);
  const [challengeTarget, setChallengeTarget] = useState<Scientist | null>(null);
  const target =
    mode === "daily"
      ? dailyTarget
      : mode === "challenge"
        ? challengeTarget
        : unlimitedTarget;

  // Cientista cuja bio está aberta no widget da linha do tempo.
  const [bioScientist, setBioScientist] = useState<Scientist | null>(null);
  // Modal de "Desafiar um amigo".
  const [challengeOpen, setChallengeOpen] = useState(false);
  // Origem do site para montar links de desafio (resolvida no cliente).
  const [origin, setOrigin] = useState("https://scientle.kafune.xyz");

  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [query, setQuery] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [toast, setToast] = useState<ToastFeedback | null>(null);
  const toastKey = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // Confete só na vitória "ao vivo" — não dispara ao restaurar um jogo já ganho.
  const interactedRef = useRef(false);
  const confettiFiredRef = useRef(false);

  const hintsStorageKey = `spotle-cientifico:daily-hints:${gameDayKey()}`;

  // Sorteia o alvo do modo prática no cliente (evita mismatch de hidratação).
  useEffect(() => {
    setHydrated(true);
    if (!unlimitedTarget) setUnlimitedTarget(getRandomScientist());
  }, [unlimitedTarget]);

  // Resolve a origem real e detecta um link de desafio (?desafio=token). Se
  // houver, entra no modo desafio com o alvo escolhido por quem compartilhou.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setOrigin(window.location.origin);
    try {
      const token = new URLSearchParams(window.location.search).get("desafio");
      if (token) {
        const t = decodeChallenge(token);
        if (t) {
          setChallengeTarget(t);
          setMode("challenge");
          setGuesses([]);
          setHintsUsed(0);
        }
      }
    } catch {
      /* URL malformada: ignora e segue no diário */
    }
  }, []);

  // Abre o "Como jogar" automaticamente na primeira visita.
  useEffect(() => {
    try {
      if (!localStorage.getItem(HOWTO_SEEN_KEY)) setHowToOpen(true);
    } catch {
      /* storage indisponível: segue sem onboarding */
    }
  }, []);

  function closeHowTo() {
    setHowToOpen(false);
    try {
      localStorage.setItem(HOWTO_SEEN_KEY, "1");
    } catch {
      /* ignora indisponibilidade de storage */
    }
  }

  // Resolve o cientista do dia. O servidor é a fonte de verdade (escolha
  // congelada no banco + override secreto); o cálculo local só é usado como
  // fallback offline, garantindo que o jogo nunca quebre.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let resolved = getDailyScientist();
      try {
        const res = await fetch("/api/daily", { cache: "no-store" });
        if (res.ok) {
          const data: { name: string | null } = await res.json();
          const fromServer = data.name ? findScientist(data.name) : undefined;
          if (fromServer) resolved = fromServer;
        }
      } catch {
        /* offline/erro: usa o sorteio determinístico local */
      }
      if (!cancelled) setDailyTarget(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dailyStorageKey = `spotle-cientifico:daily:${gameDayKey()}`;

  // Restaura o progresso do desafio diário (só após o alvo do dia resolver).
  useEffect(() => {
    if (mode !== "daily" || !hydrated || !dailyTarget) return;
    try {
      const saved = localStorage.getItem(dailyStorageKey);
      if (saved) {
        const names: string[] = JSON.parse(saved);
        const restored = names
          .map((n) => findScientist(n))
          .filter((s): s is Scientist => !!s)
          .map((s) => compareGuess(s, dailyTarget));
        setGuesses(restored);
      } else {
        setGuesses([]);
      }
      const savedHints = localStorage.getItem(hintsStorageKey);
      setHintsUsed(savedHints ? Number(savedHints) || 0 : 0);
    } catch {
      setGuesses([]);
      setHintsUsed(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hydrated, dailyTarget]);

  // Dicas custam de forma crescente (3 → 5 → 7), somadas como penalidade.
  const hints = useMemo(() => (target ? getHints(target) : []), [target]);
  const revealedHints = hints.slice(0, hintsUsed);
  const penalty = hintPenalty(hintsUsed);
  const usedCount = guesses.length + penalty;
  const remaining = MAX_GUESSES - usedCount;
  const upcomingCost = nextHintCost(hintsUsed);

  const won = guesses.some((g) => g.isWin);
  const lost = !won && usedCount >= MAX_GUESSES;
  const over = won || lost;

  const canHint =
    !over &&
    !!target &&
    hintsUsed < MAX_HINTS &&
    upcomingCost !== null &&
    remaining > upcomingCost;

  function useHint() {
    if (!canHint) return;
    const next = hintsUsed + 1;
    setHintsUsed(next);
    if (mode === "daily") {
      try {
        localStorage.setItem(hintsStorageKey, String(next));
      } catch {
        /* ignora indisponibilidade de storage */
      }
    }
  }

  // Ao terminar o desafio diário, registra o resultado nas estatísticas (1x por dia).
  // Anônimo: localStorage. Logado: salva no banco e usa as stats do banco.
  useEffect(() => {
    if (mode !== "daily" || !over || !hydrated) return;
    const local = recordLocalResult({
      dayKey: gameDayKey(),
      puzzleNumber: puzzleNumber(),
      won,
      guessCount: guesses.length,
    });
    setStats(local);

    if (session?.user) {
      (async () => {
        try {
          await saveGameResult({
            guessNames: guesses.map((g) => g.scientist.name),
          });
          const dbStats = await getUserStats();
          if (dbStats) setStats(dbStats);
        } catch {
          /* falha de rede/servidor não pode quebrar o jogo */
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over, mode, hydrated, session]);

  // Celebração na vitória (uma vez por jogo, só quando jogado na sessão atual).
  useEffect(() => {
    if (!won || !interactedRef.current || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const confetti = (await import("canvas-confetti")).default;
        if (cancelled) return;
        const colors = ["#34c77b", "#38c47b", "#d9b933", "#ffffff"];
        confetti({
          particleCount: 100,
          spread: 75,
          origin: { y: 0.6 },
          colors,
        });
        setTimeout(() => {
          if (!cancelled)
            confetti({
              particleCount: 60,
              spread: 110,
              startVelocity: 38,
              origin: { y: 0.5 },
              colors,
            });
        }, 260);
      } catch {
        /* sem confete não quebra o jogo */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [won]);

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://scientle.kafune.xyz";
    const text = buildShareText({
      guesses,
      won,
      streak: stats?.currentStreak ?? 0,
      avg: stats?.avgGuesses ?? null,
      url,
    });
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* usuário cancelou ou compartilhamento indisponível */
    }
  }

  // Compartilha o desempenho num desafio recebido (resultado + link da home).
  async function handleShareChallenge() {
    const url =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://scientle.kafune.xyz";
    const text = buildChallengeShareText({ guesses, won, url });
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* usuário cancelou ou compartilhamento indisponível */
    }
  }

  const tried = useMemo(
    () => new Set(guesses.map((g) => g.scientist.name)),
    [guesses],
  );
  const suggestions = useMemo(
    () => (over ? [] : searchScientists(query, tried)),
    [query, tried, over],
  );

  function submitGuess(scientist: Scientist) {
    if (over || !target) return;
    if (tried.has(scientist.name)) return;

    interactedRef.current = true;
    const result = compareGuess(scientist, target);
    const next = [...guesses, result];
    setGuesses(next);
    setQuery("");
    setActiveSuggestion(0);

    // Calcula feedback para o toast
    const nc = Object.values(result).filter(
      (v) => typeof v === "object" && v !== null && "match" in v && (v as { match: string }).match === "correct"
    ).length;
    const cc = Object.values(result).filter(
      (v) => typeof v === "object" && v !== null && "match" in v && (v as { match: string }).match === "close"
    ).length;
    const isWin = result.isWin;
    const score = nc * 2 + cc;
    toastKey.current += 1;
    setToast({
      emoji: isWin ? "🎉" : score >= 8 ? "🔥" : score >= 4 ? "🙂" : "❄️",
      label: isWin ? "Na mosca!" : score >= 8 ? "Pegando fogo!" : score >= 4 ? "Morno…" : "Frio…",
      nc,
      cc,
      hot: score >= 8 || isWin,
    });

    if (mode === "daily") {
      try {
        localStorage.setItem(
          dailyStorageKey,
          JSON.stringify(next.map((g) => g.scientist.name)),
        );
      } catch {
        /* ignora indisponibilidade de storage */
      }
    }
  }

  function handleSubmitText() {
    if (suggestions.length > 0) {
      submitGuess(suggestions[activeSuggestion] ?? suggestions[0]);
      return;
    }
    const exact = findScientist(query);
    if (exact) submitGuess(exact);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitText();
    } else if (e.key === "Escape") {
      // Limpa a busca / fecha as sugestões sem sair do campo.
      if (query) {
        e.preventDefault();
        setQuery("");
        setActiveSuggestion(0);
      }
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setQuery("");
    setActiveSuggestion(0);
    if (m === "unlimited") {
      setGuesses([]);
      setHintsUsed(0);
      interactedRef.current = false;
      confettiFiredRef.current = false;
    }
  }

  function playAgain() {
    setUnlimitedTarget(getRandomScientist());
    setGuesses([]);
    setHintsUsed(0);
    setQuery("");
    setActiveSuggestion(0);
    interactedRef.current = false;
    confettiFiredRef.current = false;
    inputRef.current?.focus();
  }

  return (
    <div className="layout">
      <main className="app">
      <header className="header">
        <div className="topbar">
          <button
            className="icon-btn"
            onClick={() => setHowToOpen(true)}
            aria-label="Como jogar"
            title="Como jogar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
          <div className="topbar-right">
            <button
              className="icon-btn"
              onClick={() => setChallengeOpen(true)}
              aria-label="Desafiar um amigo"
              title="Desafiar um amigo"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
            <AuthButton />
          </div>
        </div>
        <h1 className="title">
          <span className="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="34" height="34">
              <g fill="none" stroke="currentColor" strokeWidth="4">
                <ellipse cx="32" cy="32" rx="22" ry="9" />
                <ellipse
                  cx="32"
                  cy="32"
                  rx="22"
                  ry="9"
                  transform="rotate(60 32 32)"
                />
                <ellipse
                  cx="32"
                  cy="32"
                  rx="22"
                  ry="9"
                  transform="rotate(120 32 32)"
                />
              </g>
              <circle cx="32" cy="32" r="6" fill="currentColor" />
            </svg>
          </span>
          Scient<span className="dot">le</span>
        </h1>
        <p className="subtitle">
          Adivinhe o cientista do dia em até {MAX_GUESSES} tentativas.
        </p>
      </header>

      <HowToPlay open={howToOpen} onClose={closeHowTo} />

      <div className="modes">
        <button
          className={`mode-btn ${mode === "daily" ? "active" : ""}`}
          onClick={() => switchMode("daily")}
        >
          Desafio diário
        </button>
        <button
          className={`mode-btn ${mode === "unlimited" ? "active" : ""}`}
          onClick={() => switchMode("unlimited")}
        >
          Prática ilimitada
        </button>
        {mode === "challenge" && (
          <button className="mode-btn active" disabled>
            Desafio 🔗
          </button>
        )}
      </div>

      {mode === "challenge" && (
        <div className="challenge-banner">
          🔗 <strong>Desafio de um amigo!</strong> Descubra qual cientista foi
          escolhido para você.
        </div>
      )}

      <div className="status-bar">
        <span className="when">
          {mode === "daily"
            ? `Cientista #${puzzleNumber()}`
            : mode === "challenge"
              ? "Desafio personalizado"
              : "Cientista aleatório"}
        </span>
        <span className="count">
          Tentativa {Math.min(usedCount + (over ? 0 : 1), MAX_GUESSES)} de{" "}
          {MAX_GUESSES}
        </span>
      </div>

      <div className="pips" role="progressbar"
           aria-valuemin={0} aria-valuemax={MAX_GUESSES} aria-valuenow={usedCount}>
        {Array.from({ length: MAX_GUESSES }, (_, i) => {
          let cls = "pip";
          if (i < guesses.length)                    cls += won ? " win" : " used";
          else if (i < guesses.length + penalty)     cls += " penalty";
          return <span key={i} className={cls} />;
        })}
      </div>
      <div className="pip-legend">
        <span className="key"><span className="dot guess" />Palpites</span>
        {penalty > 0 && <span className="key"><span className="dot cost" />Custo de dicas</span>}
        <span className="right">
          {over
            ? (won ? "Resolvido!" : "Sem tentativas")
            : `${remaining} ${remaining === 1 ? "restante" : "restantes"}`}
        </span>
      </div>

      <div className="search-sticky">
      <div className="search">
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          placeholder={over ? "Jogo encerrado" : "Digite seu palpite aqui…"}
          value={query}
          disabled={over || !target}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveSuggestion(0);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          role="combobox"
          aria-label="Buscar cientista para palpitar"
          aria-expanded={suggestions.length > 0}
          aria-controls="suggestion-list"
          aria-autocomplete="list"
          aria-activedescendant={
            suggestions.length > 0
              ? `suggestion-${activeSuggestion}`
              : undefined
          }
        />
        <span className="search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        {suggestions.length > 0 && (
          <div className="suggestions" id="suggestion-list" role="listbox">
            {suggestions.map((s, i) => (
              <div
                key={s.name}
                id={`suggestion-${i}`}
                role="option"
                aria-selected={i === activeSuggestion}
                className={`suggestion ${i === activeSuggestion ? "active" : ""}`}
                onMouseEnter={() => setActiveSuggestion(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  submitGuess(s);
                }}
              >
                <span className="sug-left">
                  <ScientistImage name={s.name} size={30} />
                  {s.name}
                </span>
                <span className="meta">
                  {s.field} · {s.nationality}
                </span>
              </div>
            ))}
          </div>
        )}
        {!over && query.trim() !== "" && suggestions.length === 0 && (
          <div className="suggestions-empty" role="status">
            Nenhum cientista encontrado para “{query.trim()}”.
          </div>
        )}
      </div>
      </div>

      {guesses.length === 0 && !over && (
        <div className="empty-state">
          <p>Cada palpite compara <b>6 atributos</b> com o cientista do dia:</p>
          <div className="empty-cats">
            {[
              ["🔬", "Área"], ["📅", "Nascimento"], ["🌍", "País"],
              ["⚧",  "Gênero"], ["🏅", "Prêmio"],  ["❤️", "Status"],
            ].map(([ico, lbl]) => (
              <div className="empty-cat" key={lbl}>
                <span aria-hidden="true">{ico}</span>
                <span>{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!over && (
        <div className="hints">
          <button
            className="hint-btn"
            onClick={useHint}
            disabled={!canHint}
            title={
              hintsUsed >= MAX_HINTS
                ? "Todas as dicas já reveladas"
                : upcomingCost !== null && remaining <= upcomingCost
                  ? "Tentativas insuficientes para esta dica"
                  : "Revela uma dica sobre o cientista"
            }
          >
            {upcomingCost !== null
              ? `💡 Revelar dica (−${upcomingCost})`
              : "💡 Sem mais dicas"}
          </button>
          <div className="hint-ladder" aria-label="Custo crescente das dicas">
            {HINT_COSTS.map((c, i) => (
              <span
                key={i}
                className={`hint-step ${i < hintsUsed ? "done" : i === hintsUsed ? "next" : ""}`}
                title={`Dica ${i + 1} custa ${c} tentativa${c > 1 ? "s" : ""}`}
              >
                −{c}
              </span>
            ))}
          </div>
        </div>
      )}

      {revealedHints.length > 0 && (
        <div className="hint-list">
          {revealedHints.map((h, i) => (
            <div className="hint-item" key={i}>
              <span className="hint-key">Dica {i + 1}</span>
              <span className="hint-val">{h}</span>
            </div>
          ))}
        </div>
      )}

      {guesses.length > 0 && (
        <Timeline
          guesses={guesses}
          onSelect={setBioScientist}
          variant="inline"
        />
      )}

      {guesses.length > 0 && <GuessTable guesses={guesses} />}

      {over && target && (
        <div className={`result ${won ? "win" : ""}`}>
          <div className="reveal">
            <ScientistImage name={target.name} size={128} />
          </div>
          {won ? (
            <>
              <h2>🎉 Acertou!</h2>
              <p>
                Você descobriu <span className="answer">{target.name}</span> em{" "}
                {guesses.length}{" "}
                {guesses.length === 1 ? "tentativa" : "tentativas"}.
              </p>
            </>
          ) : (
            <>
              <h2>😢 Fim de jogo</h2>
              <p>
                O cientista era <span className="answer">{target.name}</span>.
              </p>
            </>
          )}
          {getBio(target) && (
            <p className="bio">
              <strong>{target.name}.</strong> {getBio(target)}
            </p>
          )}
          {mode === "unlimited" ? (
            <button className="btn" onClick={playAgain}>
              Jogar novamente
            </button>
          ) : mode === "challenge" ? (
            <div className="challenge-end">
              <button className="btn" onClick={handleShareChallenge}>
                {copied ? "Copiado! ✅" : "Compartilhar resultado"}
              </button>
              <button
                className="challenge-copy"
                onClick={() => setChallengeOpen(true)}
              >
                Criar meu desafio
              </button>
              <button
                className="challenge-copy"
                onClick={() => switchMode("daily")}
              >
                Jogar o desafio diário
              </button>
            </div>
          ) : (
            <>
              {stats && (
                <div className="stats">
                  <div className="stat">
                    <span className="stat-num">🔥 {stats.currentStreak}</span>
                    <span className="stat-label">Sequência</span>
                  </div>
                  <div className="stat">
                    <span className="stat-num">{stats.maxStreak}</span>
                    <span className="stat-label">Recorde</span>
                  </div>
                  <div className="stat">
                    <span className="stat-num">
                      {stats.avgGuesses != null
                        ? stats.avgGuesses.toFixed(1)
                        : "—"}
                    </span>
                    <span className="stat-label">Média</span>
                  </div>
                  <div className="stat">
                    <span className="stat-num">{stats.wins}</span>
                    <span className="stat-label">Vitórias</span>
                  </div>
                </div>
              )}
              {stats && (
                <GuessDistribution
                  distribution={stats.distribution}
                  highlight={won ? guesses.length : null}
                />
              )}
              <button className="btn" onClick={handleShare}>
                {copied ? "Copiado! ✅" : "Compartilhar resultado"}
              </button>
              <p className="subtitle">
                Volte às 21h (horário de Brasília) para um novo cientista!
              </p>
            </>
          )}
        </div>
      )}

      <div className="legend">
        <span>
          <span className="swatch correct" />
          Correto
        </span>
        <span>
          <span className="swatch close" />
          Próximo
        </span>
        <span>
          <span className="swatch wrong" />
          Distante
        </span>
        <span>↑ / ↓ indica se o cientista nasceu depois / antes</span>
      </div>
      </main>

      <Timeline
        guesses={guesses}
        onSelect={setBioScientist}
        variant="rail"
      />

      <BioWidget
        scientist={bioScientist}
        onClose={() => setBioScientist(null)}
      />

      <ChallengeModal
        open={challengeOpen}
        origin={origin}
        onClose={() => setChallengeOpen(false)}
      />

      <IslandToast key={toastKey.current} feedback={toast} />
    </div>
  );
}
