"use client";

import { useEffect } from "react";
import { AWARDS, FIELDS } from "@/data/scientists";
import { MAX_GUESSES } from "@/lib/game";

// Modal de boas-vindas / "Como jogar". Abre automaticamente na primeira visita
// (controlado pelo Game) e pode ser reaberto pelo botão de info no topo.
export default function HowToPlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Fecha no Esc e trava o scroll do body enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Como jogar"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Fechar"
        >
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

        <h2 className="modal-title">
          Como jogar <span aria-hidden="true">🔬</span>
        </h2>
        <p className="modal-sub">
          Descubra o cientista do dia em até {MAX_GUESSES} tentativas.
        </p>

        <p>
          A cada palpite, seis atributos são comparados com os do cientista do
          dia: <strong>área</strong>, <strong>nascimento</strong>,{" "}
          <strong>país</strong>, <strong>gênero</strong>,{" "}
          <strong>prêmio</strong> e <strong>status</strong> (vivo ou falecido).
        </p>

        <div className="modal-legend">
          <div className="modal-legend-row">
            <span className="modal-legend-chip correct" aria-hidden="true" />
            <span className="modal-legend-text">
              <strong>Verde</strong>
              <span>Atributo idêntico ao do cientista do dia.</span>
            </span>
          </div>
          <div className="modal-legend-row">
            <span className="modal-legend-chip close" aria-hidden="true" />
            <span className="modal-legend-text">
              <strong>Amarelo</strong>
              <span>Você chegou perto (ex.: mesma grande área ou mesmo continente).</span>
            </span>
          </div>
          <div className="modal-legend-row">
            <span className="modal-legend-chip wrong" aria-hidden="true" />
            <span className="modal-legend-text">
              <strong>Cinza</strong>
              <span>Atributo distante. As setas ↑ / ↓ indicam se o alvo nasceu depois / antes.</span>
            </span>
          </div>
        </div>

        <div className="howto-example">
          <p className="ex-label">Exemplo — o alvo é química, nascida em 1867</p>
          <div className="ex-row">
            <div className="ex-tile correct">
              <span className="t">✓ Área</span>
              <span className="v">Química</span>
            </div>
            <div className="ex-tile close">
              <span className="t">≈ Nasc.</span>
              <span className="v">1889 ↓</span>
            </div>
            <div className="ex-tile wrong">
              <span className="t">✕ País</span>
              <span className="v">EUA</span>
            </div>
          </div>
        </div>

        <p>
          <strong>Áreas consideradas:</strong> {FIELDS.join(", ")}.
        </p>
        <p>
          <strong>Prêmios considerados:</strong> {AWARDS.join(", ")}. Cientistas
          sem nenhum desses prêmios aparecem como <em>Nenhum</em> — outras
          honrarias não entram nesse atributo. Alguns têm mais de um prêmio
          (duplo-laureados); nesse caso o <strong>verde</strong> exige
          exatamente os mesmos prêmios, o <strong>amarelo</strong> indica ao
          menos um prêmio em comum e o <strong>cinza</strong>, nenhum em comum.
        </p>

        <button className="modal-cta" onClick={onClose}>
          Começar a jogar
        </button>
      </div>
    </div>
  );
}
