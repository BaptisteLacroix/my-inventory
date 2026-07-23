# Plan: "Mon Inventaire" — Tauri + React desktop port

Source spec reference (fully read): `d:\1-Travail\programmation\annotation-images\mock\Inventaire.dc.html` (699 lines, DC prototyping DSL — `class Component extends DCLogic { state, renderVals() }`, not real React; `support.js` is just the DSL runtime and is **not** ported; both live under `mock/` to keep them out of the way of the real app source). The Tauri+React+TS scaffold now exists at the repo root (created 2026-07-23 via `create-tauri-app`). Node v25.9.0 / npm 11.12.1 are already installed on this machine; Rust/Cargo/rustup are now installed too (confirmed 2026-07-23: `rustc 1.97.1`, `cargo 1.97.1`, `rustup 1.29.0` — VS Code was restarted to pick up the updated PATH), so the Phase 0 Rust-install prerequisite is satisfied. Still worth a one-time check that the Windows C++ Build Tools ("Desktop development with C++" workload) and WebView2 Runtime are present before the first `npm run tauri dev`.

Locked decisions (not re-litigated, all explicitly confirmed by the user on 2026-07-23 — Tauri was chosen over Electron for the lighter/faster installer now that Rust is installed, React was chosen over Angular for the lighter footprint and official Tauri v2 scaffold support, fixed fields were chosen over custom fields since the elderly end user shouldn't have to design her own form): Tauri v2 shell, React UI, Windows-only target, fixed item fields (no custom fields), background auto-save to real files (no save-button-or-lose-data), unsigned installer (SmartScreen click-through accepted), both PDF export and native print, multiple named inventories/profiles.

---

## 1. Project scaffold

**Tauri v2 + React + TypeScript + Vite** — confirmed as the right modern default (Tauri v2 CLI's own `create-tauri-app` scaffolds exactly this combo out of the box, it's the best-supported/documented path, and TS gives real safety for a state machine this data-model-heavy — much better than porting a `class Component` state blob into loosely-typed JS).

```
annotation-images/                    (repo root, becomes the app project root)
├── src/                              # React app (renderer / webview)
│   ├── main.tsx
│   ├── App.tsx                       # top-level: InventorySwitcher gate → main flow
│   ├── screens/
│   │   ├── Welcome.tsx
│   │   ├── Rooms.tsx
│   │   ├── Items.tsx
│   │   ├── Review.tsx
│   │   └── Export.tsx
│   ├── components/
│   │   ├── StepTimeline.tsx
│   │   ├── ItemCard.tsx
│   │   ├── ItemFormModal.tsx
│   │   ├── GuidedTour.tsx            # generic spotlight overlay, ports _overlay()
│   │   ├── InventorySwitcher.tsx     # home screen: list/create/rename/delete inventories
│   │   ├── PdfPreviewModal.tsx
│   │   └── Toast.tsx
│   ├── state/
│   │   ├── InventoryContext.tsx      # React Context + useReducer, mirrors `state`/actions
│   │   ├── reducer.ts
│   │   ├── actions.ts
│   │   └── types.ts                  # Room, Item, ItemFields, Inventory, TourState...
│   ├── lib/
│   │   ├── fields.ts                 # FIELDS array, itemTitle/itemDetails/itemNeedsInfo
│   │   ├── price.ts                  # parsePrice/fmtEuro (unit-test this)
│   │   ├── pdf.ts                    # generatePDF() ported from mockup, jsPDF
│   │   ├── tours.ts                  # screenTours / formTourSteps data
│   │   ├── storage.ts                # thin wrapper over Tauri fs/path plugin calls
│   │   └── inventoryFile.ts          # read/write manifest.json, image copy-in helpers
│   ├── settings/
│   │   └── SettingsContext.tsx       # accent, textScale, showTutorial — persisted app-wide
│   └── styles/tokens.css             # CSS vars: --accent, base font size, imported fonts
├── src-tauri/
│   ├── src/
│   │   └── main.rs                   # minimal: register plugins, no custom commands needed initially
│   ├── icons/
│   ├── capabilities/
│   │   └── default.json              # fs/dialog/shell/opener permission scoping
│   ├── Cargo.toml
│   └── tauri.conf.json               # productName, identifier, bundle target = nsis, windowsOnly
├── public/                           # static assets (fonts fallback, favicon)
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .gitignore                        # target/, node_modules/, dist/, src-tauri/target/
```

Key npm deps: `react`, `react-dom`, `@tauri-apps/api`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-shell` (or `plugin-opener` in newer v2), `@tauri-apps/plugin-store` (optional, for tiny key/value settings — simpler than hand-rolling a settings JSON file), `jspdf`, `vite`, `typescript`, `vitest` (unit tests for price parsing / PDF pagination helpers). No CSS framework needed — port the mockup's inline-style tokens into plain CSS/CSS variables, it's already a small, consistent design system.

Rust crate deps (`src-tauri/Cargo.toml`): `tauri`, `tauri-plugin-dialog`, `tauri-plugin-fs`, `tauri-plugin-shell` (for print/open-with-default-app), `serde`/`serde_json` (already a Tauri dependency). No image-processing crate needed (see §4).

Rust is now installed (rustc/cargo/rustup confirmed 2026-07-23). Remaining Phase 0 prerequisite to verify before `npm run tauri dev` will work: the Tauri v2 Windows prerequisites — Microsoft C++ Build Tools / VS Build Tools with the "Desktop development with C++" workload, and WebView2 Runtime (usually already present on Windows 10/11, but worth a version check on this machine specifically).

---

## 2. Data model & storage design

**Decision: plain files, no SQLite.** Per-inventory folder containing a JSON manifest + an `images/` subfolder of real files (JPEG), photos referenced by relative filename. Justification:
- Data shape is a small tree (inventories → rooms → items → fixed fields), not a relational/query workload. There's no need for joins, indexes, or transactions across thousands of rows — SQLite would add a dependency (`tauri-plugin-sql` + sqlx) and a migration story for zero real benefit here.
- JSON manifest is human-inspectable and trivially matches the existing "Enregistrer mon travail" JSON export the user already understands — export/import becomes "copy the manifest (+ optionally embed/zip images)" rather than a DB dump/import layer.
- Photos as separate files (not base64 in JSON) is already a locked decision, and also makes the manifest small/fast to write on every mutation — auto-save writes a small JSON, not megabytes of embedded image data.
- Corruption risk is well-contained by atomic-write technique (write to temp file, rename over manifest) — see §3.

**On-disk layout**, under Tauri's app-data dir (`tauri::path::app_data_dir()`, resolves to `%APPDATA%\<bundle-identifier>\` on Windows):

```
<app-data-dir>/
├── inventories.json                 # top-level index: [{id, name, createdAt, updatedAt}], + currentInventoryId
├── settings.json                    # {accent, textScale, showTutorial, seenTours:{welcome:bool,...}, seenFormTour:bool}
└── inventories/
    └── <inventoryId>/
        ├── manifest.json            # {version, rooms:[{id,name,items:[{id,photoFile,fields:{...}}]}]}
        └── images/
            └── <itemId>.jpg         # downscaled JPEG, named by item id (stable, no filename collisions)
```

- `inventoryId` = a uid (nanoid/uuid), directory name — avoids relying on user-editable names for filesystem paths (renames don't require moving folders or breaking references).
- `manifest.json` stores `photoFile` as a relative filename (`"<itemId>.jpg"`) resolved against that inventory's `images/` dir at load time into an asset URL (see §4) — never an absolute path, so the whole `inventories/<id>/` folder stays portable/relocatable (needed for the backup/export flow anyway).
- Tour "seen" flags move from localStorage keys into `settings.json` (`seenTours.welcome`, `seenTours.rooms`, ..., `seenFormTour`) — same semantics as the mockup's `inv_tuto_<screen>` / `inv_form_tuto_seen`, just relocated.

**Multi-inventory selection/creation/rename/delete:**
- New top-level screen/gate: `InventorySwitcher` shown before the Welcome/Rooms/... flow when no inventory is "open," or reachable via a persistent header control ("Changer d'inventaire") once inside one — mirrors the mockup's top-bar pattern but adds one more nav level.
- Create: prompt for a name → generate uid → write empty `manifest.json` + `images/` dir → append to `inventories.json` → set as current.
- Rename: only touches the display `name` in `inventories.json` (no filesystem move, per the id-based directory naming above).
- Delete: confirm (reuse the mockup's `window.confirm`-style pattern, but native — see the modal/dialog note in §7) → remove the directory recursively via the fs plugin → remove from `inventories.json` → if it was the current inventory, clear `currentInventoryId` and return to the switcher.
- "Currently open" tracking: `currentInventoryId` field in `inventories.json`, loaded on app start; if absent/invalid, land on the switcher instead of auto-picking one — never silently guess which inventory the user meant.

---

## 3. Auto-save strategy

Replace the mockup's `persist()` (called synchronously after every `setState` that touches `rooms`, straight to `localStorage`) with **debounced writes to `manifest.json`** via the reducer:

- Every dispatch that mutates rooms/items/fields marks the in-memory state dirty; a `useEffect` watching the relevant slice of state schedules a write via `setTimeout`/`clearTimeout` debounce (e.g. 400-600ms of inactivity, same order of magnitude as the mockup's toast timing) rather than writing on literally every keystroke in the item-form text inputs — this matters more here than in the mockup because we're doing real disk I/O + JSON.stringify of potentially large room/item trees, not an instant localStorage call.
- Photo file writes (copying imported images into `images/`) happen immediately/eagerly at import time (not debounced) — only the manifest JSON (metadata) is debounced; the actual image bytes should never be at risk of loss since they're the expensive, non-reconstructable part.
- Write technique: write new manifest content to `manifest.json.tmp` then rename/replace over `manifest.json` (atomic on the same volume) — protects against a crash mid-write leaving a corrupt manifest. Tauri's fs plugin supports `writeTextFile`; renaming can go through the fs plugin's `rename`/`remove`+`rename` sequence, or shell out via a tiny Rust command if the plugin doesn't expose atomic rename directly (worth confirming plugin API surface in Phase 1 rather than assuming).
- On app quit (Tauri `onCloseRequested` / `beforeunload` equivalent), flush any pending debounced write synchronously before allowing close — small but important: the mockup never had this problem since localStorage writes were synchronous and instant.
- Item-form modal (`ItemFormModal`, replacing the "Enregistrer"/"Annuler" pattern): the mockup already batches field edits into a local `draft` object and only commits to `rooms` on explicit "Enregistrer" click (see `saveDraft()`), so this part ports directly — the debounced-write concern is about the reducer's downstream persistence, not the modal's own local draft state, which can stay React `useState` inside the modal.
- Rooms/inventories index (`inventories.json`) writes are inherently rare (create/rename/delete) — no need to debounce those, write immediately.

---

## 4. Image import & downscaling

**Decision: keep downscaling in the webview via `<canvas>`, same as the mockup** — do not move this to a Rust image crate. Justification: the mockup's `readImage()` (FileReader → `Image` → canvas resize to max 1400px side → `toDataURL('image/jpeg', 0.85)`) is small, already tuned, and canvas-based JPEG re-encoding in a Chromium-class webview (WebView2 on Windows) is fast enough for "dozens of photos" — introducing a Rust image crate (e.g. `image` + a Tauri command) adds a serialization round-trip (bytes across the IPC boundary) and a second codepath to maintain for no real performance win at this scale. Revisit only if users report hundreds of very large photos causing UI jank.

Flow, mapped to Tauri APIs:
1. **Multi-file picker**: mockup's `<input type=file accept=image/* multiple>` → replace with `@tauri-apps/plugin-dialog`'s `open({ multiple: true, filters: [{name:'Images', extensions:['png','jpg','jpeg','webp']}] })`, which returns real filesystem paths (not `File` objects/blobs).
2. **Folder picker**: mockup's `webkitdirectory` input → `open({ directory: true })` from the same dialog plugin, then enumerate image files in that directory via `@tauri-apps/plugin-fs`'s `readDir` (recursive:false to match the mockup's flat "all photos in this folder" behavior, or recursive:true if we want to be more generous — flag as a small product decision, default to non-recursive to match mockup semantics exactly).
3. **Read + downscale**: for each selected path, read bytes via `readFile` (fs plugin) → build a `Blob`/object URL or a data URL in JS → run through the existing canvas downscale logic → get a JPEG blob.
4. **Persist as a real file**: write the downscaled JPEG blob to `inventories/<id>/images/<itemId>.jpg` via `writeFile` (fs plugin, binary mode) — this is the key change from the mockup's base64-in-JSON `item.photo` field. The manifest only stores `photoFile: "<itemId>.jpg"`.
5. **Display**: to show images in `<img>` tags without re-reading through JS on every render, use Tauri's `convertFileSrc()` (asset protocol) to turn the absolute image path into a webview-loadable URL — this replaces the mockup's direct `item.photo` data-URL usage in `mkImg()`. Requires enabling the asset protocol scope for the app-data images directories in `tauri.conf.json` / capabilities.

This keeps `handleFiles()`'s shape almost identical to the mockup (same Promise.all-over-images pattern), just swapping "FileReader on a `File` blob" for "fs-plugin read of a path" and swapping "store data URL in state" for "write file, store filename in state."

---

## 5. PDF generation approach

**Decision: keep jsPDF client-side in the webview**, port `generatePDF()` almost as-is. Justification: it's already fully working, detailed, and tuned (cover page layout, per-item page with `addImage` + manual field table via `splitTextToSize` + page-break handling at `y > PH-M-14`) — rewriting this in a Rust PDF crate (e.g. `printpdf`) would mean redoing all of that layout math in a different language/API for zero functional gain, and jsPDF runs fine inside WebView2. The only real changes needed when porting:
- `doc.addImage(it.photo, ...)` currently takes a data URL; with photos now stored as files, either (a) read the file back into a data URL at PDF-build time (`convertFileSrc` won't work for jsPDF's `addImage`, which needs actual image data — so read bytes via fs plugin and base64-encode in JS just for this one operation), or (b) keep a small in-memory cache of data URLs for the currently-open inventory's items built once (e.g. on entering the Export screen) to avoid re-reading every item's file on every "Voir l'aperçu" / "Télécharger" click.
- `doc.getImageProperties`/`addImage`/`splitTextToSize` calls are otherwise unchanged.
- Cover page + per-item pages + pagination logic (`if(y>PH-M-14){ doc.addPage(); y=M+6; }`) ports verbatim.
- `flatItems()`, `printMeta()`, `parsePrice()`, `fmtEuro()` port verbatim into `lib/price.ts` / `lib/pdf.ts` — these are exactly the "worth a unit test" pieces called out below.

The mockup's separate legacy `printing` state (`window.print()` on an HTML view) is **dropped entirely**, not ported — per the CONTEXT note it predates/duplicates jsPDF, and the new native "Imprimer" flow (§6) replaces its intended purpose properly.

---

## 6. Native print flow (new vs. mockup)

The mockup only had `window.print()` on a browser HTML view — that trick doesn't apply the same way in a Tauri webview and is superseded now that jsPDF produces a real PDF anyway. New flow:
1. Generate the PDF via the same `generatePDF()` logic as export, but instead of (or in addition to) saving, write it to a temp file in the OS temp dir (`@tauri-apps/api/path`'s `tempDir()` + a fixed filename like `apercu-impression.pdf`, or the current inventory's own temp/export scratch location).
2. Open that PDF with the OS default handler via `@tauri-apps/plugin-shell`'s `open()` (or `plugin-opener` in newer Tauri v2 versions) — on Windows this launches the user's default PDF viewer (Edge, Adobe Reader, etc.), which has its own built-in print button/`Ctrl+P` → opens the real native Windows print dialog. This is simpler and more robust than trying to drive `rundll32 mshtml.dll,PrintHTML` or similar low-level tricks, and doesn't require bundling a PDF renderer.
3. UI: add a distinct "Imprimer" button next to "Télécharger le PDF" in the Export screen / PDF preview modal — both call `generatePDF()`, they just differ in the final step (save-via-dialog vs. write-to-temp-and-shell-open).
4. Document for the end user (in-app microcopy, mirroring the mockup's tone): "Une fenêtre va s'ouvrir avec votre document ; utilisez le bouton Imprimer de cette fenêtre."

Open question worth flagging (not blocking Phase 0-3, only Phase 3 finishing touches): whether to skip the "open in default viewer, user clicks print" indirection in favor of a more direct print API — Tauri/webview2 has no built-in "print this PDF silently" primitive without extra native dependencies, so the shell-open approach is the pragmatic default; revisit only if user testing shows the extra click is confusing.

---

## 7. Native save/open dialogs (backup export/import, PDF export)

Replace `showSaveFilePicker` / hidden `<input type=file>` with `@tauri-apps/plugin-dialog`:
- **"Enregistrer mon travail" → "Exporter une copie"**: `save({ defaultPath: 'mon-inventaire.json', filters:[{name:'Sauvegarde', extensions:['json']}] })` → if a path is returned, write the current inventory's manifest (plus maybe a version/exportedAt wrapper, matching the mockup's `{app,version,savedAt,rooms}` shape) via `writeTextFile`. Decide whether export bundles images too (see below) or is JSON-only (matching mockup exactly, images stay data-URL-free and this is metadata-only — simplest for Phase 1, revisit if users need a fully portable single-file backup with photos included, which would mean zipping `images/` alongside, a reasonable Phase 4/5 stretch goal, not required for parity).
- **"Reprendre un fichier" → "Importer une copie"**: `open({ multiple:false, filters:[{name:'Sauvegarde', extensions:['json']}] })` → read the file → validate shape (port the mockup's defensive `rooms=Array.isArray(obj)?...` normalization) → this creates/overwrites the *current* inventory's data (or prompts to import as a new named inventory — recommend: always import as a **new** inventory with a user-provided or auto-generated name, never silently overwrite an existing one, since that's a safer default now that there's a multi-inventory model to fit into).
- **PDF export save dialog**: same `save()` API with a `.pdf` filter, writing the jsPDF blob's bytes via `writeFile` (binary).
- All `window.confirm()` calls in the mockup (delete room, delete item, reset all) should become a real Tauri dialog (`@tauri-apps/plugin-dialog`'s `confirm()` / `ask()`) rather than the browser's blocking `confirm()`, which doesn't exist/looks out of place in a native shell — small but easy win, flag it explicitly so it isn't missed during porting since it's easy to just leave `window.confirm` in place and have it silently not work or look wrong in WebView2 (WebView2 does support `window.confirm`, so this won't crash, but it's an ugly native-OS-styled dialog inconsistent with the rest of the app — worth swapping for visual consistency).

---

## 8. React app structure & state management

**State management: React Context + `useReducer` is sufficient** — confirmed. This app's state shape is a single tree (current inventory's rooms/items, plus UI state like current screen/editing item/tour state) with a well-defined, enumerable set of transitions (add room, delete room, add items, save item fields, delete item, navigate screen, tour step forward/back, etc.) — exactly the shape `useReducer` fits, and Redux/Zustand/etc. would be overkill for one desktop app with no cross-tab sync needs. Recommend **two contexts**, not one, to avoid coupling concerns:
- `InventoryContext` (rooms/items/fields/currentRoomId/editingItemId + dispatch) — the "business data," debounce-persisted per §3.
- `SettingsContext` (accent/textScale/showTutorial/seenTours) — persisted to `settings.json`, changes are rare, no debounce needed (write immediately on change).
- Tour UI state (tourActive/tourKey/tourStep/tourRect, formTourActive/...) can live as local component state in `GuidedTour`/`App` rather than global context — it's transient/derived UI state, not data that needs to survive a reload.

Component breakdown mirroring the mockup's screens (see §1 tree) — mapping mockup concepts to components:
- `StepTimeline` ← the `timeline`/`tlRef`/`node.onClick` block (top step indicator).
- `Welcome`, `Rooms`, `Items`, `Review`, `Export` ← the five `sc-if` screen blocks, each a real component reading from `InventoryContext` instead of `renderVals()` computed props.
- `ItemCard` ← the per-item card markup repeated in both Items and Review screens (mockup duplicates this inline twice; factor into one shared component with a `variant` or `compact` prop to cover both layouts — a clear simplification opportunity vs. the mockup).
- `ItemFormModal` ← the editing modal, owns local `draft` state (mirrors mockup's `state.draft`), commits to `InventoryContext` on save.
- `GuidedTour` ← generic component/hook porting `_overlay()` + `measure()`; takes `steps`, `activeIndex`, a `refs` map, and `onNext/onPrev/onEnd` — usable for both the screen tours and the form tour (the mockup already shares one `_overlay()` for both, keep that reuse).
- `InventorySwitcher` ← new: home/gate screen for multi-inventory create/select/rename/delete (§2).
- `PdfPreviewModal` ← the `pdfPreview` block; triggers `lib/pdf.ts`'s `generatePDF()`.
- `Toast` ← simple timed message component, replacing `toastMsg()`.

**Guided tour port details** (spotlight measurement): `getBoundingClientRect()` on ref'd DOM nodes works identically in a Tauri webview (it's just Chromium/WebView2, same DOM APIs) — no porting risk here. Refs: replace the mockup's manual `this.tourRefs[name]=el` callback-ref bag with either (a) a `Map<string, HTMLElement>` held in a `useRef` inside `GuidedTour`'s consumer, populated via inline `ref={el => tourRefs.current.set('roomsArea', el)}` callbacks on the same elements the mockup marks (`timeline`, `saveArea`, `start`, `roomsArea`, `importArea`, `infoHint`, `reviewArea`, `exportArea`, plus form fields `fName`/`fGrid`/`fSerie`/`fNote`/`fSave`) — same target-name strings as `screenTours`/`formTourSteps` in the mockup, so that data (`lib/tours.ts`) ports verbatim, just typed. Resize handling (`window.addEventListener('resize', ...)` → re-measure) ports as a `useEffect`.

---

## 9. Settings/appearance

No more design-tool prop panel (`accent`/`textScale`/`startTutorial` used to be editable via the DC preview harness's props panel) — these need a real home:
- **Simplest correct approach**: a small in-app "Réglages" screen/modal (gear icon in the header, or folded into `InventorySwitcher`'s shell) exposing: accent color (same 4 preset pairs as the mockup's `options`, rendered as swatch buttons — no need for a full color picker, matches the mockup's constrained palette intent), text scale (Normale/Grande/Très grande, same 17/19/22px mapping), and a "Réactiver les tutoriels" action (resets all `seenTours`/`seenFormTour` flags in `settings.json`, giving the same effect as the mockup's "Aide" button but app-wide instead of per-screen-replay-only).
- Persisted in `settings.json` at the app-data root (not per-inventory — these are app-wide preferences, appropriate since one person uses this app regardless of which inventory is open).
- `--accent` CSS variable and base font size get applied at the root the same way the mockup does (`rootStyle` with `'--accent'` and `fontSize`), just sourced from `SettingsContext` instead of DC `this.props`.
- "Aide" button (replay current screen's tour on demand) stays a per-screen action, separate from the Réglages screen's "reset all tours" action — matches the mockup's existing two-tier model (`startTour()` force-replays vs. natural first-visit auto-trigger gated by `seenTours`).

---

## 10. Installer/build (Windows, unsigned)

- `tauri build` with `tauri.conf.json`'s `bundle.targets` set to `["nsis"]` (NSIS installer is the more common/flexible choice for unsigned Windows installs vs. MSI; MSI has stricter expectations around signing/upgrade codes that add friction for an unsigned build — NSIS is the pragmatic pick here, and Tauri v2's default scaffolding already leans NSIS).
- No code-signing cert configured (`bundle.windows.certificateThumbprint` left unset) — the resulting installer `.exe` will trigger Windows SmartScreen ("Windows protected your PC") on first run since it's unsigned and has no reputation.
- **Document for the end user** (README/help text, since this app is aimed at a non-technical elderly user — likely the user's family member will do the actual install): on the SmartScreen screen, click "**Informations complémentaires**" → "**Exécuter quand même**" to proceed. Worth a one-time screenshot-annotated note in whatever install instructions ship with the installer, since this is the single most likely point of confusion/abandonment for a non-technical installer.
- `tauri.conf.json` identifier (`com.<something>.inventaire` reverse-DNS style) should be chosen now even though only Windows ships today — this avoids an app-data-directory migration headache later if targeting another OS is ever revisited (the CONTEXT explicitly says "don't paint into a corner"); the identifier is the one field that's expensive to change after users have real data under it.
- Version numbering: start at `0.1.0`, bump per phase/milestone build so early informal testing has a stable reference point.

---

## 11. Phased build order

**Phase 0 — Scaffold**
- Rust/rustup already installed (confirmed 2026-07-23) — just confirm Windows C++ build tools + WebView2 are present before scaffolding.
- `npm create tauri-app@latest` (React + TS + Vite template), verify `npm run tauri dev` opens a blank window.
- Set up directory structure from §1, port design tokens (fonts, colors, base CSS) from the mockup's `<style>` block into `src/styles/tokens.css`.
- Wire `tauri.conf.json` identifier, window title "Mon inventaire", default window size (mockup was clearly designed for ~1040px content width — pick a sensible default window size, e.g. 1200x850, resizable).
- **Verify**: app launches, shows a placeholder screen with the correct fonts/background color, `tauri build` succeeds producing an (unsigned) NSIS installer that installs and launches on a clean-ish Windows profile.

**Phase 1 — Rooms + Items + Photos + Persistence (single inventory, no multi-inventory yet, no PDF/tours)**
- `InventoryContext`/reducer, `types.ts` (Room/Item/ItemFields).
- Rooms screen: create/list/delete rooms (suggestion chips + free text), no multi-inventory switcher yet — just one hardcoded/default inventory folder to prove out the storage layer.
- Items screen: multi-file + folder picker via dialog plugin, canvas downscale, write JPEG to `images/`, display via `convertFileSrc`, item card grid, delete item.
- Storage layer (`lib/storage.ts`, `lib/inventoryFile.ts`): manifest read/write, atomic-write-via-temp-file+rename, debounced persistence.
- **Verify**: create 2-3 rooms, import a folder of ~20 real photos into one room, close and relaunch the app, confirm rooms/photos are exactly as left (reads back from disk, not just in-memory). Manually inspect `%APPDATA%\<id>\inventories\<id>\` to confirm real JPEG files exist and `manifest.json` is small/readable. Kill the app process mid-import (simulate crash) and confirm the manifest isn't left corrupted (atomic write did its job).

**Phase 2 — Item form + Review**
- `ItemFormModal` with the 7 fixed fields, draft/save/cancel/delete semantics ported from mockup.
- "Informations à ajouter" badge logic (`itemNeedsInfo`), item title/summary derivation (`itemTitle`/`itemDetails`) → `lib/fields.ts`.
- Review screen: grouped-by-room listing, counts, `parsePrice`/`fmtEuro` → `lib/price.ts` (**unit test this**: currency strings like `"850 €"`, `"1 200,50€"`, empty string, garbage text, negative-looking input — the mockup's regex is naive and worth locking behavior down with tests before it's relied on for a printed "valeur totale estimée").
- **Verify**: fill in fields for several items across rooms with varied price formats, confirm Review's total matches manual arithmetic; leave some items blank and confirm the "Informations à ajouter" / "Aucune information ajoutée" states render correctly in both Items and Review.

**Phase 3 — PDF export + Print**
- Port `generatePDF()`/`flatItems()`/`printMeta()` into `lib/pdf.ts`, adapting photo access to read-file-then-base64 (§5).
- Export screen + `PdfPreviewModal` (HTML preview mirroring mockup's cover+per-item pages), "Télécharger le PDF" via save dialog, new "Imprimer" via temp-file + shell-open (§6).
- **Unit test** pagination logic specifically: a fabricated item with enough long-text fields to force the `y > PH-M-14` page-break branch in the field-table loop — confirm it actually calls `addPage()` and continues rather than overflowing off-page. This is exactly the kind of easy-to-silently-break-during-porting logic that deserves a test given it's pure/deterministic math over inputs.
- **Verify**: generate a PDF with 15+ items including at least one with a very long note (multi-line wrap) and one with no fields at all; open the resulting PDF and manually check page count, image placement, and text wrapping look right. Click "Imprimer" and confirm the OS default PDF viewer opens with the file loaded and its print dialog is reachable.

**Phase 4 — Multi-inventory**
- `inventories.json` index, `InventorySwitcher` screen (create/rename/delete/select), wire "currentInventoryId" gating at app start.
- Migrate Phase 1-3's single hardcoded inventory into "first inventory created via the switcher" — no real migration needed if Phase 1-3 was only ever used for dev/testing data.
- Backup export/import (§7) rewired to operate on "the currently open inventory" and to land as "import creates a new named inventory" per the recommendation in §7.
- **Verify**: create 3 named inventories with distinct room/item data, switch between them repeatedly confirming no data bleeds across inventories, delete one and confirm its folder is actually removed from disk, export one inventory to JSON and import it back as a new inventory, confirming a byte-for-byte-equivalent room/item structure (photos won't roundtrip through the JSON-only export per the Phase-1-scope decision in §7 — confirm that's the expected/documented behavior, not a bug).

**Phase 5 — Guided tours + Settings + Polish + Installer**
- `GuidedTour` component + `lib/tours.ts` data, wire screen tours + form tour, "seen" flags in `settings.json`, "Aide" replay button.
- Settings screen (accent presets, text scale, replay-all-tours action) per §9.
- Visual polish pass: replace remaining `window.confirm`-style flows with native dialog-plugin confirms (§7), review every screen against the mockup pixel-by-pixel for parity, verify text-scale changes propagate correctly to every screen (not just ones visited after the change).
- Final installer build: `tauri build`, test install on a clean Windows VM/profile if possible, confirm SmartScreen behavior and that "Exécuter quand même" successfully launches the installed app; write the one-page end-user instructions covering SmartScreen click-through.
- **Verify**: run through the entire guided tour end-to-end (screen tours for all 5 screens + the form tour) on a fresh settings.json (no seen-flags) confirming spotlight positioning tracks the right elements and Suivant/Précédent/Passer/Terminer all behave; change text scale and accent mid-session and confirm both apply live without restart; confirm "Réactiver les tutoriels" actually makes tours replay on next screen visits.

---

## 12. Testing approach summary

Manual test steps are the primary verification method throughout (appropriate for this UI-heavy, non-technical-end-user desktop app), with unit tests specifically called out for:
- `parsePrice()` / `fmtEuro()` (`lib/price.ts`) — deterministic pure functions handling messy free-text currency input that feeds directly into a number shown to the user and printed on an insurance document; regressions here are easy to introduce silently.
- PDF pagination branch in `lib/pdf.ts` (the `y > PH-M-14` page-break check) — pure layout math, easy to get an off-by-one wrong when porting/refactoring, and a bug here means literally missing content on a printed insurance document (worst-case failure mode in the whole app).
- `itemNeedsInfo()` / `itemTitle()` / `itemDetails()` (`lib/fields.ts`) — small pure functions but drive badge/label logic shown in three different screens; a quick test locks their contract.
- Manifest read/normalize logic (the defensive `Array.isArray(obj)?obj:(obj.rooms...)` shape-checking ported from `onOpenWork()`) — worth a couple of unit tests feeding malformed/legacy JSON shapes, since this is the one place a corrupted or hand-edited file could otherwise crash the importer.

No need for broader component/E2E test automation given the scope and single-developer-maintained nature of this app — manual pass per phase (as detailed above) is the right level of investment.

---

## Open questions (non-blocking, flagged only)

1. Backup export/import scope: JSON-metadata-only (matches mockup, recommended default) vs. bundling photos (zip) — recommend starting metadata-only and revisiting only if real usage shows a need for a single-file portable backup including images.
2. Folder-picker recursion depth when importing a folder of photos — recommend non-recursive (flat, matches mockup's `webkitdirectory` behavior) unless testing shows users expect subfolders included.

Neither blocks starting Phase 0 or Phase 1.

---

### Critical Files for Implementation
- `d:\1-Travail\programmation\annotation-images\mock\Inventaire.dc.html` — source-of-truth UX/copy/logic spec being ported (all screens, tour data, `generatePDF()`, `parsePrice()`, field definitions).
- `src-tauri\tauri.conf.json` — bundle target (NSIS), identifier, window config, capabilities/permissions for fs/dialog/shell/asset-protocol scoping.
- `src\state\reducer.ts` / `src\state\InventoryContext.tsx` — central state machine replacing the mockup's `class Component` state + `renderVals()`.
- `src\lib\inventoryFile.ts` / `src\lib\storage.ts` — manifest read/write, atomic-write, debounce, and the multi-inventory folder layout from §2/§3.
- `src\lib\pdf.ts` — ported `generatePDF()`/pagination logic, the highest-stakes correctness surface in the app.
