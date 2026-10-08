/* usage: serve the phone build as app.html on :8765 (frame.html wraps it the way
   claude.ai does), then NODE_PATH=/opt/node22/lib/node_modules node companytap.js <dir of fb/*.json> [all|<company id>] */
// Every presenting-company card on the phone, driven by finger only, with the
// store handing back frozen records as the real one does.
const fs=require('fs');const {chromium,devices}=require('playwright');
const store={};for(const f of fs.readdirSync(process.argv[2])) store['fb/'+f.replace('.json','')]=JSON.parse(fs.readFileSync(process.argv[2]+'/'+f));
const ONLY=process.argv[3]||'';
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({...devices['iPhone 13']});
await ctx.exposeFunction('__dbGet',p=>store[p]===undefined?null:JSON.parse(JSON.stringify(store[p])));
await ctx.exposeFunction('__dbSet',(p,d)=>{store[p]=d;return true;});
await ctx.addInitScript(`window.claude={use:async function(n){ if(n==='db') return {doc:function(p){return {get:async function(){const v=await window.__dbGet(p);(function fz(o){if(o&&typeof o==="object"){Object.freeze(o);Object.values(o).forEach(fz);}})(v);return {exists:v!=null,data:function(){return v;}};},set:async function(d){await window.__dbSet(p,d);}}}}; return null;}};
 window.addEventListener('click',function(e){ if(e.isTrusted) e.stopImmediatePropagation(); },true);`);
const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:8765/frame.html');await pg.waitForTimeout(3500);
const f=pg.frame({url:/app\.html/});
let fails=0; const ok=(l,c)=>{ if(!c){fails++;console.log('FAIL '+l);} };
await f.locator('[data-tab="eyec"]').first().tap();await pg.waitForTimeout(400);
// open every session that lists companies
const nb=await f.locator('button.sessionbtn').count();
for(let i=0;i<nb;i++){ const s=f.locator('button.sessionbtn').nth(i); if(await s.getAttribute('aria-expanded')!=='true'){ await s.scrollIntoViewIfNeeded(); await s.tap(); await pg.waitForTimeout(150);} }
const cos=await f.evaluate(()=>[...new Set([...document.querySelectorAll('button.cbtn[data-co]')].map(e=>e.dataset.co))]);
console.log('company cards:',cos.length);
for(const c of (ONLY&&ONLY!=='all'?[ONLY]:cos)){ const bt=f.locator('button.cbtn[data-co="'+c+'"]').first(); await bt.scrollIntoViewIfNeeded(); await bt.tap(); await pg.waitForTimeout(120); }
let ids=await f.evaluate(()=>[...new Set([...document.querySelectorAll('.ccard [data-note]')].map(e=>e.dataset.note))]);
console.log('company cards with notes:',ids.length);
// widths
const over=await f.evaluate(()=>{const W=document.documentElement.clientWidth;return [...document.querySelectorAll('.ccard')].filter(c=>c.getBoundingClientRect().right>W+0.5||c.scrollWidth>c.clientWidth+1).map(c=>(c.querySelector('.cname')||{}).textContent+' r='+Math.round(c.getBoundingClientRect().right)+' sw='+c.scrollWidth+' cw='+c.clientWidth);});
ok('no company card wider than the screen ('+over.length+')',over.length===0); if(over.length) console.log(over.slice(0,4));
const clipped=await f.evaluate(()=>[...document.querySelectorAll('.ccard button')].filter(b=>b.scrollWidth>b.clientWidth+1).map(b=>b.textContent.trim()));
ok('no clipped button text '+JSON.stringify([...new Set(clipped)]),clipped.length===0);
if(ONLY==='all'){} else if(ONLY) ids=ids.filter(i=>i===ONLY); else ids=ids.slice(0,6);
const sel=s=>f.locator(s).first();
const tapTog=async(s,label)=>{const el=sel(s); if(!await el.count()){ok(label+' missing',false);return;} await el.scrollIntoViewIfNeeded(); const p0=await el.getAttribute('aria-pressed'); await el.tap(); await pg.waitForTimeout(200); ok(label+' '+s, p0!==await sel(s).getAttribute('aria-pressed'));};
for(const id of ids){
  const hasOrigin=await f.locator('[data-accorigin^="'+id+'|"]').count();
  if(hasOrigin){ await tapTog('[data-accorigin="'+id+'|hunted"]','origin'); await tapTog('[data-accheld="'+id+'"]','spoke'); }
  for(const k of ['target','booked','dropped']) await tapTog('[data-status="'+id+'|'+k+'"]','status');
  await tapTog('[data-acc^="'+id+'|activeOpp|"]','open coming in');
  const on=f.locator('[data-oppnote="'+id+'"]'); if(await on.count()){ await on.scrollIntoViewIfNeeded(); await on.tap(); await on.fill('Phase 2 DME'); await on.press('Tab').catch(()=>{}); await f.evaluate(()=>document.activeElement&&document.activeElement.blur()); await pg.waitForTimeout(200); ok('opp note saved', await f.evaluate(id=>state.targets[id].oppNote,id)==='Phase 2 DME'); }
  await tapTog('[data-acc^="'+id+'|newEngagement|"]','new engagement');
  const nt=f.locator('[data-note="'+id+'"]').first(); await nt.scrollIntoViewIfNeeded(); await nt.tap(); await nt.type('Met at the stand');
  // straight from the note to the debrief button
  const stub=await f.evaluate(id=>{const b=[...document.querySelectorAll('.ccard')].find(c=>c.querySelector('[data-note="'+id+'"]'));const t=b&&b.querySelector('.tog.dbftog[data-row^="dbf-"]');return t&&t.dataset.row;},id);
  ok('Log debrief button present',!!stub); if(!stub) continue;
  const lg=f.locator('.tog[data-row="'+stub+'"]').first(); await lg.scrollIntoViewIfNeeded(); await lg.tap(); await pg.waitForTimeout(250);
  ok('note kept', (await f.evaluate(id=>(state.targets[id]||{}).note||'',id)).indexOf('Met at the stand')>=0);
  const sid=stub.slice(4); const notes=f.locator('[data-dbfin="'+sid+'|notes"]'); ok('debrief form opens', await notes.count()===1); if(!await notes.count()) continue;
  const chip=f.locator('[data-dbf^="'+sid+'|outcome|"]').first(); const cs=await chip.getAttribute('data-dbf'); await chip.scrollIntoViewIfNeeded(); await chip.tap(); await pg.waitForTimeout(200);
  ok('debrief chip', await f.evaluate(([sid,cs])=>(state.debriefs[sid]||{}).outcome===cs.split('|')[2],[sid,cs]));
  await notes.scrollIntoViewIfNeeded(); await notes.tap(); await notes.type('Talked phase 2 timelines'); await pg.waitForTimeout(900);
  ok('debrief notes kept', ((state=>state)(await f.evaluate(sid=>(state.debriefs[sid]||{}).notes,sid))||'').indexOf('phase 2')>0);
  const done=f.locator('.btn[data-row="'+stub+'"]').first(); await done.scrollIntoViewIfNeeded(); await done.tap(); await pg.waitForTimeout(250);
  ok('Done closes', await f.locator('[data-dbfin="'+sid+'|notes"]').count()===0);
  const sf=f.locator('[data-sf="'+sid+'"]').first(); if(await sf.count()){ await sf.scrollIntoViewIfNeeded(); await sf.tap(); await pg.waitForTimeout(300); ok('Salesforce opens', await f.evaluate(()=>!document.getElementById('editor').hidden)); const c=f.locator('#editor [data-close]').first(); if(await c.count()){await c.tap();} else await f.evaluate(()=>closeEditor()); await pg.waitForTimeout(200);}
  const pod=f.locator('[data-exmeet="'+id+'"]').first(); if(await pod.count()){ await pod.scrollIntoViewIfNeeded(); await pod.tap(); await pg.waitForTimeout(300); ok('Put it on a day opens the form', await f.evaluate(()=>!document.getElementById('editor').hidden)); await f.evaluate(()=>closeEditor()); await pg.waitForTimeout(150);}
  console.log('checked',id);
}
await pg.waitForTimeout(1800);
ok('targets synced', JSON.stringify(store['fb/targets']).indexOf('Met at the stand')>0);
ok('debriefs synced', JSON.stringify(store['fb/debriefs']||{}).indexOf('phase 2 timelines')>0);
console.log('failures',fails,'errors',errs.length?errs.slice(0,5):'none');
await b.close();})();
