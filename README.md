# Stitch Studio

A simple embroidery digitizer that runs entirely in your browser. Load an SVG or type text in any font on your computer, pick how each part is stitched, and export a file for your machine.

**Use it online:** https://thom7215.github.io/stitchstudio/

Or open `index.html` (also in `dist/`) in Chrome, Edge, Firefox or Safari. It is one self-contained file with no install, server or internet connection needed.

## Features

- **Artwork:** drop in an SVG, or type text using any font installed on your computer (or add a font file).
- **Auto-digitize:** every shape gets satin, fill or outline picked for it automatically.
- **Per-part control:** click any letter or SVG part to choose Satin, Fill, Outline or Skip. Satin can be Automatic or Manual.
- **Manual satin columns:** draw rails along the edges and rungs for the stitch direction. Rails can follow the shape edge, a smooth curve or a straight line (Tab switches), with CorelDRAW-style node handles.
- **Satin borders:** trace any part of an outline to give it an adjustable satin border.
- **Patch edge run:** an optional running stitch along the inside edge of satin, as on patches.
- **Stitch quality:** adaptive satin spacing on curves, short stitches, pull compensation, underlay, tatami fill with knockout of covered areas, and travel routed inside shapes to cut trims.
- **Sew order:** drag and drop in the Sew order tab.
- **Hoops:** realistic frames for Brother / Baby Lock, Janome / Elna, Husqvarna Viking, Pfaff, Bernina, Bernette and multi-needle machines.
- **Machine files:** PES (Brother, Baby Lock, Bernette), JEF (Janome, Elna), EXP (Bernina), VP3 (Viking, Pfaff), DST (Tajima and most commercial machines).
- **Projects:** save and reopen your work as a `.json` project.

## Project layout

```
src/
  shell.html   page markup (CSS and JS are inlined by the build)
  style.css    styles and themes (light and dark)
  core.js      stitch engine: satin, fill, columns, borders, assembly
  formats.js   machine file writers and a minimal ZIP writer
  import.js    SVG import and text tracing
  app.js       user interface
build.py       bundles src/ into index.html and dist/index.html
index.html     the built app, served by GitHub Pages
dist/index.html  the same built app
tests/         development checks (Playwright and Node scripts)
```

## Building

```
python3 build.py
```

This writes `index.html` (served by GitHub Pages) and `dist/index.html`. No dependencies are needed for the build.

## Tests

The scripts in `tests/` are the development checks used while building the app. Run them from the repository root after building:

```
pip install playwright && playwright install chromium
python3 tests/pw25.py      # per-letter text selection, Automatic/Manual
python3 tests/pw24.py      # deleting rail dots
node tests/t7.js           # stitch engine check on the sample design
```

Screenshots and outputs go to `tests/out/`. Some older scripts check earlier behaviour and may no longer match the current app.

## Credits

The machine file layouts (PES/PEC, DST, JEF, EXP, VP3) follow the formats documented by [pyembroidery](https://github.com/EmbroidePy/pyembroidery).
