# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-07-24

### Added
- An onboarding tutorial that walks first-time users through each screen (Bienvenue, Vos pièces, Vos objets, Aperçu, PDF) with a spotlight on the relevant part of the screen and a short explanation. It appears automatically the first time you reach each screen, is remembered afterward so it won't repeat, and can be replayed anytime via the "Aide" button in the header.
- A matching guided tour for the item form (name, details, serial number, notes, save), shown the first time you open it and replayable via the "? Aide" button inside the form.

## [0.1.1] - 2026-07-23

### Fixed
- The "Imprimer" button in the PDF preview no longer fails with a permission error. It previously wrote a preview PDF to disk and tried to open it in the system's default PDF viewer, which requires filesystem permissions the app didn't grant (and, once granted, just handed off to whatever app is registered for `.pdf`, not necessarily something with an obvious print action). Printing now opens the native OS print dialog directly from within the app.

## [0.1.0] - 2026-07-23

First release. A guided desktop app for photographing and cataloguing your belongings room by room, then exporting a PDF (or printing) for insurance purposes.

### Added
- Guided flow: Rooms → Items → Review → Export, one step at a time
- Photo import: add individual photos or a whole folder of photos at once; each photo becomes an item card
- Simple fixed fields per item — name, price, purchase date, place, dimensions, serial number, notes
- Autosave to a local `manifest.json`, using an atomic write (write-to-temp-then-rename) so a crash or power loss mid-save can't corrupt existing data
- PDF export and native print, one page per item with its photo and filled-in details

### Known limitations
- Windows only, and the installer isn't code-signed — Windows SmartScreen will warn on first run
- Single inventory only (multiple named inventories are planned but not in this release)
- Interface is in French

[0.2.0]: https://github.com/BaptisteLacroix/my-inventory/releases/tag/v0.2.0
[0.1.1]: https://github.com/BaptisteLacroix/my-inventory/releases/tag/v0.1.1
[0.1.0]: https://github.com/BaptisteLacroix/my-inventory/releases/tag/v0.1.0
