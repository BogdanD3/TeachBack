import { ImageResponse } from "next/og";

export const alt = "Teachback — Learn it by teaching it. Explain it to Pip.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FBF7F0", padding: 80, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          <div style={{ fontSize: 34, color: "#5A6472", letterSpacing: 2 }}>teachback</div>
          <div style={{ fontSize: 92, color: "#1E2A3A", fontWeight: 700, lineHeight: 1.05, marginTop: 24, display: "flex", flexWrap: "wrap" }}>
            Learn it by&nbsp;
            <span style={{ background: "linear-gradient(to top, #FFD166 0, #FFD166 40%, transparent 40%)" }}>teaching</span>
            &nbsp;it.
          </div>
          <div style={{ fontSize: 34, color: "#5A6472", marginTop: 28 }}>Explain it to Pip. Find out what you really understand.</div>
        </div>
        <div style={{ display: "flex", position: "relative", width: 300, height: 300 }}>
          <svg width="300" height="300" viewBox="0 0 120 120">
            <path d="M60 22c22 0 38 16 39 40 1 22-14 40-39 40S20 86 21 63c1-25 17-41 39-41Z" fill="#E4572E" stroke="#C2441F" strokeWidth="2" />
            <circle cx="48" cy="58" r="4.5" fill="#1E2A3A" />
            <circle cx="72" cy="58" r="4.5" fill="#1E2A3A" />
            <path d="M54 77 Q57 73 60 77 Q63 81 66 76" stroke="#1E2A3A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
          {/* Satori can't render SVG <text>, so the "?" bubble is a div. */}
          <div style={{ position: "absolute", top: 12, right: 8, width: 66, height: 66, borderRadius: 999, background: "#FFD166", border: "4px solid #1E2A3A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 700, color: "#1E2A3A" }}>
            ?
          </div>
        </div>
      </div>
    ),
    size,
  );
}
