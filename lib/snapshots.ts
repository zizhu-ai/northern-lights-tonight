import { readFile } from "node:fs/promises";
import path from "node:path";

export type SnapshotRow = {
  location_slug: string;
  headline_point_name: string;
  status: "GO" | "MAYBE" | "NO" | "UNKNOWN";
  confidence: "high" | "medium" | "low";
  best_window_start: string | null;
  best_window_end: string | null;
  main_obstacle: string;
  answer_sentence: string;
};

export type SnapshotBundle = {
  generated_at: string;
  ovation_ok: boolean;
  seo_indexable: boolean;
  locations: SnapshotRow[];
};

export async function loadLatest(): Promise<SnapshotBundle> {
  const file = path.join(process.cwd(), "snapshots", "latest.json");
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw) as SnapshotBundle;
}

export function formatWindow(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const a = new Date(start);
  const b = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${fmt(a)}–${fmt(b)}`;
}
