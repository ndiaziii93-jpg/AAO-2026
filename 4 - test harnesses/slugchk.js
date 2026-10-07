const fs=require('fs'); const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:390,height:844}});
  await pg.route('**', r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  await pg.goto('file://'+__dirname+'/AAO 2026 - Field Brief.html',{waitUntil:'load'});
  await pg.waitForTimeout(2300);
  const p=JSON.parse(fs.readFileSync(__dirname+'/AAO-2026-meetings-and-briefs.json','utf8'));
  const csv=fs.readFileSync(__dirname+'/AAO invites - New Orleans time.csv','utf8');
  const fov=fs.readFileSync(__dirname+'/new/foventa.txt','utf8');
  await pg.evaluate(async d=>{ db.importAll(d.p.data); },{p});
  await pg.waitForTimeout(400);
  await pg.evaluate(async t=>{ state.imp={text:'',rows:sfParse(t),done:0}; await runImport(); },csv);
  await pg.waitForTimeout(700);
  // paste the briefs exactly as Berto would, onto the cards the import made
  await pg.evaluate(async d=>{
    for(const [name,block] of [['Foventa Therapeutics Limited',d.fov],['PolyActiva','']]){
      if(!block) continue;
      const r=parseBriefBlock(block); r.name=name; await saveBrief(r);
    }
  },{fov});
  await pg.waitForTimeout(600);
  console.log(await pg.evaluate(()=>{
    const ms=Object.values(state.meetings);
    const fo=ms.find(m=>/Foventa/.test(m.company||''));
    return 'Foventa card name : '+fo.company+
      '\n  card slug       : '+slug(fo.company)+
      '\n  brief attached  : '+!!BRIEF_BY_ID[slug(fo.company)]+
      '\n  brief sections  : '+(BRIEF_BY_ID[slug(fo.company)]
            ? ['what','stage','ora','start'].filter(k=>BRIEF_BY_ID[slug(fo.company)][k]).join(', ') : '-');
  }));
  await b.close();
})();
