import { test } from "node:test";
import assert from "node:assert/strict";
import { branchIdentity, branchSelection, uniqueBranches } from "../src/lib/client-branches.ts";

const location = (branch, extra = {}) => ({ branch, commune: "Temuco", city: "Temuco", ...extra });

test("same location with different contacts, payments and project codes appears once", () => {
  const branches = uniqueBranches([
    { id: 3, ...location("MALL PORTAL TEMUCO S506"), attention: "Juanita", projectCode: "A" },
    { id: 1, ...location(" mall portal temuco s506 "), attention: "Marlon", projectCode: "B" },
    { id: 2, ...location("Mall Portal Temuco", { commune: "TEMUCO" }), payment: "Contado" },
  ]);
  assert.equal(branches.length, 1);
  assert.equal(branches[0].id, 1);
  assert.deepEqual(branches[0].memberIds, [1, 2, 3]);
});

test("confirmed Ingevec aliases share one identity, but Paris S506 remains separate", () => {
  const mall = branchIdentity(location("Mall Portal Temuco"));
  for (const name of ["Cenco Temuco", "Cenco Mall Temuco", "CENCOMALL", "CENCO", "Shopping 506"]) {
    assert.equal(branchIdentity(location(name)), mall);
  }
  for (const name of ["LOCAL S506", "PARÍS TEMUCO S506", "S506", "P606"]) {
    assert.notEqual(branchIdentity(location(name)), mall);
  }
  assert.notEqual(branchIdentity(location("CENCOMALL", { commune: "Santiago", city: "Santiago" })), mall);
});

test("location normalization handles case, accents and whitespace without merging cities", () => {
  assert.equal(branchIdentity(location("  Sucursal   Viña ")), branchIdentity(location("SUCURSAL VINA")));
  assert.notEqual(branchIdentity(location("CENTRO")), branchIdentity(location("CENTRO", { commune: "Santiago" })));
  assert.equal(branchIdentity(location("", { attention: "Juan", projectCode: "A" })), "");
});

test("selecting another branch or manual entry preserves quote-specific fields", () => {
  const quote = { code: "CUSTOM-123", projectCode: "PT", attention: "Paulo", payment: "30 días" };
  const saved = { id: 1, ...location("P606"), code: "OLD", projectCode: "OTHER", attention: "Juanita", payment: "Contado" };
  for (const branch of [saved, undefined]) {
    const updated = { ...quote, ...branchSelection(branch) };
    for (const key of Object.keys(quote)) assert.equal(updated[key], quote[key]);
  }
});
