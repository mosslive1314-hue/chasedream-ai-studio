# TODO

## Phase 1 - Foundation

- [x] Create `specs/` with story, feature, and panorama prompt drafts.
- [x] Scaffold a React + TypeScript + Vite pure frontend game.
- [x] Add a data-driven story model for chapters, choices, hotspots, stats, and endings.
- [x] Build the 360-degree panorama viewer with drag, touch, zoom, auto-drift, and clickable hotspots.

## Phase 2 - Game Systems

- [x] Implement dialogue progression and branching choices.
- [x] Implement relationship stats: `spark`, `trust`, and `boundary`.
- [x] Implement global stats: `career`, `integrity`, and `stress`.
- [x] Implement route locking and ending resolution.
- [x] Implement local save, reset, memory gallery, relationship panel, and settings.

## Phase 3 - Art Assets

- [ ] Generate panorama images with GPT Image 2 / built-in image generation.
- [ ] Normalize generated assets to project-friendly 2:1 files.
- [ ] Place final panoramas under `public/panoramas/`.
- [ ] Wire every story node to a panorama asset, with fallback handling.

## Phase 4 - Verification

- [ ] Run TypeScript/build checks.
- [ ] Start the local dev server.
- [ ] Verify the game in-browser on desktop and mobile-sized viewports.
- [ ] Fix layout, console, and panorama rendering issues found during verification.
