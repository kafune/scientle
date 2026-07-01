"use client";

import { useEffect } from "react";
import { Scientist } from "@/data/scientists";
import { formatAwards, getBio } from "@/lib/game";
import Flag from "./Flag";
import ScientistImage from "./ScientistImage";

// Widget flutuante com a biografia de um cientista já palpitado. Aberto ao
// clicar na foto na linha do tempo. Fecha no Esc, no X ou clicando fora.
export default function BioWidget({
  scientist,
  onClose,
}: {
  scientist: Scientist | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!scientist) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [scientist, onClose]);

  if (!scientist) return null;

  const bio = getBio(scientist);

  return (
    <div
      className="bio-widget-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Biografia de ${scientist.name}`}
      onClick={onClose}
    >
      <div className="bio-widget" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <div className="bio-widget-head">
          <ScientistImage name={scientist.name} size={72} />
          <div className="bio-widget-id">
            <span className="bio-widget-name">{scientist.name}</span>
            <span className="bio-widget-meta">
              <Flag country={scientist.nationality} size={18} />
              {scientist.field} · {scientist.birthYear} ·{" "}
              {scientist.nationality}
            </span>
            {scientist.awards.length > 0 && (
              <span className="bio-widget-award">
                🏅 {formatAwards(scientist.awards)}
              </span>
            )}
          </div>
        </div>

        <p className="bio-widget-text">
          {bio || "Biografia ainda não cadastrada para este cientista."}
        </p>
      </div>
    </div>
  );
}
