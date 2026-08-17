import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import Toolbar from "../Toolbar";
import { PALETTE } from "../../lib/board";

const setup = (overrides = {}) => {
  const props = {
    color: PALETTE[0].value,
    onColorChange: jest.fn(),
    width: 4,
    onWidthChange: jest.fn(),
    erasing: false,
    onErasingChange: jest.fn(),
    onClear: jest.fn(),
    onExport: jest.fn(),
    hasContent: true,
    ...overrides,
  };

  render(<Toolbar {...props} />);
  return props;
};

it("marks the active colour for assistive technology", () => {
  setup();

  expect(screen.getByRole("radio", { name: PALETTE[0].name })).toBeChecked();
  expect(screen.getByRole("radio", { name: PALETTE[1].name })).not.toBeChecked();
});

it("selects a colour and leaves eraser mode", () => {
  const props = setup({ erasing: true });

  fireEvent.click(screen.getByRole("radio", { name: PALETTE[2].name }));

  expect(props.onColorChange).toHaveBeenCalledWith(PALETTE[2].value);
  expect(props.onErasingChange).toHaveBeenCalledWith(false);
});

it("reports brush size changes as a number", () => {
  const props = setup();

  fireEvent.change(screen.getByLabelText(/size/i), { target: { value: "12" } });

  expect(props.onWidthChange).toHaveBeenCalledWith(12);
});

it("toggles the eraser", () => {
  const props = setup({ erasing: false });

  const eraser = screen.getByRole("button", { name: /eraser/i });
  expect(eraser).toHaveAttribute("aria-pressed", "false");

  fireEvent.click(eraser);
  expect(props.onErasingChange).toHaveBeenCalledWith(true);
});

it("disables board actions while the board is empty", () => {
  setup({ hasContent: false });

  expect(screen.getByRole("button", { name: /clear board/i })).toBeDisabled();
  expect(screen.getByRole("button", { name: /save png/i })).toBeDisabled();
});

it("triggers clear and export when the board has content", () => {
  const props = setup({ hasContent: true });

  fireEvent.click(screen.getByRole("button", { name: /clear board/i }));
  fireEvent.click(screen.getByRole("button", { name: /save png/i }));

  expect(props.onClear).toHaveBeenCalledTimes(1);
  expect(props.onExport).toHaveBeenCalledTimes(1);
});
