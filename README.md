# Mheshimiwa

A satirical platformer about the choices behind public money. The first slice is a single-screen prototype built with Vite, Phaser, and TypeScript. It uses drawn shapes, so no art assets are needed to run it.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Use **A/D** or **←/→** to move, **Space/W/↑** to jump, **B** to offer an envelope at the civic desk, and **R** to refuse inspection or restart after the ending.

## Project layout

```text
public/assets/       Future sprites, audio, maps, and UI art
src/
  data/items.json    Pickup definitions
  entities/Player.ts Player movement and size-based handling
  scenes/            Boot, menu, game, and ending scenes
  systems/            Shared size and ending rules
  config.ts           Game dimensions and physics constants
```

The prototype keeps the game client-only. A backend and leaderboard can be added after the core loop is fun.
