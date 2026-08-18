import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import App from "./App";
import { EVENTS } from "./lib/events";
import { emitFromServer, resetSocket, socket } from "./lib/socket";

jest.mock("./lib/socket");

const segment = { x0: 0, y0: 0, x1: 0.5, y1: 0.5, color: "#1b1f24", width: 4 };

/** Push a server event and let React flush the resulting state updates. */
const fromServer = (event, payload) => act(() => emitFromServer(event, payload));

beforeEach(() => {
  resetSocket();
});

it("opens the connection on mount and reports it as pending", () => {
  render(<App />);

  expect(socket.connect).toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: /synccanvas/i })).toBeInTheDocument();
  expect(screen.getByText(/connecting/i)).toBeInTheDocument();
});

it("shows how many people share the board once connected", () => {
  render(<App />);

  fromServer("connect");
  fromServer(EVENTS.PRESENCE, { users: 3 });

  expect(screen.getByText("Live")).toBeInTheDocument();
  expect(screen.getByText(/3 people drawing/i)).toBeInTheDocument();
});

it("uses the singular form for a lone user", () => {
  render(<App />);

  fromServer("connect");
  fromServer(EVENTS.PRESENCE, { users: 1 });

  expect(screen.getByText(/1 person drawing/i)).toBeInTheDocument();
});

it("surfaces a connection failure instead of looking idle", () => {
  render(<App />);

  fromServer("connect_error", new Error("xhr poll error"));

  expect(screen.getByText("Offline")).toBeInTheDocument();
  expect(screen.getByText(/xhr poll error/i)).toBeInTheDocument();
});

it("enables board actions once the server replays existing strokes", () => {
  render(<App />);

  expect(screen.getByRole("button", { name: /clear board/i })).toBeDisabled();

  fromServer(EVENTS.BOARD_STATE, { segments: [segment] });

  expect(screen.getByRole("button", { name: /clear board/i })).toBeEnabled();
  expect(screen.queryByText(/start drawing/i)).not.toBeInTheDocument();
});

it("keeps the board empty when a late joiner receives no history", () => {
  render(<App />);

  fromServer(EVENTS.BOARD_STATE, { segments: [] });

  expect(screen.getByText(/start drawing/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /clear board/i })).toBeDisabled();
});

describe("clearing the board", () => {
  let confirmSpy;

  beforeEach(() => {
    confirmSpy = jest.spyOn(window, "confirm");
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it("asks before wiping everyone's board", () => {
    confirmSpy.mockReturnValue(false);
    render(<App />);
    fromServer(EVENTS.BOARD_STATE, { segments: [segment] });

    fireEvent.click(screen.getByRole("button", { name: /clear board/i }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(socket.emit).not.toHaveBeenCalledWith(EVENTS.CLEAR);
  });

  it("broadcasts the clear once confirmed", () => {
    confirmSpy.mockReturnValue(true);
    render(<App />);
    fromServer(EVENTS.BOARD_STATE, { segments: [segment] });

    fireEvent.click(screen.getByRole("button", { name: /clear board/i }));

    expect(socket.emit).toHaveBeenCalledWith(EVENTS.CLEAR);
    expect(screen.getByText(/start drawing/i)).toBeInTheDocument();
  });

  it("resets the board when another user clears it", () => {
    render(<App />);
    fromServer(EVENTS.BOARD_STATE, { segments: [segment] });

    fromServer(EVENTS.CLEAR);

    expect(screen.getByRole("button", { name: /clear board/i })).toBeDisabled();
  });
});
