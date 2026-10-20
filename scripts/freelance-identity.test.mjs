import assert from "node:assert/strict";
import test from "node:test";
import { FREELANCE_FULL_NAME, formatFreelanceSignature } from "../src/lib/freelance-identity.ts";

test("existing BYL signatures show the full name and preserve their other lines", () => {
  assert.equal(
    formatFreelanceSignature("Atentamente,\n\nBenjamín Yáñez\nDesarrollo de software"),
    `Atentamente,\n\n${FREELANCE_FULL_NAME}\nDesarrollo de software`,
  );
});

test("full names are not duplicated", () => {
  const signature = `Atentamente,\n${FREELANCE_FULL_NAME}`;
  assert.equal(formatFreelanceSignature(signature), signature);
});

test("signature spacing and Windows line endings are preserved", () => {
  assert.equal(formatFreelanceSignature("  Benjamín Yáñez \r\nGracias"), `  ${FREELANCE_FULL_NAME} \r\nGracias`);
});

test("custom signers and references in prose remain unchanged", () => {
  for (const signature of ["Atentamente,\nMaría González", "Contacto: Benjamín Yáñez", "Benjamín Yáñez Pérez", ""]) {
    assert.equal(formatFreelanceSignature(signature), signature);
  }
});
