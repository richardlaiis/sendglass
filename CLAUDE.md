# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Sendglass

Short-term time capsule notes PWA. The full spec is the source of truth:

@SPEC.md

## Working rules

- Work **one phase at a time** (SPEC §14). Propose a plan first and wait for my approval before writing code.
- **Ask before adding any dependency** not listed in SPEC §3.
- No backend, no AI (SPEC §1 hard constraints).
- Every UI string goes through i18n, with both `en` and `zh-TW` filled in.
- Pure logic lives in `src/domain/` and must have Vitest tests. Use fake timers, never the real clock.
- Before saying a phase is done, run lint, tests and build, and check the phase's "Done when" list.
- Commit at the end of each phase with a clear message. Don't push unless I ask.
- When I make a decision listed in SPEC §15 "Open decisions", update SPEC.md to record it.

## Commands

- `npm run dev`: start the dev server
- `npm run build`: type-check (`tsc -b`) + production build
- `npm test`: run Vitest once (`npm run test:watch` for watch mode)
- `npm run lint`: ESLint + Prettier check (`npm run format` to fix formatting; markdown is excluded)
- Single test file: `npx vitest run src/domain/status.test.ts`
- Single test by name: `npx vitest run -t "is ready exactly at the unlock moment"`
- Subpath build like CI: `BASE_PATH=/sendglass/ npm run build && npm run preview`
- Regenerate M3 color tokens: `npm run gen:tokens` (writes `src/styles/tokens.css`; don't hand-edit it)

Approved dev-only extras beyond SPEC §3 (Phase 1): `i18next`, `@vitejs/plugin-react`, the ESLint/Prettier toolchain, `@types/*`, `@material/material-color-utilities`, `fake-indexeddb`.

## Architecture invariants

These span several modules. Lint enforces the first two.

- **Time is injected.** `src/domain/` never reads the clock (ESLint bans `Date.now` there). Domain functions take `now`. In the UI, `useNow()` (`src/app/useNow.ts`) ticks every second and pauses while the tab is hidden. Event handlers use `readClock()` (`src/app/clock.ts`).
- **UI talks only to the repository interfaces** in `src/storage/repositories.ts`, obtained with `useRepositories()`. Only `src/storage/dexie/` may import Dexie (ESLint `no-restricted-imports`).
- **Status is derived, never stored.** Use `getStatus` / `getProgress` / `getRemainingMs` from `src/domain/status.ts`. `CapsuleChanges` deliberately excludes `title` and `content`, because they are immutable after sealing.
- **Lifecycle changes go through `src/domain/actions.ts`.** `markHappened`, `openCapsule`, `openEarly` and `addReply` check the capsule's state and return the `CapsuleChanges` to save. Don't build those changes by hand in UI code. The early-open chain is the state machine in `src/domain/earlyOpen.ts`, and `ConfirmChain` only renders it.
- **Reveal hook:** whoever opens a capsule calls `markJustOpened(id)` (`src/features/capsule/justOpened.ts`), and the capsule page plays the reveal once. Phase 3's shatter animation belongs there.
- **Dialogs and toasts:** use `components/Dialog` (native `<dialog>`, Esc/scrim = cancel) and mark the safe default button with `data-autofocus`. Show toasts with `useSnackbar()`.
- **Settings have two copies.** IndexedDB is the source of truth. `theme` and `language` are mirrored to localStorage (`src/storage/settingsMirror.ts`), so the inline script in `index.html` can set `data-theme` before first paint and i18n can start in the right language. If you rename `sendglass.theme`, update both places.
- **Theme:** `data-theme="light|dark"` on `<html>`. When the theme is `system`, the attribute is removed and `tokens.css` falls back to `prefers-color-scheme`.
- **Routing** is a tiny hash router (`src/app/router.ts` + pure `routes.ts`). Use `navigate()` for programmatic moves. `useLeaveGuard()` blocks leaving with unsaved input, and `navigate(hash, { force: true })` skips it after a save.
- **i18n keys are typed** from `en.json` (`src/i18n/i18next.d.ts`). zh-TW plural keys use only the `_other` suffix. Format durations, dates and percentages with the helpers in `src/i18n/format.ts`.
- **GitHub Pages base path** comes from the `BASE_PATH` env var (`vite.config.ts`). CI sets it to `/<repo>/`. Phase 4's manifest `start_url`/`scope` must use the same value.
