"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface ToastFeedback {
  emoji: string;
  label: string;
  nc: number;
  cc: number;
  hot: boolean;
}

export function IslandToast({ feedback }: { feedback: ToastFeedback | null }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(t);
  }, [feedback]);

  if (!visible || !feedback || !mounted) return null;

  return createPortal(
    <div className="island-toast" role="status" aria-live="polite">
      <div className={`island${feedback.hot ? " hot" : ""}`}>
        <div className="island-expanded">
          <span className="island-emoji" aria-hidden="true">{feedback.emoji}</span>
          <div className="island-verdict">
            <span className="lab">{feedback.label}</span>
            <span className="sub">
              <b>✓ {feedback.nc}</b> · <i>≈ {feedback.cc}</i> de 6
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
