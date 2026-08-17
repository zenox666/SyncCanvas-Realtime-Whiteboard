import {
  BOARD_BACKGROUND,
  MAX_BRUSH,
  MIN_BRUSH,
  clamp,
  createSegment,
  paintSegment,
  repaint,
  scaleBrush,
  toBoardPoint,
} from "../board";

const rect = { left: 20, top: 40, width: 400, height: 200 };

describe("toBoardPoint", () => {
  it("converts a pointer position to a 0..1 fraction of the board", () => {
    expect(toBoardPoint({ clientX: 220, clientY: 140 }, rect)).toEqual({
      x: 0.5,
      y: 0.5,
    });
  });

  it("accounts for the canvas offset within the page", () => {
    expect(toBoardPoint({ clientX: 20, clientY: 40 }, rect)).toEqual({ x: 0, y: 0 });
  });

  it("clamps positions dragged outside the canvas", () => {
    expect(toBoardPoint({ clientX: -500, clientY: 9999 }, rect)).toEqual({
      x: 0,
      y: 1,
    });
  });

  it("returns the origin for a zero-sized board instead of dividing by zero", () => {
    const point = toBoardPoint({ clientX: 10, clientY: 10 }, { ...rect, width: 0 });
    expect(point).toEqual({ x: 0, y: 0 });
  });
});

describe("normalised coordinates across screen sizes", () => {
  it("maps the same relative position on boards of different sizes", () => {
    const phone = { left: 0, top: 0, width: 320, height: 160 };
    const desktop = { left: 0, top: 0, width: 1280, height: 640 };

    const fromPhone = toBoardPoint({ clientX: 80, clientY: 40 }, phone);
    const fromDesktop = toBoardPoint({ clientX: 320, clientY: 160 }, desktop);

    expect(fromPhone).toEqual(fromDesktop);
  });
});

describe("createSegment", () => {
  it("packs two points and the active tool into a wire payload", () => {
    const segment = createSegment(
      { x: 0.1, y: 0.2 },
      { x: 0.3, y: 0.4 },
      { color: "#3b82f6", width: 8 },
    );

    expect(segment).toEqual({
      x0: 0.1,
      y0: 0.2,
      x1: 0.3,
      y1: 0.4,
      color: "#3b82f6",
      width: 8,
    });
  });

  it("clamps the brush width to the supported range", () => {
    const style = { color: BOARD_BACKGROUND, width: 5000 };
    const segment = createSegment({ x: 0, y: 0 }, { x: 1, y: 1 }, style);

    expect(segment.width).toBe(MAX_BRUSH);
  });
});

describe("scaleBrush", () => {
  it("keeps the authored width at the reference board width", () => {
    expect(scaleBrush(10, 1000)).toBe(10);
  });

  it("scales proportionally so strokes stay relatively thick", () => {
    expect(scaleBrush(10, 500)).toBe(5);
    expect(scaleBrush(10, 2000)).toBe(20);
  });

  it("never collapses to an invisible line on a tiny board", () => {
    expect(scaleBrush(MIN_BRUSH, 1)).toBeGreaterThan(0);
  });
});

describe("clamp", () => {
  it("restricts values to the given range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
  });
});

/** Minimal 2D context recorder — jsdom does not implement canvas rendering. */
const createContext = () => ({
  calls: [],
  save() {},
  restore() {},
  beginPath() {},
  stroke() {},
  clearRect(...args) {
    this.calls.push(["clearRect", ...args]);
  },
  fillRect(...args) {
    this.calls.push(["fillRect", ...args]);
  },
  moveTo(...args) {
    this.calls.push(["moveTo", ...args]);
  },
  lineTo(...args) {
    this.calls.push(["lineTo", ...args]);
  },
});

describe("paintSegment", () => {
  it("projects normalised coordinates onto the board in pixels", () => {
    const context = createContext();
    const segment = { x0: 0, y0: 0, x1: 0.5, y1: 1, color: "#000000", width: 4 };

    paintSegment(context, segment, { width: 800, height: 400 });

    expect(context.calls).toEqual([
      ["moveTo", 0, 0],
      ["lineTo", 400, 400],
    ]);
    expect(context.lineWidth).toBeCloseTo(3.2);
    expect(context.strokeStyle).toBe("#000000");
  });
});

describe("repaint", () => {
  it("wipes the board and redraws every segment from history", () => {
    const context = createContext();
    const size = { width: 100, height: 100 };
    const segment = { x0: 0, y0: 0, x1: 1, y1: 1, color: "#000000", width: 2 };

    repaint(context, [segment, segment], size);

    expect(context.calls[0]).toEqual(["clearRect", 0, 0, 100, 100]);
    expect(context.calls[1]).toEqual(["fillRect", 0, 0, 100, 100]);
    expect(context.fillStyle).toBe(BOARD_BACKGROUND);
    expect(context.calls.filter(([name]) => name === "lineTo")).toHaveLength(2);
  });
});
