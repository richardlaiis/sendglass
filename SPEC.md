# SPEC — Sendglass: short-term time capsule notes

> App name: **Sendglass** (砂時寄). A pun on "send" + "sandglass": you send a message to your future self, and it waits in an hourglass.
> This file is the single source of truth for any coding agent working on this repo.
> Read it fully before planning or writing code. If something here is ambiguous, ask before guessing.

---

## 1. Product summary

A **Progressive Web App (PWA)** for writing short notes to your near-future self.
Each note ("capsule") is sealed and can only be opened when its unlock condition is met:
a set date/time, a time interval, or an event you mark as done.
While a capsule waits, it is shown as an **abstract hourglass** with an exact progress number.
When it unlocks, the hourglass **shatters** to reveal the note.

- **Users:** single user, on one device. No accounts.
- **Primary platform:** Android Chrome, installed as a PWA. Must also work in desktop Chrome/Firefox.
- **Time scale:** short-term (minutes to weeks), not years.

### Hard constraints

- **No AI** of any kind.
- **No custom backend** in phases 1–4 (see §9 for the one notification exception, which needs a decision).
- **Works offline** after the first load.
- **Hosted on GitHub Pages.**
- **Bilingual:** English and Traditional Chinese (zh-TW).

---

## 2. Scope

### In scope (v1)

- Create a capsule with one of three unlock types (§4)
- Home screen with sealed capsules (hourglasses) and ready-to-open capsules
- Open flow with shatter reveal animation
- Reply to a capsule when you open it
- History of opened capsules (with replies)
- Optional early opening, guarded by an annoying confirmation chain (§5)
- Light / dark / system theme switch
- Language switch: English / 繁體中文 / follow system
- Notifications when a capsule unlocks (§9)
- Export / import all data as JSON
- Installable PWA, offline support

### Out of scope (v1). Do NOT build these.

- Accounts, login, cloud sync
- Sharing capsules with other people
- Location-based unlocking
- Attachments (images, audio). Text only.
- AI features of any kind

---

## 3. Tech stack

| Concern      | Choice                                | Notes                                                       |
| ------------ | ------------------------------------- | ----------------------------------------------------------- |
| Build tool   | **Vite**                              |                                                             |
| Language     | **TypeScript** (strict mode)          |                                                             |
| UI framework | **React 18+**                         | Function components + hooks only                            |
| Styling      | **Plain CSS + CSS custom properties** | Material 3 design tokens, no UI component library           |
| Storage      | **IndexedDB via Dexie**               | Behind a storage interface (§7.3)                           |
| PWA          | **vite-plugin-pwa** (Workbox)         | Generates manifest + service worker                         |
| i18n         | **react-i18next**                     | Locale JSON files, no hard-coded UI strings                 |
| Dates        | Native `Intl` APIs + epoch ms         | No moment.js. Small helper lib (date-fns) allowed if needed |
| IDs          | `crypto.randomUUID()`                 |                                                             |
| Unit tests   | **Vitest**                            | Required for all logic in `src/domain/`                     |
| E2E tests    | Playwright                            | Optional, phase 4+                                          |
| Deploy       | **GitHub Actions → GitHub Pages**     |                                                             |

**Dependency rule:** ask before adding any dependency not listed above.

---

## 4. Unlock types

The user picks one of three types when creating a capsule.

### 4.1 Set date (`datetime`)

- The user picks an exact local date and time.
- Quick chips: **Tonight 21:00**, **Tomorrow 08:00**, **This weekend (Sat 10:00)**. Hide a chip if its time has already passed.
- Stored as an absolute timestamp (epoch ms, UTC).

### 4.2 Time interval (`interval`)

- The user picks a duration starting now.
- Quick chips: **1 hour**, **6 hours**, **1 day**, **3 days**, **1 week**, **Custom** (days + hours + minutes).
- Stored as `durationMs` plus the computed absolute `at = createdAt + durationMs`.

### 4.3 Event (`event`)

- The user writes an event label, e.g. "After my exam" / 「考完試之後」.
- The capsule stays sealed until the user taps **"It happened"** on that capsule.
- Tapping "It happened" shows one confirmation ("Did it really happen?"). After confirming, the capsule becomes _ready_.
- No time-based progress. See §6.3 for how the hourglass shows this.

### 4.4 Limits

- Minimum unlock delay: **1 minute**. Maximum: **30 days**.
- Keep both as constants in `src/domain/config.ts`.
- The user may write an optional **title** (max 60 chars). Body max **5,000 chars**.

### 4.5 Status (derived, not stored)

Status is computed from the data and the current time. Never store it.

```
sealed  → unlock condition not met yet
ready   → unlock condition met, not opened yet
opened  → openedAt is set
```

### 4.6 Known limitation

Changing the device clock can unlock time-based capsules early. This is acceptable. Do not try to prevent it.

---

## 5. Early opening ("breaking the seal")

### Setting

- `Settings → Allow early opening`, **off by default**.
- **Off:** sealed capsules have no open button. Tapping a sealed capsule shows its details and progress plus a toast: "Still sealed. Be patient." / 「還沒到時間，再等等吧。」
- **On:** sealed capsules show a low-emphasis **"Break the seal"** text button.

### The annoying confirmation chain

Opening early requires getting through **5 escalating confirmation dialogs**, then a typed phrase:

1. "This capsule isn't ready yet. Open it anyway?"
2. "Past you wanted you to wait. Are you sure?"
3. "Only {remaining} left. You really can't wait?"
4. "Last chance… well, almost."
5. "Okay, seriously. Are you absolutely sure?"
6. Type the phrase **"I can't wait"** / **「我等不及了」** exactly to proceed.

Rules:

- In every dialog, **"Keep waiting"** is the primary (filled) button and **"Open anyway"** is a low-emphasis text button.
- **Do not** move buttons around or trick the user. Annoying, not hostile. Stay accessible.
- Cancelling at any step aborts the whole chain. Starting again begins at step 1.
- On success, record `openedEarly = true` and `earlyConfirmations` (number of dialogs passed).
- History later shows a badge such as "Opened 2 days early 😬" / 「提早 2 天打開 😬」.
- For **event** capsules, "Break the seal" means opening before tapping "It happened". It uses the same chain.
- Write all dialog texts in both languages, in the locale files.

---

## 6. Visual design

### 6.1 Overall style

**Cozy, minimal, Material.** Follow Material Design 3 principles: color roles, rounded shapes, elevation through surface tones, clear typography, 8dp spacing grid.

- **Seed color:** warm sand, `#B5835A`. Derive the M3 color roles (primary, on-primary, primary-container, surface, surface-container-low/high, outline, error, …) for **light** and **dark** schemes.
  - You may use `@material/material-color-utilities` to generate them, or hand-tune. Store them as CSS custom properties in `src/styles/tokens.css`.
- **Shapes:** large rounded corners (cards 16–24px, buttons fully rounded).
- **Typography:** system font stack for offline-friendliness and small size:
  `"Roboto", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif`.
  Do not bundle large CJK web fonts.
- **Mood:** calm, warm, paper-like surfaces, gentle motion. No harsh shadows or neon colors.

### 6.2 Theme switch

- Settings offers **Light / Dark / System**. Default: System.
- Persist the choice. Apply it before the first paint so there's no flash of the wrong theme.
- Also include a quick theme toggle icon in the top app bar.

### 6.3 The hourglass (waiting visual)

An **abstract hourglass**, drawn as **SVG** and animated with CSS / Web Animations API (no canvas libraries).

- Abstract geometric form: two rounded triangles or soft trapezoids, thin glass outline, sand as a soft-colored fill.
- **Sand level reflects progress:** the top chamber empties and the bottom fills, in proportion to `progress = (now - createdAt) / (unlockAt - createdAt)`, clamped to 0–1.
- A thin, gently animated falling-sand stream between the chambers while sealed.
- **Exact progress number** always visible next to or under the hourglass:
  - Percentage with one decimal, e.g. **`62.4%`**
  - Remaining time, e.g. **`5h 12m left`** / **`剩餘 5 小時 12 分`** (show seconds when under 1 hour)
  - Unlock moment, e.g. "Opens Tonight 21:00" / 「今晚 21:00 開啟」
  - Update every second while visible. Pause updates when the tab is hidden.
- **Event capsules:** time progress doesn't apply. Show the hourglass **suspended**: sand resting in the top chamber, slowly swirling, no stream. Instead of a percentage, show "Waiting for: {event}" plus elapsed time ("sealed 3d 4h ago").
- **Ready (unlocked, not opened):** all sand in the bottom, a soft glow or pulse, and a primary **"Open"** button.
- Accessibility: expose progress with `role="progressbar"` and `aria-valuenow` / `aria-valuetext`.

### 6.4 Reveal moment (shatter)

When the user opens a capsule (normally or early):

1. The hourglass **cracks**: crack lines appear (~300ms).
2. It **shatters**: glass shards fly outward and fade, sand spills and dissolves (~900ms).
3. The note card **rises** into place with the title, body, and a "written at" line.

- On Android, add a short vibration on shatter (`navigator.vibrate([30, 40, 60])`), wrapped in feature detection.
- **`prefers-reduced-motion`:** replace the whole sequence with a simple 200ms cross-fade.
- Early-opened capsules use the same animation, then show the "opened early" badge.

---

## 7. Data

### 7.1 Data model (TypeScript)

```ts
type Unlock =
  | { type: "datetime"; at: number } // epoch ms
  | { type: "interval"; durationMs: number; at: number } // at = createdAt + durationMs
  | { type: "event"; label: string; doneAt?: number }; // doneAt set by "It happened"

interface Capsule {
  id: string; // crypto.randomUUID()
  schemaVersion: 1;
  title?: string;
  content: string;
  createdAt: number; // epoch ms
  unlock: Unlock;
  openedAt?: number;
  openedEarly?: boolean;
  earlyConfirmations?: number;
  reply?: { content: string; createdAt: number };
  notifiedAt?: number; // when an unlock notification was shown
}

interface Settings {
  language: "system" | "en" | "zh-TW";
  theme: "system" | "light" | "dark";
  allowEarlyOpen: boolean; // default false
  notificationsEnabled: boolean; // default false until permission granted
}
```

- Store all times as **epoch milliseconds (UTC)**. Format to local time only for display, using `Intl.DateTimeFormat` with the active locale.
- Capsule content is **immutable after sealing**. No editing. Deleting is allowed (with a confirmation).

### 7.2 Derived values (pure functions in `src/domain/`)

- `getStatus(capsule, now): "sealed" | "ready" | "opened"`
- `getProgress(capsule, now): number | null` (null for event capsules)
- `getRemainingMs(capsule, now): number | null`
- `getUnlockAt(capsule): number | null`

All must be pure and **fully unit-tested**, including edge cases: exactly at the unlock moment, `now` before `createdAt`, event capsules, opened capsules.

### 7.3 Storage layer

- Define a `CapsuleRepository` interface (`list`, `get`, `create`, `update`, `delete`, `exportAll`, `importAll`) and a `SettingsRepository`.
- Implement it with **Dexie** (IndexedDB). UI code must only talk to the interface, never to Dexie directly, so that a cloud backend (e.g. Supabase) can replace it later.
- On first launch, call `navigator.storage.persist()` to request durable storage. Show the result in Settings ("Storage: persistent ✓" / "Storage: may be cleared by browser").

### 7.4 Export / import

- **Export:** download `sendglass-backup-YYYY-MM-DD.json` containing `{ app: "sendglass", schemaVersion, exportedAt, settings, capsules }`.
- **Import:** validate the file, then **merge by `id`** (existing ids are skipped, not overwritten). Show a summary afterwards: "Imported 12, skipped 3 duplicates".
- Remind the user to export: if more than 14 days have passed since the last export and there are sealed capsules, show a gentle banner on Home.

---

## 8. Screens

Mobile-first (360–430px wide). On wide screens, center the content at max ~640px.

1. **Home**
   - Top app bar: app name, theme toggle, settings icon.
   - Section **"Ready to open"** (if any): cards with a full-sand glowing hourglass + "Open" button.
   - Section **"Sealed"**: cards with a hourglass, title (or the first line hidden as "••••"), progress %, and remaining time. Sorted by soonest unlock. Event capsules go last.
   - **FAB** (floating action button): "New capsule".
   - Empty state: a friendly illustration-free message, e.g. "Write something to your future self."
2. **Write capsule**
   - Optional title, body text area with a character counter.
   - Unlock type selector (segmented button: Date / Interval / Event) with the controls from §4.
   - Preview line: "Opens Tomorrow 08:00 (in 21h 14m)".
   - **"Seal"** button → short sealing animation (sand starts flowing) → back to Home.
   - Warn before leaving with unsaved text.
3. **Capsule detail (sealed)**
   - Large hourglass, progress number, unlock info, created time.
   - Content is **never shown** while sealed.
   - "It happened" (event capsules), "Break the seal" (if enabled), delete.
4. **Open / reveal**
   - Shatter animation (§6.4), then the note: title, body, "Written {relative time} ago, at {local datetime}".
   - Reply text area + "Save reply". The reply can be skipped and added later from History.
5. **History**
   - Opened capsules, newest first: title, dates, reply preview, "opened early" badge.
   - Tap to view the full note + reply.
6. **Settings**
   - Language: System / English / 繁體中文
   - Theme: System / Light / Dark
   - Allow early opening (switch, with explanation)
   - Notifications (switch + permission status + "Send test notification")
   - Storage status, Export, Import
   - About / version

Navigation: simple client-side routing with **hash routes** (`#/`, `#/new`, `#/capsule/:id`, `#/history`, `#/settings`) to avoid GitHub Pages 404 issues.

---

## 9. Notifications

Goal: "Your capsule is ready to open" when a capsule unlocks.

### 9.1 Phase 3 (no backend; required)

- Ask for notification permission **only** when the user turns on the setting, never on first launch.
- While the app is open or recently backgrounded: schedule timers for upcoming unlocks and show notifications via `ServiceWorkerRegistration.showNotification()`.
- On every app start or focus: check for capsules that became ready while closed. Show one summary notification for any not yet notified, and set `notifiedAt`.
- **App badge:** use the Badging API (`navigator.setAppBadge(count)`) for the number of ready capsules, with feature detection.
- Tapping a notification opens the app at that capsule (`#/capsule/:id`).
- Notification text never includes capsule content. Only "A capsule from {relative time} ago is ready." plus the title if present.

### 9.2 Phase 5 (reliable notifications when the app is fully closed): DECIDED, Option A

A pure PWA cannot reliably fire a notification at an exact time while it is closed. Two options were considered:

- **Option A (chosen 2026-11-21): Android app via Capacitor** + `@capacitor/local-notifications`. Notifications are scheduled on the device, no server needed. Exact timing on recent Android versions may depend on the user granting the "Alarms & reminders" permission. Otherwise they can arrive a few minutes late.
- **Option B (not chosen): tiny push backend** (e.g. Cloudflare Worker with Cron Triggers + Web Push). It stores only `{ pushSubscription, capsuleId, unlockAt }`, never content. Works for the PWA on any platform, but adds a server to maintain.

**Decision:** Option A. Phase 5 wraps the app in Capacitor for Android and schedules unlock notifications on the device with `@capacitor/local-notifications`. No backend is added. The web/PWA build keeps the Phase 3 behaviour (§9.1).

---

## 10. Internationalization

- Locales: `en` and `zh-TW`. Files: `src/i18n/locales/en.json`, `src/i18n/locales/zh-TW.json`.
- **No hard-coded UI strings** in components. Every visible string goes through `t()`.
- Default `system`: use zh-TW if `navigator.language` starts with `zh`, otherwise en.
- Relative times and dates: use `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat` with the active locale.
- Pluralization handled by i18next (English needs it, Chinese doesn't).
- zh-TW copy should sound natural and warm, not machine-translated.

---

## 11. PWA and hosting

- `vite-plugin-pwa` with `registerType: "prompt"`: show an "Update available, reload?" snackbar when a new version is deployed.
- Manifest: name "Sendglass", short_name "Sendglass", theme/background colors from tokens, `display: "standalone"`, icons 192/512 + maskable.
- Precache the app shell so it fully works offline.
- **GitHub Pages base path:** the site is served at `https://<user>.github.io/<repo>/`.
  - Set Vite `base` to `"/<repo>/"` (read from an env var).
  - Manifest `start_url` and `scope` and the service worker scope must match that base.
- Deploy with a GitHub Actions workflow on push to `main`: install → test → build → deploy to Pages.

---

## 12. Quality bar

- TypeScript strict, no `any` without a comment explaining why.
- ESLint + Prettier configured.
- Vitest tests for everything in `src/domain/` (status, progress, unlock computation, quick-chip times, the early-open chain state machine, import merge).
- Use fake timers in tests. Never depend on the real clock.
- Lighthouse PWA installable check passes. Accessibility score ≥ 90.
- Works in Android Chrome portrait. Touch targets ≥ 48px.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

---

## 13. Suggested project structure

```
src/
  domain/          # pure logic: types, status, progress, unlock, config (+ tests)
  storage/         # repository interfaces + Dexie implementation
  features/
    home/
    write/
    capsule/       # detail + reveal
    history/
    settings/
  components/      # Hourglass, ConfirmChain, AppBar, Fab, Card, Dialog, Snackbar…
  notifications/   # scheduling, badge, permission helpers
  i18n/            # setup + locales/en.json, locales/zh-TW.json
  styles/          # tokens.css (light/dark), global.css
  sw/              # custom service worker code if needed
public/icons/
.github/workflows/deploy.yml
```

---

## 14. Build phases

Work in this order. **Propose a plan before each phase, wait for approval, and commit when the phase is done.**

### Phase 1: Foundation

Vite + React + TS setup, ESLint/Prettier, Vitest, domain types and pure functions with tests, Dexie storage layer, i18n setup with both locales, theme tokens + theme switch, hash routing, GitHub Actions deploy.
**Done when:** you can create a capsule (any unlock type), see it on Home with a plain progress number, switch language and theme, and the site is live on GitHub Pages.

### Phase 2: Core flow

Write screen with all quick chips, capsule detail, "It happened" for events, open flow (no animation yet), reply, History, delete, early-open setting + full confirmation chain.
**Done when:** the whole lifecycle sealed → ready → opened → replied works in both languages, and the early-open chain behaves exactly as in §5.

### Phase 3: Hourglass and notifications

SVG hourglass with live sand level, suspended state for events, ready glow, shatter reveal, reduced-motion fallback, vibration. Phase-3 notifications + app badge (§9.1).
**Done when:** the hourglass matches the progress number, the shatter plays on open, and a notification appears for a capsule that unlocks while the app is open or backgrounded.

### Phase 4: PWA polish

Manifest, icons, offline precache, update prompt, persistent storage request, export/import with merge, backup reminder banner, Lighthouse checks.
**Done when:** the app installs on Android, works in airplane mode, and a backup can be exported and re-imported without duplicates.

### Phase 5: Reliable background notifications

Capacitor Android app with on-device local notifications (§9.2, Option A).

---

## 15. Open decisions

- [x] App name: Sendglass (砂時寄)
- [x] §9.2: Capacitor Android app (Option A), decided 2026-11-21
- [ ] Min/max unlock limits (currently 1 minute / 30 days)
