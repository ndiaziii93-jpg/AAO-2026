# The exported pack — the formatting contract

The PDF is regenerated from live data every time, so there is no master file to
protect. **What has to survive is this spec.** It all lives inside
`AAO 2026 - Field Brief.html`; nothing here depends on an outside file.

Folder `3 - sample export/what correct looks like/` holds rendered pages. If a
change makes the pack stop matching those, the change is wrong.

## Where it lives in the HTML

Search the file for these, do not trust line numbers:

- **`the pack, as printed`** — the print stylesheet. Everything visual: page
  size, type scale, the card system, the timeline rail, colours. Roughly 60
  rules, all inside `@media print`.
- **`function packHTML(`** — the generator. What goes on which page and in what
  order: cover, exec page, contents, a page per day, briefs, opportunities,
  floor. Helpers around it: `packMeeting`, `packProgramme`, `packSession`,
  `packOpps`, `packDivider`, `packTimeline`, `tierOf`, `exportPack`.

Both carry comments saying *why*. Read them before changing anything.

## The rules that are not up for negotiation

### 1. The page is 120 x 200mm. Never A4.

```css
@page{size:120mm 200mm; margin:0}
```

A phone fits a PDF to the width of the screen, so what a reader sees is
`point size / page width x screen width`. On A4 the body text came out at
**6 pixels** and the small grey labels at 4 — not small, invisible. You cannot
fix that with a larger font, because the page width is the divisor. The page
itself had to come in.

At 120mm, 10.5pt body text is ~12px on an iPhone, ~14px on a laptop at 100%,
and the line length drops from 110 characters to 55. The cost is ~39 pages
instead of 22. That is the trade and it was made deliberately.

`.pk-page`, `.pk-cover` and `.pk-div` also set `width:120mm; margin:0 auto` so
that a browser ignoring `@page size` centres the content instead of jamming it
into a corner. Keep that.

### 2. Export from Chrome or Edge, margins on Default.

Those honour `@page size`. Safari may not.

### 3. The Ora gradient is brand furniture, never a data encoding.

`#E21E28 → #932951 → #273C8A → #337F9C → #3DB9AB`. It appears as the bar across
divider pages and the spine on a brief card. It must never encode a value.
Bars in the "meetings per day" chart are **one hue stepped light to dark by
magnitude**, direct-labelled. Colouring a bar by its rank is how a chart starts
lying.

### 4. Type scale, sized for the 100mm text column

| Role | Size |
|---|---|
| body, objective, brief paragraphs | 10.2–10.5pt |
| company name on a card | 12pt |
| page heading | 17pt |
| cover title | 27pt |
| divider number | 56pt |
| gutter times, chips, micro labels | 7–8.5pt |

Nothing meant to be read drops below 8.5pt. The all-caps micro-labels sit at
7pt because they are orientation, not reading.

### 5. Blocks are single-column

The flags, the floor list and the Ora/Them block were two columns at 180mm.
Half of 100mm is 27 characters, which is where words start breaking mid-syllable
— "double-booked" was already doing it. They are stacked now. Do not put them
back side by side.

The cover's four stat tiles are a 2x2 grid for the same reason.

### 6. A brief card must be able to break across pages

Most briefs are taller than a 200mm page. Two things silently stopped them
breaking and both are fixed:

- `overflow:hidden` makes a box **monolithic** to the fragmenter. Removed.
- An absolutely-positioned spine only ever paints on the first fragment. The
  gradient spine is now a **background layer** with
  `-webkit-box-decoration-break:clone`, so every fragment gets its own border,
  radius and full-height gradient.

`.pk-start` (the "Where to start" box) keeps `break-inside:avoid` — that is the
line read walking into the room and it must never split.

### 7. Tiers are derived, never a new field

- **Tier 1** — formal, with someone from Ora assigned
- **Tier 2** — informal or a meal, with someone assigned
- **Tier 3** — nobody assigned yet. **This wins outright whatever the format
  says**, because a meeting no one is covering is not covered.

The exec page prints the count and the plain-English rule for each, because a
chip nobody can decode is worse than no chip.

### 8. It has to navigate

~32 real internal PDF links. The contents page lists every day, the briefs,
what is live and the floor. Inside a day, a company name jumps to its brief;
every section has a Contents link back. Readers tap; they do not scroll 39
pages. If a section is added, it goes in the contents too.

### 9. Five embedded typefaces, no system fallback

Archivo (600/700), Public Sans (400/600), IBM Plex Mono. All embedded in the
file. Two glyphs are **absent** from the Public Sans subset and will silently
drag in a system font if used: `→` (U+2192) and `↑` (U+2191). Use `›` instead.

## How to prove it is still right

```
NODE_PATH=/opt/node22/lib/node_modules node "4 - test harnesses/packcheck.js"
```

It renders the pack and asserts every measurable invariant: page geometry, no
horizontal overflow, no font fallback, links intact, nothing unbreakable taller
than a page. Run it after any change to the stylesheet or the generator.

Then look at the rendered pages against
`3 - sample export/what correct looks like/`. The harness catches what is
measurable; your eye catches the rest.
