"use client";

import copy from "@/content/ui-copy.json";

// Replaces the root layout when it is the thing that failed, so this file cannot
// rely on the site chrome, fonts, or stylesheets loading at all.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-US">
      <body
        style={{
          margin: 0,
          padding: "4rem 1.5rem",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: "#12161C",
          background: "#FBFCFD",
        }}
      >
        <main style={{ maxWidth: "36rem", marginInline: "auto" }}>
          <h1 style={{ fontSize: "1.75rem", lineHeight: 1.2 }}>{copy.error.title}</h1>
          <p style={{ color: "#4A5568" }}>{copy.error.body}</p>
          <p style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                font: "inherit",
                padding: "0.6rem 1.1rem",
                borderRadius: "0.5rem",
                border: "1px solid #12161C",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {copy.chrome.try_again}
            </button>
            <a href="/" style={{ alignSelf: "center", color: "#1F3875" }}>
              {copy.error.home_cta}
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
