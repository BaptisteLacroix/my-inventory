# My Inventory

A guided desktop app for photographing and cataloguing your belongings room by room, then exporting a PDF (or printing) a document suitable for insurance purposes.

It was built for a non-technical, elderly end user: no accounts, no cloud, no save button. You add photos, jot down what you know about each item, and everything is saved to disk automatically as you go. The interface itself is in French; the project and its code are in English.

## Features

- **Guided flow**: Rooms → Items (photos) → Review → Export, one step at a time.
- **Photo-first workflow**: import individual photos or a whole folder at once; each photo becomes an item card.
- **Fixed, simple fields** per item (name, price, purchase date, place, dimensions, serial number, notes) — no custom fields to configure, so there's nothing to design or get wrong.
- **Autosave**: every change is debounced and written straight to a local `manifest.json`, using an atomic write (write-to-temp-then-rename) so a crash or power loss mid-save can't corrupt existing data.
- **PDF export & native print**, one page per item with its photo and filled-in details.

## Tech stack

- [Tauri v2](https://tauri.app/) — Rust-backed desktop shell (small installer, no Electron/Chromium bundling)
- React 19 + TypeScript
- Vite for the frontend build
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation

## Project structure

```
src/
  screens/       Welcome, Rooms, Items, Review, Export — one component per step
  components/     ItemCard, ItemFormModal, PdfPreviewModal, StepTimeline, Toast...
  state/          React Context + reducer (rooms/items/screen state)
  lib/            field definitions, PDF generation, image handling, file persistence
src-tauri/        Rust/Tauri shell: window config, filesystem & dialog plugin wiring
```

Data on disk (per OS app-data directory):
```
<appData>/inventories/default/
  manifest.json     rooms, items, and their fields
  images/<id>.jpg    one downscaled photo per item
```

## Development

Requires Node.js and the Rust toolchain (see the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS).

```bash
npm install
npm run tauri dev
```

## Building an installer

```bash
npm run tauri build
```

Produces a Windows NSIS installer at `src-tauri/target/release/bundle/nsis/My Inventory_<version>_x64-setup.exe`. The installer isn't code-signed, so Windows SmartScreen will show a warning on first run ("More info" → "Run anyway").

## License

No license specified yet — all rights reserved by default.
