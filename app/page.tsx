import { formatWindow, loadLatest } from "@/lib/snapshots";

export const dynamic = "force-static";

export default async function HomePage() {
  const data = await loadLatest();

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 20px 64px" }}>
      <p style={{ opacity: 0.7, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        Pipeline stub · robots noindex
      </p>
      <h1 style={{ fontSize: 32, lineHeight: 1.2, margin: "12px 0 8px" }}>
        Can You See the Northern Lights Tonight?
      </h1>
      <p style={{ opacity: 0.85, maxWidth: 560 }}>
        It depends on your location. This deploy is the GitHub → Vercel path, not the indexed product yet.
        Snapshot generated {new Date(data.generated_at).toISOString()}.
      </p>
      <h2 style={{ marginTop: 36, fontSize: 18 }}>Tonight in the US (Wave 1)</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", opacity: 0.6 }}>
            <th style={{ padding: "8px 8px 8px 0" }}>Status</th>
            <th>Place</th>
            <th>Headline point</th>
            <th>Window</th>
            <th>Obstacle</th>
          </tr>
        </thead>
        <tbody>
          {data.locations.map((row) => (
            <tr key={row.location_slug} style={{ borderTop: "1px solid #243049" }}>
              <td style={{ padding: "10px 8px 10px 0", fontWeight: 700 }}>{row.status}</td>
              <td>{row.location_slug}</td>
              <td>{row.headline_point_name}</td>
              <td>{formatWindow(row.best_window_start, row.best_window_end)}</td>
              <td style={{ opacity: 0.8 }}>{row.main_obstacle}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
