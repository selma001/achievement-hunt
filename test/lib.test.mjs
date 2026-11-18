import { test } from "node:test";
import assert from "node:assert/strict";
import { TIERS, tierIndex, tier, isQuickdraw } from "../lib.mjs";

test("tierIndex returns -1 below the base threshold", () => {
  assert.equal(tierIndex(1, TIERS.pullShark), -1);
});

test("tierIndex counts thresholds as reached", () => {
  assert.equal(tierIndex(2, TIERS.pullShark), 0);
  assert.equal(tierIndex(16, TIERS.pullShark), 1);
  assert.equal(tierIndex(5000, TIERS.pullShark), 3);
});

test("tier describes progress and the next threshold", () => {
  assert.equal(tier(0, TIERS.pullShark), "not yet, next at 2");
  assert.equal(tier(6, TIERS.pullShark), "Base, next at 16");
  assert.equal(tier(16, TIERS.pullShark), "x2 (Bronze), next at 128");
  assert.equal(tier(512, TIERS.starstruck), "x3 (Silver), next at 4096");
  assert.equal(tier(4096, TIERS.starstruck), "x4 (Gold), max tier");
});

test("isQuickdraw accepts closes within five minutes", () => {
  const created_at = "2026-01-01T00:00:00Z";
  assert.equal(isQuickdraw({ created_at, closed_at: "2026-01-01T00:05:00Z" }), true);
  assert.equal(isQuickdraw({ created_at, closed_at: "2026-01-01T00:05:01Z" }), false);
  assert.equal(isQuickdraw({ created_at, closed_at: null }), false);
});
