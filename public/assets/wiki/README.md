# Wiki media

Screenshots and demo videos for the in-app help wiki go here. The panel loads them
automatically by filename — until a file exists, its frame shows a small "à venir"
placeholder instead of a broken image.

## Editing the wiki text

All wiki text (screen guides, steps, FAQ, troubleshooting) lives in one file:

    src/data/wiki.json

Edit that file and rebuild — no code changes needed. Your editor will autocomplete and
validate the fields thanks to `src/data/wiki.schema.json`.

## Default filenames

For each screen id (`welcome`, `rooms`, `items`, `review`, `export`):

| File               | Where it appears                     |
| ------------------ | ------------------------------------ |
| `screen-<id>.png`  | The screenshot at the top of a guide |
| `video-<id>.mp4`   | The "Vidéo de démonstration" block   |

Examples: `screen-welcome.png`, `video-items.mp4`.

## Using a custom filename

Prefer a different name (or a different format)? Add an `image` or `video` field to that
screen in `src/data/wiki.json`. The value is just the filename inside this folder:

```json
{
  "id": "welcome",
  "image": "accueil-capture.png",
  "video": "accueil-demo.webm"
}
```

## Images/videos on each step (step-by-step)

Every numbered step in a screen guide can have its **own** image and/or video, shown right
under that step. Add `image`, `video`, and/or `caption` to the block in `src/data/wiki.json`:

```json
"blocks": [
  {
    "h": "« Ajouter des photos »",
    "t": "choisissez une ou plusieurs photos sur l'ordinateur.",
    "image": "items-step-1.png",
    "caption": "Le grand bouton vert en haut de l'écran."
  },
  {
    "h": "Choisissez vos fichiers",
    "t": "la fenêtre de l'ordinateur s'ouvre.",
    "video": "items-step-2.mp4"
  }
]
```

Add as many steps as you like — one block per step. `image`/`video` are just filenames in
this folder (no naming rule; call them what you want). Missing files show an "à venir"
placeholder until you add them.

## Where files are served from

Files here are served from the site root (`/assets/wiki/...`), so no import or code change
is ever needed — just add the file with the right name.
