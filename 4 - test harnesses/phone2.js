const fs=require('fs'); const {chromium}=require('playwright');
const MM=96/25.4, PW=120, PH=200;
(async()=>{
  const b=await chromium.launch();
  const pg=await b.newPage({viewport:{width:Math.round(PW*MM),height:Math.round(PH*MM)},
                            deviceScaleFactor:3});
  await pg.route('**', r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  await pg.goto('file://'+__dirname+'/AAO 2026 - Field Brief.html',{waitUntil:'load'});
  await pg.waitForTimeout(2400);
  const p=JSON.parse(fs.readFileSync(__dirname+'/AAO-2026-meetings-and-briefs.json','utf8'));
  const poly=fs.readFileSync(__dirname+'/polyactiva.txt','utf8');
  await pg.evaluate(async d=>{
    db.importAll(d.p.data);
    const ids=Object.keys(state.meetings);
    for(let i=0;i<ids.length;i++){ const m=state.meetings[ids[i]];
      if(i%3===0){ m.format='formal'; m.ours='Berto Diaz, Millie Chen'; }
      else if(i%3===1){ m.format='informal'; m.ours='Trevor Shaw'; }
      else { m.format='formal'; m.ours=''; }
      await db.doc('meetings/'+m.id).set(m); }
    await db.doc('outcomes/'+ids[0]).set({oppOn:true,oppKind:'existing',
      oppStudy:'Phase 2 reading centre',oppPhase:'Phase 2',oppSize:'$1.4m'});
    await db.doc('meetings/poly1').set({id:'poly1',day:'eyec',company:'PolyActiva',time:'16:00',
      duration:'30 min',format:'informal',origin:'hunt',ours:'Berto Diaz',
      theirs:'TBC — ask for the CMO',
      objective:'Settle what Phase 2b has to show before Phase 3 can be designed.'});
    const r=parseBriefBlock(d.poly); r.name='PolyActiva'; await saveBrief(r);
    document.getElementById('packout').innerHTML=packHTML();
    document.body.classList.add('packing');
  },{p,poly});
  await pg.emulateMedia({media:'print'});
  await pg.evaluate(()=>document.fonts.ready);
  await pg.waitForTimeout(800);

  // ---- anything unbreakable that is taller than the printable column forces
  //      a page break it cannot satisfy, and leaves a white gap ----
  const tall=await pg.evaluate(()=>{
    const printable=(200-21)*(96/25.4);            // page less top+bottom padding
    const out=[];
    document.querySelectorAll('#packout .pk-row,#packout .pk-sess,#packout .pk-b,'+
                              '#packout .pk-opp,#packout .pk-flag,#packout .pk-start')
      .forEach(el=>{ const h=el.getBoundingClientRect().height;
        if(h>printable) out.push({c:el.className.toString().slice(0,24),
                                  h:Math.round(h),max:Math.round(printable)}); });
    return {printablePx:Math.round(printable), tallest:out};
  });
  console.log('unbreakable blocks taller than a page:', JSON.stringify(tall));

  // ---- smallest rendered text anywhere, and what that is on a phone ----
  const small=await pg.evaluate(()=>{
    const seen={};
    document.querySelectorAll('#packout *').forEach(el=>{
      if(!el.textContent.trim()) return;
      const cs=getComputedStyle(el), px=parseFloat(cs.fontSize);
      const k=px.toFixed(2);
      if(!seen[k]) seen[k]={px, eg:(el.className||el.tagName).toString().slice(0,22)};
    });
    return Object.values(seen).sort((a,b)=>a.px-b.px).slice(0,4);
  });
  const PT = Math.round(PW*MM);     // one page wide, in CSS px, at 1:1
  console.log('smallest text (page is '+PT+'px wide at 1:1):');
  small.forEach(s=>console.log('   %s  %spx on page -> %spx on a 393px phone',
    s.eg.padEnd(22), s.px.toFixed(1), (s.px*393/PT).toFixed(1)));

  for(const [sel,n] of [['#pk-exec','p-exec'],['#d-eyec','p-eyec'],
                        ['#sec-briefs','p-briefs'],['#sec-opps','p-opps'],
                        ['#d-floor','p-floor'],['#pk-top','p-cover']]){
    const el=await pg.$('#packout '+sel);
    if(el) await el.screenshot({path:n+'.png'});
  }
  await b.close();
})();
