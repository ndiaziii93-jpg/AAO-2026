const fs=require('fs'); const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:390,height:844}});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**', r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  await pg.goto('file://'+__dirname+'/AAO 2026 - Field Brief.html',{waitUntil:'load'});
  await pg.waitForTimeout(2300);
  const p=JSON.parse(fs.readFileSync(__dirname+'/AAO-2026-meetings-and-briefs.json','utf8'));
  await pg.evaluate(async d=>{ db.importAll(d.data); },p);
  await pg.waitForTimeout(900);
  console.log(await pg.evaluate(()=>{
    const rooms={};
    PROGRAMMES.eyec.sessions.filter(s=>s.kind==='showcase').forEach(s=>{
      rooms[s.title.replace(/^Showcase . /,'')]=(s.companies||[]).length; });
    const metSlugs={};
    Object.values(state.meetings).forEach(m=>{ if(m&&m.company) metSlugs[slug(m.company)]=m; });
    const hits=COMPANIES.filter(c=>metSlugs[c.id]).map(c=>
      c.name+'  — on stage '+(c.talk||c.from)+', meeting '+
      (metSlugs[c.id].day||'?')+' '+(metSlugs[c.id].time||''));
    const briefed=COMPANIES.filter(c=>BRIEF_BY_ID&&BRIEF_BY_ID[c.id]).map(c=>c.name);
    return 'companies per room: '+JSON.stringify(rooms,null,1)+
      '\ntotal indexed: '+COMPANIES.length+
      '\n\nON STAGE *AND* ALREADY ON OUR SCHEDULE:\n  '+(hits.join('\n  ')||'(none)')+
      '\n\nON STAGE AND ALREADY CARRY A BRIEF:\n  '+(briefed.join('\n  ')||'(none)');
  }));
  console.log('\nerrors:',errs.length?errs:'none');
  await b.close();
})();
