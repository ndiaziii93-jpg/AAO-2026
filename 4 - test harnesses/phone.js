const fs=require('fs'); const {chromium}=require('playwright');
const MM=96/25.4, PW=120, PH=200, PAD=10;            // page geometry, in mm
(async()=>{
  const b=await chromium.launch();
  // viewport exactly one page wide so layout measurements are the printed ones
  const pg=await b.newPage({viewport:{width:Math.round(PW*MM),height:Math.round(PH*MM)},
                            deviceScaleFactor:3});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**', r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  await pg.goto('file://'+__dirname+'/AAO 2026 - Field Brief.html',{waitUntil:'load'});
  await pg.waitForTimeout(2400);
  const p=JSON.parse(fs.readFileSync(__dirname+'/AAO-2026-meetings-and-briefs.json','utf8'));
  const poly=fs.readFileSync(__dirname+'/polyactiva.txt','utf8');
  await pg.evaluate(async d=>{
    db.importAll(d.p.data);
    const ids=Object.keys(state.meetings);
    for(let i=0;i<ids.length;i++){
      const m=state.meetings[ids[i]];
      if(i%3===0){ m.format='formal'; m.ours='Berto Diaz, Millie Chen'; }
      else if(i%3===1){ m.format='informal'; m.ours='Trevor Shaw'; }
      else { m.format='formal'; m.ours=''; }
      await db.doc('meetings/'+m.id).set(m);
    }
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

  console.log('page errors :', errs.length?errs:'none');

  // ---- horizontal overflow: nothing may exceed the printable column ----
  const over=await pg.evaluate(pad=>{
    const lim=document.querySelector('#packout .pk-page').getBoundingClientRect().width;
    const inner=lim-2*pad*(96/25.4);
    const bad=[];
    document.querySelectorAll('#packout .pk-page *').forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.width>inner+1.5) bad.push({c:el.className&&el.className.toString().slice(0,34),
                                      w:Math.round(r.width),max:Math.round(inner)});
      if(el.scrollWidth>el.clientWidth+1 && getComputedStyle(el).overflow!=='hidden')
        bad.push({c:'SCROLL '+(el.className||'').toString().slice(0,28),
                  w:el.scrollWidth,max:el.clientWidth});
    });
    return bad.slice(0,12);
  },PAD);
  console.log('overflowing  :', over.length?over:'none');

  // ---- structure survived the rewrite ----
  console.log('structure    :', await pg.evaluate(()=>JSON.stringify({
    sessions:document.querySelectorAll('#packout .pk-sess').length,
    tiers:document.querySelectorAll('#packout .pk-tier').length,
    opps:document.querySelectorAll('#packout .pk-opp').length,
    sides:document.querySelectorAll('#packout .pk-sides').length,
    sideVals:document.querySelectorAll('#packout .pk-sideval').length,
    floor:document.querySelectorAll('#packout .pk-fl').length,
    briefs:document.querySelectorAll('#packout .pk-b').length,
    links:document.querySelectorAll('#packout a[href^="#"]').length,
    broken:[...document.querySelectorAll('#packout a[href^="#"]')]
      .filter(a=>!document.getElementById(a.getAttribute('href').slice(1)))
      .map(a=>a.getAttribute('href'))
  })));

  // ---- the stacked sides really are two rows, label beside value ----
  console.log('sides layout :', await pg.evaluate(()=>{
    const s=document.querySelector('#packout .pk-sides');
    const k=[...s.querySelectorAll('.pk-sidelab')].map(e=>Math.round(e.getBoundingClientRect().top));
    const v=[...s.querySelectorAll('.pk-sideval')].map(e=>Math.round(e.getBoundingClientRect().left));
    return JSON.stringify({labelRows:k, valueLefts:v, sameLeft:v[0]===v[1]});
  }));

  // ---- real typefaces, no system fallback ----
  const cdp=await pg.context().newCDPSession(pg); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const {root}=await cdp.send('DOM.getDocument',{depth:-1,pierce:false});
  const picks=['.pk-cover h1','.pk-sub','.pk-obj','.pk-sidelab','.pk-sideval','.pk-gut',
               '.pk-booth','.pk-b p','.pk-start','.pk-chip','.pk-flagw','.pk-tocmain'];
  const fonts=new Set();
  for(const sel of picks){
    const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#packout '+sel});
    if(!nodeId) { console.log('  (no node for '+sel+')'); continue; }
    const {fonts:f}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
    f.forEach(x=>fonts.add(sel+' -> '+x.familyName));
  }
  console.log('typefaces    :'); [...fonts].sort().forEach(x=>console.log('   ',x));

  await pg.pdf({path:'pack-phone.pdf',printBackground:true,preferCSSPageSize:true});
  await b.close();
})();
