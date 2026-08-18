import test from "node:test";
import assert from "node:assert/strict";

import { parseCorsOrigin } from "../lib/config.js";

test("parseCorsOrigin allows any origin when unset", () => {
  assert.equal(parseCorsOrigin(undefined), "*");
});

test("parseCorsOrigin allows any origin when blank or whitespace", () => {
  assert.equal(parseCorsOrigin(""), "*");
  assert.equal(parseCorsOrigin("   "), "*");
  assert.equal(parseCorsOrigin(",, ,"), "*");
});

test("parseCorsOrigin collapses an explicit wildcard to the string form", () => {
  // ["*"] would be treated as an exact-match list and reject every origin.
  assert.equal(parseCorsOrigin("*"), "*");
  assert.equal(parseCorsOrigin("https://app.example,*"), "*");
});

test("parseCorsOrigin returns a trimmed allow-list", () => {
  assert.deepEqual(parseCorsOrigin("https://a.example, https://b.example"), [
    "https://a.example",
    "https://b.example",
  ]);
});

test("parseCorsOrigin drops empty entries from a trailing comma", () => {
  assert.deepEqual(parseCorsOrigin("https://a.example,"), ["https://a.example"]);
});
