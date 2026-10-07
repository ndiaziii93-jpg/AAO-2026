const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch(); const pg=await b.newPage();
  await pg.route('**', r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  await pg.goto('file://'+__dirname+'/AAO 2026 - Field Brief.html',{waitUntil:'load'});
  await pg.waitForTimeout(2300);
  console.log(await pg.evaluate(()=>{
    const L=[];
    PROGRAMMES.eyec.sessions.forEach(s=>{
      L.push('| '+(s.t||'')+'–'+(s.e||'')+' | '+(s.title||'')+' | '+
        ((s.chairs||[]).join(' · ')||'—')+' |');
      (s.companies||[]).forEach(c=>L.push('|   '+(c.talk||'')+' | '+c.c+' | '+(c.p||'')+' |'));
    });
    return L.join('\n');
  }));
  await b.close();
})();
