const fs=require('fs'); const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:390,height:844}});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**', r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  await pg.goto('file://'+__dirname+'/AAO 2026 - Field Brief.html',{waitUntil:'load'});
  await pg.waitForTimeout(2300);
  const p=JSON.parse(fs.readFileSync(__dirname+'/AAO-2026-meetings-and-briefs.json','utf8'));
  const csv=fs.readFileSync(__dirname+'/AAO invites - New Orleans time.csv','utf8');
  // seed the snapshot, then type something into a card the import will touch
  await pg.evaluate(async d=>{
    db.importAll(d.p.data);
    const az=Object.values(state.meetings).find(m=>/Azura/.test(m.company||''));
    az.objective='PROTECT ME — typed by hand';
    az.ours='Berto Diaz';
    await db.doc('meetings/'+az.id).set(az);
  },{p});
  await pg.waitForTimeout(600);
  const before=await pg.evaluate(()=>Object.keys(state.meetings).length);

  const parsed=await pg.evaluate(t=>{
    const rows=sfParse(t);
    return {n:rows.length,
            withDay:rows.filter(r=>r.day).length,
            noDay:rows.filter(r=>!r.day).map(r=>r.company),
            updates:rows.filter(r=>r.dup).length,
            moved:rows.filter(r=>r.moved).length,
            creates:rows.filter(r=>!r.dup).map(r=>r.company),
            ticked:rows.filter(r=>r.take).length};
  },csv);
  console.log('parsed      :', JSON.stringify(parsed));

  // run the real import
  await pg.evaluate(async t=>{
    state.imp={text:'',rows:sfParse(t),done:0};
    await runImport();
  },csv);
  await pg.waitForTimeout(900);

  const after=await pg.evaluate(()=>{
    const ms=Object.values(state.meetings);
    const bySlug={}; ms.forEach(m=>{ const k=slug(m.company||''); (bySlug[k]=bySlug[k]||[]).push(m); });
    const az=ms.find(m=>/Azura/.test(m.company||''));
    return {total:ms.length,
            duplicatedCompanies:Object.entries(bySlug).filter(([k,v])=>v.length>1).map(([k,v])=>k+' x'+v.length),
            azura:{day:az.day,time:az.time,objective:az.objective,ours:az.ours,theirs:(az.theirs||'').slice(0,30)},
            schedule:ms.filter(m=>m.day).sort((a,b)=>(a.day+a.time).localeCompare(b.day+b.time))
                       .map(m=>m.day+' '+m.time+'  '+m.company)};
  });
  console.log('meetings before/after:', before, '->', after.total, '(expected', before+3, ')');
  console.log('duplicated companies :', after.duplicatedCompanies.length?after.duplicatedCompanies:'NONE');
  console.log('Azura after update   :', JSON.stringify(after.azura));
  console.log('errors:',errs.length?errs:'none');
  console.log('\nSCHEDULE:'); after.schedule.forEach(r=>console.log('  '+r));
  await b.close();
})();
