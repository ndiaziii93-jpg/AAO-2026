const fs=require('fs'); const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:390,height:844}});
  await pg.route('**', r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  await pg.goto('file://'+__dirname+'/AAO 2026 - Field Brief.html',{waitUntil:'load'});
  await pg.waitForTimeout(2300);
  const p=JSON.parse(fs.readFileSync(__dirname+'/AAO-2026-meetings-and-briefs.json','utf8'));
  await pg.evaluate(async d=>{ db.importAll(d.data); },p);
  await pg.waitForTimeout(900);
  console.log(await pg.evaluate(()=>{
    const known={};
    Object.values(state.meetings).forEach(m=>{ if(m&&m.company) known[slug(m.company)]='meeting: '+m.company; });
    Object.keys(BRIEFS||{}).forEach(n=>{ known[slug(n)]=known[slug(n)]||('brief: '+n); });
    (typeof EXHIBITORS!=='undefined'?EXHIBITORS:[]).forEach(e=>{ known[slug(e.n)]=known[slug(e.n)]||('floor: '+e.n); });
    const out=[];
    COMPANIES.forEach(c=>{
      if(known[c.id]) return;                       // already matches
      Object.keys(known).forEach(k=>{
        if(k===c.id) return;
        if(k.startsWith(c.id+'-')||c.id.startsWith(k+'-')||
           k.replace(/-/g,'')===c.id.replace(/-/g,''))
          out.push('  on stage "'+c.name+'"  ('+c.id+')\n      vs  '+known[k]+'  ('+k+')');
      });
    });
    return out.length? 'NEAR MISSES — same company, different slug, card will NOT unify:\n'+out.join('\n')
                     : 'no near misses';
  }));
  await b.close();
})();
