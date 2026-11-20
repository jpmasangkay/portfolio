# Shealtiel's Realm — Interactive 3D Voxel Portfolio

An interactive D&D-inspired 3D isometric voxel portfolio for **Shealtiel John Paul A. Masangkay**, built with React, TypeScript, and Three.js, alongside a keyboard-accessible recruiter **Quick View** mode.

## Features

- **Isometric Pixel-Art 3D Realm**: Batched Three.js scene rendered to a nearest-neighbor target with dynamic day/night cycle, automatic quality scaling (`Rain` → `Shadow resolution` → `Dynamic lights` → `Render resolution`), and a persistent **Low graphics** toggle.
- **8 Portfolio Landmarks & Walk-In Interiors**:
  - **Town Gate** — Welcome & controls
  - **The Tavern** — Walk-in room (`About Me`, education & LGMCI experience)
  - **Quest Board** — Featured projects & GitHub repositories
  - **Wizard's Tower** — Walk-in room (`Technical Skills` character sheet)
  - **The Gallery** — Graphic design & editorial spreads (WebP lightbox)
  - **The Forge** — 3D Blender artwork
  - **Notice Board** — Certificates & credentials
  - **Town Exit** — GitHub, LinkedIn & contact links
- **Outskirts, Villagers & Quest Log**: Explore **Whispering Forest**, **Moonlit Lakeside**, and **Ruined Hilltop**, talk to 8 villagers, collect 5 hidden secrets, level up via XP, and unlock the Royal Cloak & Hire Me scroll.
- **Recruiter Quick View & `<noscript>` Fallback**: One-click switch to a plain, keyboard-navigable HTML resume view (`📄 Quick View`), plus full semantic `<noscript>` content when JS is disabled.
- **Opt-In Background Audio**: Toggleable WebM/Opus background music (`public/bgm.webm`, `preload="none"`) synced with zone ambience.

## Controls

| Action | Desktop | Mobile / Touch |
| --- | --- | --- |
| **Move** | `W` `A` `S` `D` or Arrow Keys | Drag bottom-left thumbstick |
| **Interact / Talk / Enter / Collect** | `E` or `Space` | Tap bottom-right `⚔️` button |
| **Close modal / Cancel** | `Esc` | Tap `✕` or outside backdrop |
| **HUD Shortcuts** | Top-left/right buttons (`🎵 MUSIC`, `⚡ Low graphics`, `🌙 Night`, `📒 Quests`, `📄 Quick View`) | Same HUD toggles + `🗺️ MAP` drawer |

## Tech Stack

- React 18 + TypeScript
- Vite (SWC)
- Three.js (`three` code-split vendor chunk + `BufferGeometryUtils` batching)
- Tailwind CSS
- Vitest + Testing Library

## Build & Test Commands

```sh
npm install
npm run dev          # Start local Vite dev server (http://localhost:8080)
npx tsc --noEmit     # TypeScript strict typecheck
npm run lint         # ESLint check
npm test             # Run Vitest unit & component tests
npm run build        # Production bundle to dist/
npm run preview      # Preview production dist/ locally (http://localhost:4173)
```

## Deployment Base Path (GitHub Pages & Vercel)

- `vite.config.ts` sets `base: "./"`, emitting relative `./assets/...` references in `dist/index.html`, `./portfolio.svg` for the favicon, and `${import.meta.env.BASE_URL}bgm.webm` in `BgMusic.tsx`.
- `App.tsx` uses a catch-all `<Route path="*" element={<Index />} />`, so the same `dist/` build works cleanly without rebuilding on both **Vercel (`/`)** and **GitHub Pages project sites (`/portfolio/`)**.
