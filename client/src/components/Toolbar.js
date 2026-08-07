import React from "react";

import { MAX_BRUSH, MIN_BRUSH, PALETTE } from "../lib/board";

/**
 * Drawing controls: colour, brush size, eraser, and board actions.
 *
 * @param {object} props
 * @param {string} props.color Active colour, as a hex string.
 * @param {(color: string) => void} props.onColorChange
 * @param {number} props.width Active brush width.
 * @param {(width: number) => void} props.onWidthChange
 * @param {boolean} props.erasing Whether the eraser is active.
 * @param {(erasing: boolean) => void} props.onErasingChange
 * @param {() => void} props.onClear
 * @param {() => void} props.onExport
 * @param {boolean} props.hasContent Whether the board has anything on it.
 */
function Toolbar({
  color,
  onColorChange,
  width,
  onWidthChange,
  erasing,
  onErasingChange,
  onClear,
  onExport,
  hasContent,
}) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Drawing tools">
      <div className="toolbar__group" role="radiogroup" aria-label="Brush colour">
        {PALETTE.map((swatch) => {
          const active = !erasing && color === swatch.value;
          return (
            <button
              key={swatch.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={swatch.name}
              title={swatch.name}
              className={`swatch${active ? " swatch--active" : ""}`}
              style={{ "--swatch": swatch.value }}
              onClick={() => {
                onColorChange(swatch.value);
                onErasingChange(false);
              }}
            />
          );
        })}

        <label className="swatch swatch--custom" title="Custom colour">
          <span className="sr-only">Custom colour</span>
          <input
            type="color"
            value={color}
            onChange={(event) => {
              onColorChange(event.target.value);
              onErasingChange(false);
            }}
          />
        </label>
      </div>

      <div className="toolbar__group">
        <label className="field" htmlFor="brush-width">
          <span className="field__label">Size</span>
          <input
            id="brush-width"
            type="range"
            min={MIN_BRUSH}
            max={MAX_BRUSH}
            value={width}
            onChange={(event) => onWidthChange(Number(event.target.value))}
          />
          <span className="field__value">{width}</span>
        </label>
      </div>

      <div className="toolbar__group">
        <button
          type="button"
          className={`button${erasing ? " button--active" : ""}`}
          aria-pressed={erasing}
          onClick={() => onErasingChange(!erasing)}
        >
          Eraser
        </button>
        <button
          type="button"
          className="button"
          onClick={onExport}
          disabled={!hasContent}
        >
          Save PNG
        </button>
        <button
          type="button"
          className="button button--danger"
          onClick={onClear}
          disabled={!hasContent}
        >
          Clear board
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
