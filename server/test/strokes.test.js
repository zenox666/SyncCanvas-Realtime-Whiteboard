import test from "node:test";
import assert from "node:assert/strict";

import { createBoard, sanitizeSegment, MAX_BRUSH } from "../lib/strokes.js";

const valid = { x0: 0, y0: 0, x1: 0.5, y1: 1, color: "#1B1F24", width: 4 };

test("sanitizeSegment accepts a well-formed segment", () => {
  assert.deepEqual(sanitizeSegment(valid), { ...valid, color: "#1b1f24" });
});

test("sanitizeSegment rejects non-objects", () => {
  for (const input of [null, undefined, 42, "draw", []]) {
    assert.equal(sanitizeSegment(input), null, `expected ${JSON.stringify(input)} to be rejected`);
  }
});

test("sanitizeSegment rejects coordinates outside the 0..1 range", () => {
  assert.equal(sanitizeSegment({ ...valid, x0: -0.01 }), null);
  assert.equal(sanitizeSegment({ ...valid, y1: 1.01 }), null);
});

test("sanitizeSegment rejects non-finite coordinates", () => {
  assert.equal(sanitizeSegment({ ...valid, x1: NaN }), null);
  assert.equal(sanitizeSegment({ ...valid, y0: Infinity }), null);
  assert.equal(sanitizeSegment({ ...valid, x0: "0.5" }), null);
});

test("sanitizeSegment rejects colours that are not 6-digit hex", () => {
  for (const color of ["red", "#fff", "#12345g", "javascript:alert(1)", 0x000000]) {
    assert.equal(sanitizeSegment({ ...valid, color }), null, `expected ${color} to be rejected`);
  }
});

test("sanitizeSegment clamps out brush widths beyond the allowed range", () => {
  assert.equal(sanitizeSegment({ ...valid, width: 0 }), null);
  assert.equal(sanitizeSegment({ ...valid, width: MAX_BRUSH + 1 }), null);
  assert.ok(sanitizeSegment({ ...valid, width: MAX_BRUSH }));
});

test("sanitizeSegment drops unexpected extra fields", () => {
  const result = sanitizeSegment({ ...valid, evil: "<script>", socketId: "spoofed" });
  assert.deepEqual(Object.keys(result).sort(), ["color", "width", "x0", "x1", "y0", "y1"]);
});

test("board retains segments so late joiners can replay the board", () => {
  const board = createBoard();
  board.add(sanitizeSegment(valid));
  board.add(sanitizeSegment({ ...valid, x1: 0.9 }));

  assert.equal(board.size, 2);
  assert.equal(board.snapshot().length, 2);
});

test("board ignores rejected segments", () => {
  const board = createBoard();
  board.add(sanitizeSegment({ ...valid, color: "nope" }));
  assert.equal(board.size, 0);
});

test("board evicts the oldest segments once the cap is reached", () => {
  const board = createBoard({ maxSegments: 3 });
  for (let i = 0; i < 5; i += 1) {
    board.add(sanitizeSegment({ ...valid, x0: i / 10 }));
  }

  assert.equal(board.size, 3);
  assert.deepEqual(
    board.snapshot().map((segment) => segment.x0),
    [0.2, 0.3, 0.4],
  );
});

test("board clear empties history", () => {
  const board = createBoard();
  board.add(sanitizeSegment(valid));
  board.clear();
  assert.equal(board.size, 0);
});

test("board snapshot is a copy callers cannot mutate", () => {
  const board = createBoard();
  board.add(sanitizeSegment(valid));

  board.snapshot().push(sanitizeSegment(valid));
  assert.equal(board.size, 1);
});
