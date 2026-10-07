# AAO 2026 Field Brief — offline edition

Two files, one job each.

**`AAO 2026 - Field Brief.html`** is the tool. It lives on your laptop. Nobody
else gets a copy.

**The PDF it exports** is what you email. That is the only thing that leaves.

---

## Start

Double-click the HTML file. It opens in your browser and it is ready — no
sign-in, no setup, no connection. It works on a plane.

Everything you type is saved on this laptop, in this browser, immediately.

---

## The one rule

**Save a backup at the end of every day.**

The link is in the status line at the top. It writes a dated `.json` file —
keep it in OneDrive with everything else.

Browser storage is real storage, but it is cleared by a cache wipe, a browser
deciding it needs the room, or a new laptop — and none of those announce
themselves first. The status line tells you when you have changed something
since your last backup. **Open a backup** puts it all back, on this machine or
any other.

---

## Sending the pack

**Export the pack** → your browser's print dialog → **Save as PDF**.
Use **Chrome or Edge**, and leave Margins on Default.

You get a designed document: a cover with the week's numbers, a **contents page
that is tappable**, a page per day with its programme and every meeting, the
company briefs, what is live commercially, and the floor list. It is marked Ora
internal and confidential on the cover.

### It is built for a phone, and that is why the page is small

The page is **120 × 200mm, not A4**, and that is deliberate.

A phone fits a PDF to the width of the screen. On A4 that put the body text at
**6 pixels** and the small grey labels at 4 — not small, invisible. You cannot
fix that with a bigger font, because what a phone shows you is the point size
divided by the page width. The page itself had to come in.

At 120mm the same text lands at **12 pixels on an iPhone and 14 on a laptop**,
and the lines drop from a punishing 110 characters to 55, which is where
reading actually gets easier. It costs pages — about 39 instead of 22 — and
they are smaller pages carrying the same words.

On a laptop it opens as a narrow document. If it looks too big or too small,
that is the viewer's zoom, not the file: set it to fit the page.

**It navigates.** The contents page lists every day, the briefs, what is live
and the floor, and all of it is a real link. Inside a day, tapping a company
name jumps to its brief. Each section has a "Contents" link back. That survives
into the PDF — your reader is tapping real links, not scrolling thirty-nine
pages.

Email that. It opens on any phone, needs nothing enabled, and cannot be edited
into a second version of the truth.

Send a fresh one when it is worth sending. People are reading a snapshot, not a
live view — with one author that was always going to be true.

---

## What is already set

- **Days:** Eyecelerator, then Friday 9 to Monday 12 October 2026
- **Venue:** Ernest N. Morial Convention Center, New Orleans
- **Clock:** US Central, so the red "you are here" line on each day is right

**Two things to confirm.** The Eyecelerator date is set to Thursday 8 October,
which is an inference — eyecelerator.com could not be reached from the machine
this was built on, so its programme was never read. And AAO's own dates come
from press listings, not the Academy's programme.

Both live in the `DAYS` list near the top of the file: five short blocks, one
per tab. Change a date there and the tab, the day page and the now-line all
follow. Or send me the right ones and I will.

Eyecelerator has no venue set, so its venue row simply does not draw. There is
a commented-out slot for it in `PLACES`, just below `DAYS`, with a note on how
to switch it on. Better absent than wrong.

**The floor is loaded** — 38 AAO exhibitors with their booth numbers, thirteen
of them holding more than one stand.

**The Eyecelerator agenda is in** — eleven sessions, 10:00 to 17:30, with the
panels, moderators and the company each panellist comes from. The three Winning
Pitch finalists are company cards in their own right, so they can carry a brief
like any other target.

**Both gaps are now closed.** The morning is in — registration, the welcome,
S1 and S2 — so the day starts at 7:00 where it actually starts. And the
Presenting Company Showcases are in as **four rooms rather than one row**,
because four run at the same time and you can only be in one. Forty-five
companies, each with its presenter and its own slot time, so a name you care
about is something you can walk to rather than wait for. Tap a room to open
it; tap a company for its card.

The organiser says forty-six and the room pages list forty-five, so one is
either unlisted or a late addition — worth a glance on the day.

**Ora moderates one of the four rooms.** John Trein has the Retina Drug
Delivery & New Targets room, which is marked on the day page.

Everything else is empty: no meetings, no briefs. Nothing from Vienna came
along.

---

## Filling it

Same as before. Import the Outlook invites, paste a brief in whole, log a
debrief from the card. The timeline, the search, the now-line and the overview
tiles all work the way they did.

What is gone: the sign-in, the other editors, and the live sync — because there
is one of you now, and no server.

---

## Getting a newer version of the app

When a newer `AAO 2026 - Field Brief.html` arrives, **replace the old one and
carry on. Everything you have typed stays.**

**Which one is newer?** The status line at the top ends with `App build` and a
date. Compare that against the one you are running — no need to open both.

Your meetings, briefs and debriefs are not in the HTML file. They are held by
the browser on this laptop, under a key the app owns, and swapping the file
underneath them does not touch them. Checked both ways: same folder and a
different folder, the data was still there.

Still take a backup first. It costs five seconds and it is the only move that
cannot go wrong.

1. **Save a backup** — you get a dated `.json`
2. Replace the HTML file
3. Open it and check your meetings are there
4. If anything looks wrong, **Open a backup**

**The one thing a new file does overwrite is hand-edits to the file itself.**
If you have gone into the source and changed the `DAYS` dates, the venue, the
exhibitor list or anything else in there, a newer build arrives without those
changes, because it was built before you made them. So:

- **Typing into the app** — meetings, briefs, debriefs, companies — is safe,
  always. Do as much as you like.
- **Editing the source** — tell me instead, and I will build it in. Then your
  copy and mine stay the same file and there is nothing to reconcile.

---

## Confidentiality

Nothing in this file talks to anything. No database, no website, no fonts
fetched at load, no analytics. The typefaces and the spreadsheet reader are
built in, which is why it is a large file and why it works offline.

**The HTML file holds no data.** Opened on someone else's machine it is an
empty app — verified, not assumed. So the file is not the leak risk; the
laptop is, and so is the backup.

**The backup `.json` is the sensitive one.** That file genuinely does contain
every meeting, every brief and every debrief, in plain text. Treat it exactly
the way you would treat the briefs themselves: keep it in Ora's OneDrive, not
on a desktop, not in a personal drive, and never attach it to an email.

The PDF is what travels. It is the only thing meant to leave.
