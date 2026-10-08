/* usage: serve the phone build as app.html inside a sandboxed frame.html on :8765, then
   NODE_PATH=/opt/node22/lib/node_modules node phonetap.js <backup.json>
   The stand-in store hands back frozen records, as the real one does. */
// Worst case for the iPhone: Safari sends no click at all for a tap. Every
// control below has to answer to the finger alone.
const fs=require('fs');const {chromium,devices}=require('playwright');
const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8')).data;
const store={};Object.keys(data).forEach(k=>store['fb/'+k]={items:data[k]});
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({...devices['iPhone 13']});
await ctx.exposeFunction('__dbGet',p=>store[p]===undefined?null:JSON.parse(JSON.stringify(store[p])));
await ctx.exposeFunction('__dbSet',(p,d)=>{store[p]=d;return true;});
await ctx.addInitScript(`window.claude={use:async function(n){ if(n==='db') return {doc:function(p){return {get:async function(){const v=await window.__dbGet(p);(function fz(o){if(o&&typeof o==="object"){Object.freeze(o);Object.values(o).forEach(fz);}})(v);return {exists:v!=null,data:function(){return v;}};},set:async function(d){await window.__dbSet(p,d);}}}}; return null;}};
 window.addEventListener('click',function(e){ if(e.isTrusted) e.stopImmediatePropagation(); },true);`);
const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:8765/frame.html');await pg.waitForTimeout(3500);
const f=pg.frame({url:/app\.html/});
const ok=(l,c)=>console.log((c?'PASS ':'FAIL ')+l);
await f.locator('[data-tab="eyec"]').first().tap();await pg.waitForTimeout(400);
ok('tab change by finger', await f.evaluate(()=>state.tab)==='eyec');
const ids=await f.evaluate(()=>Object.keys(state.meetings).filter(k=>state.meetings[k].day==='eyec' && !(state.debriefs[k]&&state.debriefs[k].notes)));
const id=ids[0];
const row=f.locator('[data-row="mtg-'+id+'"]'); await row.scrollIntoViewIfNeeded(); await row.tap(); await pg.waitForTimeout(300);
ok('card opens', await row.getAttribute('aria-expanded')==='true');
for(const sel of ['[data-origin^="'+id+'|"]','[data-held="'+id+'"]','[data-opp="'+id+'"]']){
  const el=f.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const p0=await el.getAttribute('aria-pressed'); await el.tap(); await pg.waitForTimeout(300);
  ok(sel+' toggles once', p0!==await f.locator(sel).first().getAttribute('aria-pressed'));
}
const lg=f.locator('.tog[data-row="dbf-'+id+'"]'); await lg.scrollIntoViewIfNeeded(); await lg.tap(); await pg.waitForTimeout(300);
const notes=f.locator('[data-dbfin="'+id+'|notes"]'); ok('Log debrief opens the form', await notes.count()===1);
const chip=f.locator('[data-dbf^="'+id+'|"]').first(); const cs=await chip.getAttribute('data-dbf'); await chip.scrollIntoViewIfNeeded(); await chip.tap(); await pg.waitForTimeout(300);
ok('debrief chip '+cs, await f.evaluate(([id,cs])=>{const p=cs.split('|');return state.debriefs[id][p[1]]===p.slice(2).join('|')},[id,cs]));
await notes.scrollIntoViewIfNeeded(); await notes.tap(); await notes.type('They run two dry eye studies next year');
await pg.waitForTimeout(1000);
ok('notes kept while still typing (no leave)', await f.evaluate(id=>state.debriefs[id].notes,id)==='They run two dry eye studies next year');
await notes.type(', Q2 start');
const chip2=f.locator('[data-dbf^="'+id+'|"]').nth(3); const cs2=await chip2.getAttribute('data-dbf'); await chip2.tap(); await pg.waitForTimeout(400);
ok('chip tapped straight from the notes box: notes saved', await f.evaluate(id=>state.debriefs[id].notes,id)==='They run two dry eye studies next year, Q2 start');
ok('...and the chip took', await f.evaluate(([id,cs])=>{const p=cs.split('|');return state.debriefs[id][p[1]]===p.slice(2).join('|')},[id,cs2]));
const done=f.locator('.btn[data-row="dbf-'+id+'"]'); await done.scrollIntoViewIfNeeded(); await done.tap(); await pg.waitForTimeout(300);
ok('Done closes the form', await f.locator('[data-dbfin="'+id+'|notes"]').count()===0);
await pg.waitForTimeout(1800);
ok('debrief synced to the private copy', ((store['fb/debriefs']||{}).items||{})[id] && store['fb/debriefs'].items[id].notes.indexOf('Q2 start')>0);
// a scroll that starts on a button must not press it
const opp=f.locator('[data-opp="'+id+'"]'); await opp.scrollIntoViewIfNeeded(); const box=await opp.boundingBox(); const p1=await opp.getAttribute('aria-pressed');
const cdp=await ctx.newCDPSession(pg);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+10,y:box.y+10}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+10,y:box.y-60}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await pg.waitForTimeout(300);
ok('a scroll over a button does not press it', p1===await f.locator('[data-opp="'+id+'"]').getAttribute('aria-pressed'));
// add a meeting
const add=f.locator('[data-new]').first(); await add.scrollIntoViewIfNeeded(); await add.tap(); await pg.waitForTimeout(400);
ok('Add meeting opens the editor', await f.evaluate(()=>!document.getElementById('editor').hidden));
await f.locator('#editor input[name="company"]').fill('Testco Ophthalmics');
await f.locator('#editor input[name="time"]').fill('15:30');
await f.locator('#editor input[name="topic"]').fill('Phase 2 site capacity');
await f.locator('#editor input[name="topic"]').tap();
const save=f.locator('#editor [data-save]'); await save.scrollIntoViewIfNeeded(); await save.tap(); await pg.waitForTimeout(500);
const nid=await f.evaluate(()=>Object.keys(state.meetings).find(k=>state.meetings[k].company==='Testco Ophthalmics'));
ok('new meeting saved and editor closed', !!nid && await f.evaluate(()=>document.getElementById('editor').hidden));
await pg.waitForTimeout(1800);
ok('new meeting synced', !!(store['fb/meetings'].items[nid]));
const er=f.locator('[data-row="mtg-'+id+'"]'); await er.scrollIntoViewIfNeeded();
const ed=f.locator('[data-edit="'+id+'"]').first(); await ed.scrollIntoViewIfNeeded(); await ed.tap(); await pg.waitForTimeout(400);
await f.locator('#editor input[name="topic"]').fill('Edited on the phone'); const sv=f.locator('#editor [data-save]'); await sv.scrollIntoViewIfNeeded(); await sv.tap(); await pg.waitForTimeout(500);
ok('existing meeting edited', await f.evaluate(id=>state.meetings[id].topic,id)==='Edited on the phone');
await pg.waitForTimeout(1800); ok('edit synced', store['fb/meetings'].items[id].topic==='Edited on the phone');
console.log('errors:',errs.length?errs.slice(0,5):'none');
await b.close();})();
