// @ts-ignore TS5097
import { REASON_COPY } from "./aurora-engine/index.ts";

export function reasonText(code: string | undefined | null, place: string): string {
  if (!code) return "";
  const template = REASON_COPY[code];
  return template ? template.replace("{place}", place) : "";
}
