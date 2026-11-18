// Shared helpers for check.mjs.

/** Achievement tier thresholds: base, x2 (bronze), x3 (silver), x4 (gold). */
export const TIERS = {
  pullShark: [2, 16, 128, 1024],
  starstruck: [16, 128, 512, 4096],
  pairExtraordinaire: [1, 10, 24, 48],
  galaxyBrain: [2, 8, 16, 32],
};

/** Index of the highest tier reached, or -1 if none. */
export function tierIndex(value, steps) {
  let reached = -1;
  steps.forEach((s, i) => { if (value >= s) reached = i; });
  return reached;
}

/** Human-readable tier status, e.g. "x2 (Bronze), next at 128". */
export function tier(value, steps) {
  const names = ["Bronze", "Silver", "Gold"];
  const reached = tierIndex(value, steps);
  const label = reached === -1 ? "not yet" : reached === 0 ? "Base" : `x${reached + 1} (${names[reached - 1]})`;
  const next = steps[reached + 1];
  return next ? `${label}, next at ${next}` : `${label}, max tier`;
}

/** True when an issue or PR was closed within five minutes of being opened. */
export function isQuickdraw(item) {
  if (!item.closed_at) return false;
  return new Date(item.closed_at) - new Date(item.created_at) <= 5 * 60 * 1000;
}
