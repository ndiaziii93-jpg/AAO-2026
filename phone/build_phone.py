"""Build the phone edition of the field brief from the laptop app.

The laptop app keeps everything in that browser's storage. On an iPhone a
downloaded HTML file cannot run as an app, so the phone edition is published
as a private claude.ai page instead, and its storage is mirrored to the
page's private database: the phone keeps a local copy so it reads with no
signal, every change is pushed to the database when there is one, and the
database is what Claude reads back to hand the laptop a backup.

usage: python3 -I build_phone.py <laptop app.html> <out.html>
Carries no meeting data: the database is seeded separately.
"""
import sys

src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf-8").read()

def rep(old, new):
    global s
    if s.count(old) != 1:
        sys.exit("build_phone: expected one match for %r, found %d" % (old[:60], s.count(old)))
    s = s.replace(old, new)

# 1. storage: local copy as before, plus a mirror in the page's database
rep("""  function readAll(){
    let raw = null;""", """  /* ---- phone edition: mirror every collection to the page's database ----
     One document per collection under fb/, so no document nears the 256 KiB
     cap. The database wins on open (it is what the laptop's backup is cut
     from); the local copy is what keeps the app readable with no signal. */
  const CLOUD = {db: null, pushed: {}, timer: null, pending: false, ready: false};
  async function cloudOpen(){
    try{ CLOUD.db = (window.claude && window.claude.use) ? await window.claude.use("db") : null; }
    catch(e){ CLOUD.db = null; }
    if(!CLOUD.db){ setSync("local"); return; }
    try{
      const names = ["meetings","briefs","targets","outcomes","debriefs","proposed","pis","log","meta","sf"];
      const got = {};
      await Promise.all(names.map(async function(n){
        const snap = await CLOUD.db.doc("fb/" + n).get();
        if(snap.exists){ const v = snap.data(); if(v && v.items && typeof v.items === "object") got[n] = v.items; }
      }));
      if(Object.keys(got).length){
        Object.keys(cache).forEach(function(k){ delete cache[k]; });
        Object.keys(got).forEach(function(n){ cache[n] = got[n]; CLOUD.pushed[n] = JSON.stringify(got[n]); });
        try{ localStorage.setItem(STORE_KEY, JSON.stringify(cache)); }catch(e){}
        emitAll();
      }
      CLOUD.ready = true;
      cloudPush();                       /* anything typed offline before this goes up now */
      setSync("ok");
    }catch(e){
      CLOUD.pending = true;              /* no signal: keep working from the local copy */
      setSync("local");
    }
  }
  function cloudPush(){
    if(!CLOUD.db || !CLOUD.ready) { CLOUD.pending = true; return; }
    clearTimeout(CLOUD.timer);
    CLOUD.timer = setTimeout(async function(){
      const todo = Object.keys(cache).filter(function(n){ return JSON.stringify(cache[n]) !== CLOUD.pushed[n]; });
      try{
        for(const n of todo){
          const body = JSON.stringify(cache[n]);
          await CLOUD.db.doc("fb/" + n).set({items: cache[n]});
          CLOUD.pushed[n] = body;
        }
        CLOUD.pending = false;
        setSync("ok");
      }catch(e){
        CLOUD.pending = true;
        setSync("local");
      }
    }, 1200);
  }
  window.addEventListener("online", function(){ if(CLOUD.db && !CLOUD.ready) cloudOpen(); else if(CLOUD.pending) cloudPush(); });

  function readAll(){
    let raw = null;""")
rep("""    DIRTY = true;
    setSync("ok");
  }""", """    DIRTY = true;
    setSync("ok");
    cloudPush();
  }""")
rep("""    start: async function(){ readAll(); setSync("ok"); },""",
    """    start: async function(){ readAll(); setSync("ok"); cloudOpen(); },""")

# 2. downloads: the page frame blocks plain links, so go through the viewer
rep("""const BROWSER_DL = {
  save: async function(o){""", """const BROWSER_DL = {
  save: async function(o){
    /* phone edition: a page on claude.ai may only hand over a file through the
       viewer, which asks before saving */
    try{
      const dl = (window.claude && window.claude.use) ? await window.claude.use("downloads") : null;
      if(dl){ await dl.save({filename: o.filename, data: o.data}); return; }
    }catch(e){ if(e && e.code === "declined") return; }""")

# 3a. the status line speaks for the phone: synced, or waiting for signal.
#     No "Export the pack": the page frame cannot open a print dialog, and a
#     control that does nothing reads as broken.
rep("""               ' &middot; <button class="linkbtn" data-pack="1">Export the pack</button>';""", """               '';""")
rep("""  else if(DIRTY)
    el.innerHTML = '<span class="dot local"></span> Saved on this laptop · ' +""",
"""  else if(mode === "local")
    el.innerHTML = '<span class="dot local"></span> Saved on this phone · <b>will sync when you have signal</b>' + save;
  else if(mode === "ok" || mode === "live")
    el.innerHTML = '<span class="dot live"></span> Saved and synced to your private copy' + save;
  else if(DIRTY)
    el.innerHTML = '<span class="dot local"></span> Saved on this laptop · ' +""")

# 3. tell the phone edition apart at a glance
rep('const BUILD = "08 Oct 2026";', 'const BUILD = "08 Oct 2026 \\u00b7 phone";')

# 4. the vendored spreadsheet reader's codepage tables hold U+FFFD on purpose
#    (it tests charCodeAt === 65533). They all sit inside JS string literals,
#    where the escape is the same character, and the publisher refuses the raw
#    one as a likely corruption.
s = s.replace("\ufffd", "\\ufffd")

open(out, "w", encoding="utf-8").write(s)
print("phone edition written:", out, len(s))
