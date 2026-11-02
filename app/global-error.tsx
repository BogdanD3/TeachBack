"use client";

// Last-resort error page when the root layout itself fails. Must render its own <html>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#FBF7F0", color: "#1E2A3A", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "96px 16px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36 }}>Teachback hit a snag</h1>
          <p style={{ color: "#5A6472" }}>Something went wrong while loading the page. Try again in a moment.</p>
          <button
            onClick={reset}
            style={{ marginTop: 24, height: 48, padding: "0 24px", borderRadius: 999, border: 0, background: "#E4572E", color: "#fff", fontWeight: 600, fontSize: 16, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
