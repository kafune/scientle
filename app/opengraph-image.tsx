import { ImageResponse } from "next/og";

export const alt = "Scientle — adivinhe o cientista do dia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0f0f",
          color: "#f2f2f2",
          fontFamily: "sans-serif",
        }}
      >
        <svg viewBox="0 0 64 64" width="150" height="150">
          <g fill="none" stroke="#2fa069" strokeWidth="3">
            <ellipse cx="32" cy="32" rx="22" ry="9" />
            <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(60 32 32)" />
            <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(120 32 32)" />
          </g>
          <circle cx="32" cy="32" r="5.5" fill="#2fa069" />
        </svg>
        <div style={{ display: "flex", fontSize: 110, fontWeight: 800, marginTop: 24 }}>
          <span>Scient</span>
          <span style={{ color: "#2fa069" }}>le</span>
        </div>
        <div style={{ fontSize: 38, color: "#9a9a9a", marginTop: 8 }}>
          Adivinhe o cientista do dia
        </div>
      </div>
    ),
    { ...size },
  );
}
