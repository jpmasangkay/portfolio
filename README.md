# Shealtiel's Realm — Interactive 3D Voxel Portfolio

An interactive D&D-inspired 3D isometric voxel town portfolio for **Shealtiel John Paul A. Masangkay**, built with React, TypeScript, and Three.js.

## Features

- **Isometric Pixel-Art 3D Town**: Rendered with Three.js to a low-resolution nearest-neighbor render target for a crisp voxel/pixel aesthetic.
- **8 Interactive Landmarks**:
  - **Town Gate** — Introduction & controls overview
  - **The Tavern** — Bio, education, and work experience
  - **Quest Board** — Featured projects and GitHub repositories
  - **Wizard's Tower** — Programming languages, frameworks, and tools
  - **The Gallery** — Graphic design posters and editorial layouts
  - **The Forge** — 3D Blender artwork
  - **Notice Board** — Certificates and achievements
  - **Town Exit** — GitHub, LinkedIn, and email links
- **Desktop & Mobile Controls**: `WASD` / Arrow keys + `E` / `Space` on desktop; touch controls and interact button on mobile.
- **Background Audio**: Toggleable tavern/realm soundtrack (`public/bgm.webm`).

## Tech Stack

- React 18 + TypeScript
- Vite (SWC)
- Three.js
- Tailwind CSS
- Vitest + Testing Library

## Scripts

```sh
npm install
npm run dev       # Start local dev server on http://localhost:8080
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm test          # Run Vitest unit & component tests
```
