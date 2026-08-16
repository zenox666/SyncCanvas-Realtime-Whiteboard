// jest-dom adds DOM-aware matchers such as toBeInTheDocument and toBeDisabled.
import "@testing-library/jest-dom";

// jsdom implements neither ResizeObserver nor canvas rendering. The board only
// needs them to exist; layout is zero-sized under jsdom, so the drawing code
// short-circuits before it would touch a real 2D context.
if (typeof global.ResizeObserver === "undefined") {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
