# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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

[0.1.0]: https://github.com/BaptisteLacroix/my-inventory/releases/tag/v0.1.0
