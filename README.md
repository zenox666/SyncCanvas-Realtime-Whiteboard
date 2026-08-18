# SyncCanvas

**A real-time collaborative whiteboard.** Everyone on the same link draws on the
same canvas, and every stroke appears on all connected devices as it is drawn.

Built to solve a specific problem: explaining diagrams to friends while studying
remotely, without screen-sharing a desktop drawing app.

**Live demo:** _add your deployed URL here_ — open it in two windows to watch it sync.

---

## Features

- **Real-time synchronisation** — strokes are relayed over WebSockets and land
  on every connected client as they are drawn, not when the stroke finishes.
- **Late joiners see the current board** — the server keeps a capped history and
  replays it on connect, so arriving second doesn't mean arriving to a blank canvas.
- **Resolution independent** — coordinates travel as fractions of the board
  rather than pixels, so a phone and a 4K monitor stay in agreement.
- **Mouse, touch and stylus** — a single Pointer Events path handles all three,
  with pointer capture so a stroke survives leaving the canvas.
- **Drawing tools** — six-colour palette with a custom picker, adjustable brush
  size, and an eraser.
- **PNG export** — save the board as an image.
- **Connection awareness** — a live/offline indicator and a count of who else is
  drawing, so a downed backend never looks like a quiet room.
- **Responsive and crisp** — the canvas fills the viewport, repaints itself from
  history on resize, and renders at device pixel ratio on high-DPI screens.
- **Accessible controls** — labelled toolbar with radio-group semantics, visible
  focus rings, and reduced-motion support.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, HTML5 Canvas, Pointer Events, CSS3 |
| Backend | Node.js, Express 5 |
| Real-time | Socket.IO 4 |
| Testing | Jest and React Testing Library (client), `node --test` (server) |
| Tooling | Create React App, nodemon |

---

## Getting started

**Prerequisites:** Node.js 18 or newer.

Clone the repository:

```bash
git clone https://github.com/zenox666/SyncCanvas-Realtime-Whiteboard.git
```

Start the server:

```bash
cd server && npm install && npm run dev
```

It listens on `http://localhost:3001`. Verify it with `curl http://localhost:3001/health`.

In a second terminal, start the client:

```bash
cd client && npm install && npm start
```

The app opens at `http://localhost:3000`.

### Configuration

Both halves read their configuration from environment variables and default to
values that work locally with no setup. Copy the examples to customise:

```bash
cp client/.env.example client/.env && cp server/.env.example server/.env
```

| Variable | Side | Default | Purpose |
| --- | --- | --- | --- |
| `REACT_APP_SERVER_URL` | client | `http://localhost:3001` | Backend to connect to. Point at your deployed server in production. |
| `PORT` | server | `3001` | Listening port. |
| `CORS_ORIGIN` | server | `*` | Comma-separated allow-list of origins. Set this in production. |

---

## Tests

```bash
cd server && npm test
```

```bash
cd client && npm run test:ci
```

The server suite covers payload validation and board-history behaviour, including
eviction at the cap and snapshot immutability. The client suite covers the
coordinate maths that keeps different screen sizes in sync, the toolbar's
behaviour and accessibility semantics, and the socket wiring — connect, presence,
history replay and remote clears — against a socket test double, so no live
backend is required.

---

## How it works

A stroke is transmitted as a **line segment** rather than a completed path, so it
renders on other clients while it is still being drawn:

```json
{ "x0": 0.12, "y0": 0.44, "x1": 0.13, "y1": 0.45, "color": "#3b82f6", "width": 4 }
```

Coordinates are fractions of the board's width and height. This is the detail
that makes cross-device drawing work — pixel coordinates from a 375px phone
would land in the wrong place on a 1440px desktop.

1. A pointer move produces one or more segments. Coalesced pointer events are
   used to recover the positions the browser batched between frames, so fast
   strokes stay smooth instead of visibly angular.
2. The client paints the segment immediately, without waiting for a round trip,
   appends it to its own history, and emits it.
3. The server validates the payload, appends it to the board history, and
   broadcasts it to everyone else.
4. New clients receive the full history on connect and replay it.

The local history serves a second purpose: changing a canvas' backing-store size
blanks it, so the board is repainted from history every time the layout changes.
The backing store is sized to `devicePixelRatio`, which keeps strokes sharp on
high-DPI displays.

Board state is intentionally ephemeral. It lives in memory, is capped so a long
session cannot exhaust it, and resets when the server restarts.

---

## Project structure

```
SyncCanvas-Realtime-Whiteboard/
├── client/                        React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── StatusBar.js       Connection state and user count
│       │   ├── Toolbar.js         Colour, brush size, eraser, board actions
│       │   └── Whiteboard.js      The canvas element
│       ├── hooks/
│       │   ├── useConnection.js   Socket lifecycle, status, presence
│       │   └── useWhiteboard.js   Drawing, sync, resize handling
│       ├── lib/
│       │   ├── board.js           Pure geometry and painting helpers
│       │   ├── events.js          Shared socket event names
│       │   └── socket.js          Configured Socket.IO client
│       └── App.js                 Shell; owns the active tool
└── server/                        Node.js backend
    ├── lib/
    │   ├── events.js              Shared socket event names
    │   └── strokes.js             Payload validation and board history
    ├── test/
    └── index.js                   Express and Socket.IO wiring
```

---

## Roadmap

- **Rooms** — board IDs in the URL so several groups can work independently.
- **Undo and redo** — requires per-user stroke grouping and a shared undo policy.
- **Persistence** — Redis or a database so boards outlive a server restart.
- **Live cursors** — show where each collaborator is pointing.
- **Shapes and text** — rectangles, arrows and labels alongside freehand drawing.

---

## License

Released under the [MIT License](LICENSE).
