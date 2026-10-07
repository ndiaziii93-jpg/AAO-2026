# AAO 2026 Field Brief — complete archive

Everything that existed only in a chat window is now a file in here. Keep this
folder in OneDrive. Nothing below depends on a Claude session staying alive.

## What is at risk and what is not

**The exported PDF pack cannot be lost.** It is not a stored file — the app
generates it from your data every time you choose "Export the pack". As long as
you have folder 1 and your data, the pack regenerates forever, always current.
Folder 3 holds one built from sample data so you can see the shape of it.

**Your data is the one thing only you can protect.** Meetings, briefs and
debriefs live in your browser on your laptop, not in the HTML file and not in
this archive. Save a backup `.json` from the app's status line and keep it
beside this folder. That file contains every brief in plain text — treat it the
way you would treat the briefs themselves.

## The folders

**1 - the app** — the tool. `AAO 2026 - Field Brief.html` is the whole thing:
no server, no network, no install. The Eyecelerator agenda, all 45 showcase
companies, the 38 exhibitors and the day tabs are inside this file as code, so
they travel with it. `READ ME FIRST` explains day-to-day use. The CSV is the
corrected meeting import.

**2 - briefs to paste in** — written but not yet in the app. Open the company
card, paste the whole block into the brief box. The headings split themselves.

**3 - sample export** — what the team receives. Built on sample data, not real
meetings. 120 x 200mm on purpose: a phone fits a PDF to screen width, so on A4
the body text came out at 6 pixels. At this size it is about 12px on a phone and
14px on a laptop. Do not "fix" it back to A4.

Inside it, `what correct looks like/` holds nine rendered pages. That is the
visual baseline — if a change stops the pack matching those, the change is
wrong.

**PACK DESIGN SPEC.md** — the formatting contract for the PDF. The pack is
regenerated from live data every time, so there is no master file to protect;
what has to survive is this spec. It says where every rule lives inside the
HTML and why it is the way it is. Read it before changing anything about how
the export looks.

**4 - test harnesses** — Playwright scripts that drive the real page. Point them
at the HTML and they check what actually renders, which is the only kind of
verification that has caught anything here.

**`packcheck.js` is the important one.** It proves the PDF still matches the
design spec — page geometry, no overflow, no font fallback, links intact, brief
cards still able to break across pages, body text still readable on a phone.
Run it after any change to the export:

```
NODE_PATH=/opt/node22/lib/node_modules node "4 - test harnesses/packcheck.js"
```

Thirteen checks, all passing as shipped. `showtest.js` is the quick health check
for the app itself.

**5 - how it was built (reference)** — the staged transformation that produced
the app, kept for its comments: each stage says what it changed and why. It is
NOT runnable on its own; it needed a source file that is not part of this
archive. The HTML in folder 1 is the source of truth now. Edit it directly.

## If you open a new Claude window

Upload, in this order: the HTML from folder 1, the CSV, a fresh backup `.json`,
and `HANDOFF.md`. That is everything needed to carry on.
