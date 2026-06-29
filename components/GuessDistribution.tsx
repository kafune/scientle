"use client";

import { useEffect, useState } from "react";

function useCountdown() {
  const [s, setS] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date(), next = new Date(now);
      next.setHours(21, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      const d  = Math.max(0, Math.floor((+next - +now) / 1000));
      const h  = String(Math.floor(d / 3600)).padStart(2, "0");
      const m  = String(Math.floor((d % 3600) / 60)).padStart(2, "0");
      const sc = String(d % 60).padStart(2, "0");
      setS(`${h}:${m}:${sc}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return s;
}

// Histograma compacto de tentativas até a vitória. Mostra apenas faixas com
// dados (e a faixa do jogo atual), evitando 20 linhas vazias.
export default function GuessDistribution({
  distribution,
  highlight,
}: {
  distribution: number[];
  highlight?: number | null;
}) {
  const countdown = useCountdown();
  const max = Math.max(1, ...distribution);
  const lastNonZero = distribution.reduce(
    (acc, v, i) => (v > 0 ? i : acc),
    -1,
  );
  const upTo = Math.max(lastNonZero, (highlight ?? 0) - 1);
  if (upTo < 0) return null;

  const rows = Array.from({ length: upTo + 1 }, (_, i) => i);

  return (
    <div className="dist">
      <div className="dist-title">Distribuição de tentativas</div>
      <div className="dist-rows">
        {rows.map((i) => {
          const count = distribution[i] ?? 0;
          const pct = count > 0 ? Math.max((count / max) * 100, 14) : 0;
          const isHi = highlight === i + 1;
          return (
            <div className="dist-row" key={i}>
              <span className="dist-num">{i + 1}</span>
              <div className="dist-track">
                <div
                  className={`dist-bar ${isHi ? "hi" : ""}${count === 0 ? " empty" : ""}`}
                  style={{ width: `${pct}%` }}
                >
                  <span className="dist-count">{count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="countdown">
        <div className="cd-label">Próximo cientista em</div>
        <div className="cd-time">{countdown}</div>
      </div>
    </div>
  );
}
