"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { saveGameResult } from "@/app/actions/game";
import { getUserStats } from "@/app/actions/stats";
import { Scientist } from "@/data/scientists";
import {
  buildHints,
  buildShareText,
  compareGuess,
  findScientist,
  gameDayKey,
  getDailyScientist,
  getRandomScientist,
  GuessResult,
  HINT_COST,
  MAX_GUESSES,
  puzzleNumber,
  searchScientists,
} from "@/lib/game";
import { GameStats, recordLocalResult } from "@/lib/stats";
import AuthButton from "./AuthButton";
import GuessTable from "./GuessTable";
import ScientistImage from "./ScientistImage";

type Mode = "daily" | "unlimited";

export default function Game() {
  const { data: session } = useSession();
  const [mode, setMode] = useState<Mode>("daily");

  // Alvo: derivado da data no modo diário; sorteado no modo prática.
  // O diário é resolvido por fetch para permitir o override secreto do servidor.
  const [dailyTarget, setDailyTarget] = useState<Scientist | null>(null);
  const [unlimitedTarget, setUnlimitedTarget] = useState<Scientist | null>(null);
  const target = mode === "daily" ? dailyTarget : unlimitedTarget;

  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [query, setQuery] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hintsStorageKey = `spotle-cientifico:daily-hints:${gameDayKey()}`;

  // Sorteia o alvo do modo prática no cliente (evita mismatch de hidratação).
  useEffect(() => {
    setHydrated(true);
    if (!unlimitedTarget) setUnlimitedTarget(getRandomScientist());
  }, [unlimitedTarget]);

  // Resolve o cientista do dia: aplica o override secreto do servidor se houver;
  // em qualquer falha, cai no sorteio determinístico padrão (jogo nunca quebra).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let resolved = getDailyScientist();
      try {
        const res = await fetch("/api/daily", { cache: "no-store" });
        if (res.ok) {
          const data: { name: string | null } = await res.json();
          const override = data.name ? findScientist(data.name) : undefined;
          if (override) resolved = override;
        }
      } catch {
        /* offline/erro: usa o sorteio padrão */
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

  // Cada dica custa HINT_COST tentativas (penalidade somada aos palpites).
  const hints = useMemo(() => (target ? buildHints(target) : []), [target]);
  const revealedHints = hints.slice(0, hintsUsed);
  const penalty = hintsUsed * HINT_COST;
  const usedCount = guesses.length + penalty;
  const remaining = MAX_GUESSES - usedCount;

  const won = guesses.some((g) => g.isWin);
  const lost = !won && usedCount >= MAX_GUESSES;
  const over = won || lost;

  const canHint = !over && !!target && hintsUsed < hints.length && remaining > HINT_COST;

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
            won,
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

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://spotle-cientifico";
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

    const result = compareGuess(scientist, target);
    const next = [...guesses, result];
    setGuesses(next);
    setQuery("");
    setActiveSuggestion(0);

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
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setQuery("");
    setActiveSuggestion(0);
    if (m === "unlimited") {
      setGuesses([]);
      setHintsUsed(0);
    }
  }

  function playAgain() {
    setUnlimitedTarget(getRandomScientist());
    setGuesses([]);
    setHintsUsed(0);
    setQuery("");
    setActiveSuggestion(0);
    inputRef.current?.focus();
  }

  return (
    <main className="app">
      <header className="header">
        <div className="topbar">
          <AuthButton />
        </div>
        <h1 className="title">
          Spotle <span className="dot">Científico</span>
        </h1>
        <p className="subtitle">
          Adivinhe o cientista misterioso em até {MAX_GUESSES} tentativas.
        </p>
      </header>

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
      </div>

      <div className="status-bar">
        <span className="when">
          {mode === "daily"
            ? `Cientista #${puzzleNumber()}`
            : "Cientista aleatório"}
        </span>
        <span className="count">
          Tentativa {Math.min(usedCount + (over ? 0 : 1), MAX_GUESSES)} de{" "}
          {MAX_GUESSES}
        </span>
      </div>

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
        />
        <span className="search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        {suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((s, i) => (
              <div
                key={s.name}
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
      </div>

      {!over && (
        <div className="hints">
          <button
            className="hint-btn"
            onClick={useHint}
            disabled={!canHint}
            title={
              hintsUsed >= hints.length
                ? "Todas as dicas reveladas"
                : remaining <= HINT_COST
                  ? "Tentativas insuficientes para uma dica"
                  : `Revela um atributo do cientista e custa ${HINT_COST} tentativas`
            }
          >
            💡 Dica (−{HINT_COST} tentativas)
          </button>
          {hintsUsed > 0 && (
            <span className="hint-cost">
              {hintsUsed} {hintsUsed === 1 ? "dica usada" : "dicas usadas"} ·
              −{penalty} tentativas
            </span>
          )}
        </div>
      )}

      {revealedHints.length > 0 && (
        <div className="hint-list">
          {revealedHints.map((h) => (
            <div className="hint-item" key={h.label}>
              <span className="hint-key">{h.label}</span>
              <span className="hint-val">{h.value}</span>
            </div>
          ))}
        </div>
      )}

      {guesses.length > 0 && <GuessTable guesses={guesses} />}

      {over && target && (
        <div className="result">
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
          {mode === "unlimited" ? (
            <button className="btn" onClick={playAgain}>
              Jogar novamente
            </button>
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
  );
}
