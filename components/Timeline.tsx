"use client";

import { useMemo } from "react";
import { Scientist } from "@/data/scientists";
import { guessProximity, GuessResult } from "@/lib/game";
import ScientistImage from "./ScientistImage";

// Linha do tempo dos palpites, ordenada por ano de nascimento. Cada nó traz a
// foto do cientista (clicável para abrir a bio) e um ponto colorido pela
// proximidade do palpite. Renderizada como trilho lateral (desktop) e como
// faixa inline (mobile) — controlado por `variant` + CSS.
export default function Timeline({
  guesses,
  onSelect,
  variant = "rail",
}: {
  guesses: GuessResult[];
  onSelect: (s: Scientist) => void;
  variant?: "rail" | "inline";
}) {
  // Ordena por ano de nascimento (mais antigo no topo); empate pelo nome.
  const ordered = useMemo(
    () =>
      [...guesses].sort(
        (a, b) =>
          a.scientist.birthYear - b.scientist.birthYear ||
          a.scientist.name.localeCompare(b.scientist.name, "pt"),
      ),
    [guesses],
  );

  return (
    <aside className={`timeline timeline-${variant}`} aria-label="Linha do tempo dos palpites">
      <div className="timeline-title">
        <span aria-hidden="true">🕰️</span> Linha do tempo
      </div>

      {ordered.length === 0 ? (
        <p className="timeline-empty">
          Seus palpites aparecerão aqui, em ordem de nascimento.
        </p>
      ) : (
        <ol className="timeline-list">
          {ordered.map((g) => {
            const s = g.scientist;
            const level = guessProximity(g);
            return (
              <li className="timeline-node" key={s.name}>
                <span className={`timeline-dot ${level}`} aria-hidden="true" />
                <button
                  type="button"
                  className="timeline-photo-btn"
                  onClick={() => onSelect(s)}
                  aria-label={`Ver biografia de ${s.name}`}
                  title={`Ver biografia de ${s.name}`}
                >
                  <ScientistImage name={s.name} size={40} />
                </button>
                <span className="timeline-info">
                  <span className="timeline-year">{s.birthYear}</span>
                  <span className="timeline-name">{s.name}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
