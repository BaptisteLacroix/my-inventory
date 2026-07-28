# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.4.0] - 2026-07-28

### Added
- An in-app help guide (the floating "?" button, bottom-right, or "Aide" in the header): a screen-by-screen walkthrough with a screenshot and numbered explanations for every button and interaction, a step-by-step overview of the whole process, a FAQ, and a troubleshooting section — all illustrated with real screenshots of the app rather than placeholder text. Opening it from a given screen jumps straight to that screen's guide, and you can replay its guided-tour bubbles directly from there.

### Fixed
- The help guide's content pane no longer keeps its previous scroll position when switching sections — jumping from a screen guide you'd scrolled through to a short section like the FAQ used to open scrolled to the bottom instead of the top.

## [0.3.0] - 2026-07-26

### Added
- Automatic update checks: the app checks GitHub for a newer release a few seconds after startup, and shows a dialog with the new version number and its changelog if one is found. Choosing "Mettre à jour" downloads and installs it, then restarts the app. Choosing "Plus tard" just dismisses it for this session. A "Vérifier les mises à jour" button in the header lets you check on demand, with a toast either way (up to date / check failed).
- Releases are now built, signed, and published automatically by a GitHub Actions workflow (`.github/workflows/release.yml`) whenever a `vX.Y.Z` tag is pushed, replacing the manual local-build-and-upload process. The release body is pulled straight from this changelog's matching version section, which is what shows up in the update dialog.

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

[0.4.0]: https://github.com/BaptisteLacroix/my-inventory/releases/tag/v0.4.0
[0.3.0]: https://github.com/BaptisteLacroix/my-inventory/releases/tag/v0.3.0
[0.2.0]: https://github.com/BaptisteLacroix/my-inventory/releases/tag/v0.2.0
[0.1.1]: https://github.com/BaptisteLacroix/my-inventory/releases/tag/v0.1.1
[0.1.0]: https://github.com/BaptisteLacroix/my-inventory/releases/tag/v0.1.0
