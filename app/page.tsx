import { formatWindow, loadLatest } from "@/lib/snapshots";

export const dynamic = "force-static";

export default async function HomePage() {
  const data = await loadLatest();

  return (
    <main className="home-stub">
      <p className="home-stub__kicker">
        Pipeline stub · robots noindex
      </p>
      <h1>
        Can You See the Northern Lights Tonight?
      </h1>
      <p className="home-stub__lead">
        It depends on your location. This deploy is the GitHub → Vercel path, not the indexed product yet.
        Snapshot generated {new Date(data.generated_at).toISOString()}.
      </p>
      <h2>Tonight in the US (Wave 1)</h2>
      <div className="home-stub__table-wrap">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Place</th>
              <th>Headline point</th>
              <th>Window</th>
              <th>Obstacle</th>
            </tr>
          </thead>
          <tbody>
            {data.locations.map((row) => (
              <tr key={row.location_slug}>
                <td className="home-stub__status">{row.status}</td>
                <td>{row.location_slug}</td>
                <td>{row.headline_point_name}</td>
                <td>{formatWindow(row.best_window_start, row.best_window_end)}</td>
                <td>{row.main_obstacle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
