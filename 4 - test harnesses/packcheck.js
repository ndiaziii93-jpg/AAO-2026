/* Proves the exported pack still matches its design contract.
   Run from the archive root:
     NODE_PATH=/opt/node22/lib/node_modules node "4 - test harnesses/packcheck.js"
   Pass a path to the HTML as argv[2] if it is not in "1 - the app". */
const fs=require('fs'), path=require('path');
const {chromium}=require('playwright');
const APP = process.argv[2] ||
  path.join(__dirname, '..', '1 - the app', 'AAO 2026 - Field Brief.html');
const MM=96/25.4, PW=120, PH=200, PAD=10;
let fails=0;
const check=(name,ok,detail)=>{ if(!ok) fails++;
  console.log((ok?'  PASS  ':'  FAIL  ')+name+(detail!==undefined?'   '+detail:'')); };

(async()=>{
  if(!fs.existsSync(APP)){ console.error('cannot find the app at:\n  '+APP); process.exit(2); }
  const b=await chromium.launch();
  const pg=await b.newPage({viewport:{width:Math.round(PW*MM),height:Math.round(PH*MM)},
                            deviceScaleFactor:2});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**', r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  await pg.goto('file://'+APP,{waitUntil:'load'});
  await pg.waitForTimeout(2400);

  // seed enough data that every section of the pack renders
  await pg.evaluate(async ()=>{
    const d=['fri9','sat10','sun11'];
    for(let i=0;i<6;i++){
      await db.doc('meetings/chk'+i).set({id:'chk'+i, day:d[i%3], time:(9+i)+':00',
        duration:'30 min', company:['Alpha Bio','Beta Therapeutics','Gamma Optics',
          'Delta Vision','Epsilon Labs','Zeta Medical'][i],
        format:i%2?'informal':'formal', ours:i%3?'Berto Diaz':'',
        theirs:'Dr Example, Chief Medical Officer',
        objective:'A sentence long enough to wrap onto a second line in the card.'});
    }
    await db.doc('outcomes/chk0').set({oppOn:true,oppKind:'existing',oppStudy:'Phase 2',
      oppPhase:'Phase 2',oppSize:'$1.4m'});
    await saveBrief({name:'Alpha Bio', c:'high',
      what:'x '.repeat(90), stage:'y '.repeat(90), ora:'z '.repeat(90), start:'w '.repeat(60)});
    document.getElementById('packout').innerHTML=packHTML();
    document.body.classList.add('packing');
  });
  await pg.emulateMedia({media:'print'});
  await pg.evaluate(()=>document.fonts.ready);
  await pg.waitForTimeout(700);

  console.log('\nPACK DESIGN CHECK\n');
  check('no page errors', errs.length===0, errs.length?errs[0]:'');

  const geo=await pg.evaluate(()=>{
    const s=[...document.styleSheets].flatMap(sh=>{try{return [...sh.cssRules]}catch(e){return []}});
    const find=t=>s.some(r=>r.cssText&&r.cssText.indexOf(t)>-1);
    return {page:find('120mm 200mm'), centred:find('width: 120mm')||find('width:120mm')};
  });
  check('page is 120 x 200mm, not A4', geo.page);
  check('page box centred as a fallback', geo.centred);

  const over=await pg.evaluate(pad=>{
    const lim=document.querySelector('#packout .pk-page').getBoundingClientRect().width;
    const inner=lim-2*pad*(96/25.4); const bad=[];
    document.querySelectorAll('#packout .pk-page *').forEach(el=>{
      if(el.getBoundingClientRect().width>inner+1.5)
        bad.push((el.className||el.tagName).toString().slice(0,28));
    });
    return bad;
  },PAD);
  check('nothing overflows the text column', over.length===0, over.slice(0,3).join(', '));

  const str=await pg.evaluate(()=>({
    links:document.querySelectorAll('#packout a[href^="#"]').length,
    broken:[...document.querySelectorAll('#packout a[href^="#"]')]
      .filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).length,
    tiers:document.querySelectorAll('#packout .pk-tier').length,
    sides:document.querySelectorAll('#packout .pk-sides').length,
    starts:document.querySelectorAll('#packout .pk-start').length
  }));
  check('internal links resolve', str.broken===0, str.links+' links, '+str.broken+' broken');
  check('tier badges render', str.tiers>0, str.tiers);
  check('both-sides block renders', str.sides>0, str.sides);

  const frag=await pg.evaluate(()=>{
    const cs=getComputedStyle(document.querySelector('#packout .pk-b'));
    return {overflow:cs.overflow, clone:cs.webkitBoxDecorationBreak||cs.boxDecorationBreak};
  });
  check('brief card can fragment (no overflow:hidden)', frag.overflow!=='hidden', frag.overflow);
  check('brief card decoration clones across pages', /clone/.test(frag.clone||''), frag.clone);

  const start=await pg.evaluate(()=>{
    const e=document.querySelector('#packout .pk-start');
    if(!e) return 'none';
    const cs=getComputedStyle(e);
    return cs.breakInside||cs.pageBreakInside;
  });
  check('"Where to start" never splits', /avoid/.test(start), start);

  const cdp=await pg.context().newCDPSession(pg);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const {root}=await cdp.send('DOM.getDocument',{depth:-1});
  const fonts=new Set();
  for(const sel of ['.pk-obj','.pk-co','.pk-gut','.pk-blab','.pk-cover h1']){
    const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#packout '+sel});
    if(!nodeId) continue;
    const {fonts:f}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
    f.forEach(x=>fonts.add(x.familyName));
  }
  const allowed=['Archivo','Public Sans','IBM Plex Mono'];
  const stray=[...fonts].filter(f=>!allowed.includes(f));
  check('only the embedded typefaces, no fallback', stray.length===0,
        stray.length?('stray: '+stray.join(', ')):[...fonts].join(', '));

  await pg.pdf({path:'packcheck-out.pdf',printBackground:true,preferCSSPageSize:true});
  const d=fs.readFileSync('packcheck-out.pdf');
  const mb=/\/MediaBox\s*\[([^\]]*)\]/.exec(d.toString('latin1'));
  const w=mb?parseFloat(mb[1].trim().split(/\s+/)[2]):0;
  check('printed PDF really is 120mm wide', Math.abs(w-340.16)<3, w.toFixed(0)+'pt');
  const px=10.5*393/w;
  check('body text >=11px on a 393px phone', px>=11, px.toFixed(1)+'px');

  console.log('\n'+(fails?fails+' CHECK(S) FAILED — the pack design has drifted'
                        :'all checks passed — the pack matches its spec')+'\n');
  await b.close(); process.exit(fails?1:0);
})();
