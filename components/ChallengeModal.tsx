"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Scientist } from "@/data/scientists";
import {
  buildChallengeUrl,
  getRandomScientist,
  searchScientists,
} from "@/lib/game";
import ScientistImage from "./ScientistImage";

const EMPTY = new Set<string>();

// Modal para criar um desafio: escolha um cientista e gere um link + QR Code
// que abrem uma prática com esse alvo. Quem recebe não vê o nome na URL (token
// ofuscado), mas pode tentar adivinhar.
export default function ChallengeModal({
  open,
  origin,
  onClose,
}: {
  open: boolean;
  origin: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Scientist | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Reset ao reabrir.
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(null);
      setCopied(false);
    }
  }, [open]);

  const suggestions = useMemo(
    () => (selected ? [] : searchScientists(query, EMPTY, 30)),
    [query, selected],
  );

  const url = selected ? buildChallengeUrl(origin, selected.name) : "";

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  }

  async function shareLink() {
    if (!url) return;
    const text = `🔬 Desafio Scientle: descubra qual cientista eu escolhi!\n${url}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text });
      } else {
        await copyLink();
      }
    } catch {
      /* cancelado */
    }
  }

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Desafiar um amigo"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
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

        <h2 className="modal-title">
          Desafiar um amigo <span aria-hidden="true">🔗</span>
        </h2>
        <p className="modal-sub">
          Escolha um cientista e envie o link (ou o QR Code). Quem receber tenta
          adivinhar — sem ver a resposta na URL.
        </p>

        {!selected ? (
          <>
            <div className="search challenge-search">
              <input
                ref={inputRef}
                className="search-input"
                type="text"
                placeholder="Buscar o cientista do desafio…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                aria-label="Buscar cientista para o desafio"
              />
              {suggestions.length > 0 && (
                <div className="suggestions" role="listbox">
                  {suggestions.map((s) => (
                    <div
                      key={s.name}
                      role="option"
                      aria-selected={false}
                      className="suggestion"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelected(s);
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
            <button
              className="challenge-random"
              onClick={() => setSelected(getRandomScientist())}
            >
              🎲 Escolher aleatório
            </button>
          </>
        ) : (
          <div className="challenge-result">
            <div className="challenge-chosen">
              <ScientistImage name={selected.name} size={48} />
              <div className="challenge-chosen-id">
                <span className="challenge-chosen-name">{selected.name}</span>
                <button
                  className="challenge-change"
                  onClick={() => {
                    setSelected(null);
                    setQuery("");
                  }}
                >
                  trocar cientista
                </button>
              </div>
            </div>

            <div className="challenge-qr">
              <QRCodeSVG
                value={url}
                size={184}
                bgColor="#ffffff"
                fgColor="#0b0c0f"
                level="M"
                marginSize={2}
              />
            </div>

            <div className="challenge-link">{url}</div>

            <div className="challenge-actions">
              <button className="modal-cta" onClick={shareLink}>
                Compartilhar desafio
              </button>
              <button className="challenge-copy" onClick={copyLink}>
                {copied ? "Link copiado! ✅" : "Copiar link"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
