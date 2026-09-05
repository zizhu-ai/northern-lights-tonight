/**
 * Search-form navigation rules. Kept dependency-free for the Node test runner.
 */

export function planTypedSubmit(checking: boolean): {
  proceed: boolean;
  cancelGps: boolean;
} {
  if (checking) return { proceed: false, cancelGps: false };
  return { proceed: true, cancelGps: true };
}

export function planLocate(checking: boolean): { proceed: boolean } {
  return { proceed: !checking };
}

export function checkingAfterLookup(kind: "error" | "ambiguous" | "navigate"): boolean {
  return kind === "navigate";
}
