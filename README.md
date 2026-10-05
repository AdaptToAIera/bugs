# 🐞 Bugs! — Garden Defender

A fast, juicy browser action game: play as the **Gardener** and spray off the waves of
cartoon bugs trying to eat your plant. Grow the plant to full bloom, unlock better
weapons, level up endlessly, and collect a card for every species that blooms.

Built as plain HTML + CSS + vanilla JavaScript with **no dependencies, no build step and
no network access** — just open it and play.

---

## ▶ How to run

No install, no server required.

- **Easiest:** double-click [`index.html`](index.html) and open it in any modern browser
  (Chrome, Edge, Firefox, Safari). It works straight from `file://`.
- **Optional (local server):** if you like, serve the folder so the file is loaded over
  HTTP — e.g. `python3 -m http.server` in this folder, then open `http://localhost:8000`.

Everything is offline and self-contained; audio is generated with the Web Audio API.

---

## 🎮 Controls

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Move | `W A S D` | Arrow keys |
| Spray (hold) | `Space` | `Enter` or `Shift` |
| Pause | `P` | `P` |
| Mute | `M` | `M` |
| Retry (on game over) | `R` | `R` |

- In **1-player** mode the arrow keys also drive Player 1.
- **Touch devices:** an on-screen D-pad (bottom-left) and a big **SPRAY** button
  (bottom-right) appear automatically. On phones, rotate to landscape for the best
  experience.

---

## 🌱 How to play

- **Spray the bugs** before they reach your plant. Each bite the plant loses 1 HP.
- The plant **regrows +1 HP every 5 s**. Get it to **10/10** and it **blooms** — a short
  celebration plays and you move on.
- **1-player:** endless mode. Bloom to advance the level; if the plant hits 0 HP it's
  game over.
- **2-player:** a race — **first to bloom wins** (a plant dying means the other player
  wins).
- Every **level** unlocks a stronger weapon and a **new plant species**. When a species
  blooms you **collect its card** (saved locally in your browser).

### Weapon ladder (one per level)

`CAN → SPRAY → JET → FOAM GUN → CANNON`

### The 6 bug types

Caterpillar, Ladybug, Beetle, Earthworm, Fly and Dragonfly — each with a distinct look,
speed, toughness and movement style.

---

## 🛠 Under the hood

- Single logical canvas resolution **960×540** (16:9), scaled to the window and capped at
  2× device-pixel-ratio for performance.
- Frame-rate independent simulation (clamped delta-time), so it plays smoothly at 60 Hz
  or 120 Hz.
- Object-pooled particles and a pre-rendered background to keep GC pauses off the table.
- All audio (SFX + background music) is synthesized live with the **Web Audio API** —
  no audio files.
- Sound is off by default and is initialized only after a user gesture (browser
  auto-play rules).

### Project layout

```
v2_modern/
├── index.html          # entry point
├── css/style.css       # layout, HUD, touch controls
└── js/
    ├── config.js       # tuning, palette, weapons, bug types, plant species
    ├── utils.js        # small helpers
    ├── audio.js        # Web Audio SFX + music
    ├── effects.js      # particles, screen shake, slow-mo, popups
    ├── sprites.js      # cartoon vector art (gardener, plants, 6 bugs)
    ├── entities.js     # gardener / plant / bug factories + AI
    ├── input.js        # keyboard + touch
    ├── game.js         # state, progression, render orchestration, HUD
    └── main.js         # canvas setup + the 60–120 fps loop
```

---

## 📄 License

MIT License

Copyright (c) 2026 the Bugs!

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

This is an **original, independently created** modern game (original code, vector art and
sound). It has no runtime dependencies and makes no network requests.
