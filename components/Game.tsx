"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Scientist } from "@/data/scientists";
import {
  compareGuess,
  findScientist,
  getDailyScientist,
  getRandomScientist,
  GuessResult,
  MAX_GUESSES,
  searchScientists,
  todayKey,
} from "@/lib/game";
import GuessTable from "./GuessTable";
import ScientistImage from "./ScientistImage";

type Mode = "daily" | "unlimited";

export default function Game() {
  const [mode, setMode] = useState<Mode>("daily");

  // Alvo: derivado da data no modo diário; sorteado no modo prática.
  const dailyTarget = useMemo(() => getDailyScientist(), []);
  const [unlimitedTarget, setUnlimitedTarget] = useState<Scientist | null>(null);
  const target = mode === "daily" ? dailyTarget : unlimitedTarget;

  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [query, setQuery] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sorteia o alvo do modo prática no cliente (evita mismatch de hidratação).
  useEffect(() => {
    setHydrated(true);
    if (!unlimitedTarget) setUnlimitedTarget(getRandomScientist());
  }, [unlimitedTarget]);

  const dailyStorageKey = `spotle-cientifico:daily:${todayKey()}`;

  // Restaura o progresso do desafio diário.
  useEffect(() => {
    if (mode !== "daily" || !hydrated) return;
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
    } catch {
      setGuesses([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hydrated]);

  const won = guesses.some((g) => g.isWin);
  const lost = !won && guesses.length >= MAX_GUESSES;
  const over = won || lost;

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
    if (m === "unlimited") setGuesses([]);
  }

  function playAgain() {
    setUnlimitedTarget(getRandomScientist());
    setGuesses([]);
    setQuery("");
    setActiveSuggestion(0);
    inputRef.current?.focus();
  }

  return (
    <main className="app">
      <header className="header">
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
          {mode === "daily" ? `Desafio de ${todayKey()}` : "Cientista aleatório"}
        </span>
        <span className="count">
          Tentativa {Math.min(guesses.length + (over ? 0 : 1), MAX_GUESSES)} de{" "}
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
            <p className="subtitle">Volte amanhã para um novo desafio!</p>
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
