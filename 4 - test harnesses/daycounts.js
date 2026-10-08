/* usage: phone build served as app.html on :8765, then
   NODE_PATH=/opt/node22/lib/node_modules node daycounts.js <dir of fb/*.json> */
// Floor conversations count as meetings on their day, everywhere a day is counted.
const fs=require('fs');const {chromium,devices}=require('playwright');
const store={};for(const f of fs.readdirSync(process.argv[2])) store['fb/'+f.replace('.json','')]=JSON.parse(fs.readFileSync(process.argv[2]+'/'+f));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13']});
await ctx.exposeFunction('__dbGet',p=>store[p]===undefined?null:JSON.parse(JSON.stringify(store[p])));
await ctx.exposeFunction('__dbSet',(p,d)=>{store[p]=d;return true;});
await ctx.addInitScript(`window.claude={use:async function(n){ if(n==='db') return {doc:function(p){return {get:async function(){const v=await window.__dbGet(p);(function fz(o){if(o&&typeof o==="object"){Object.freeze(o);Object.values(o).forEach(fz);}})(v);return {exists:v!=null,data:function(){return v;}};},set:async function(d){await window.__dbSet(p,d);}}}}; return null;}};`);
const pg=await ctx.newPage();await pg.clock.install({time:new Date('2026-10-08T18:50:00Z')});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:8765/frame.html');await pg.clock.runFor(4000);await pg.waitForTimeout(1200);
const f=pg.frame({url:/app\.html/});
const read=async()=>f.evaluate(()=>({tab:[...document.querySelectorAll('[data-tab]')].map(e=>e.textContent.trim()).slice(0,3).join(' | '), stat:(document.querySelector('.stat')||{}).textContent}));
await f.locator('[data-tab="eyec"]').first().tap(); await pg.waitForTimeout(300);
console.log('eyec now      :',JSON.stringify(await read()));
// log one more on a Friday-presenting company from Friday's tab
const fri=await f.evaluate(()=>{const c=COMPANIES.find(c=>c.slots.every(s=>s.dayKey==='eyec')&&!accountMeetings(c.id).length&&!accountHeld(c.id));return c&&c.id;});
await f.locator('[data-tab="eyec"]').first().tap(); await pg.waitForTimeout(300);
const before=await read();
{const nb=await f.locator('button.sessionbtn').count(); for(let i=0;i<nb;i++){ if(await f.locator('button.cbtn[data-co="'+fri+'"]').count()) break; const sb=f.locator('button.sessionbtn').nth(i); await sb.scrollIntoViewIfNeeded(); await sb.tap(); await pg.waitForTimeout(150);} }
const cb=f.locator('button.cbtn[data-co="'+fri+'"]').first(); console.log('friday company',fri, await cb.count());
if(await cb.count()){ await cb.scrollIntoViewIfNeeded(); await cb.tap(); await pg.waitForTimeout(200); const h=f.locator('[data-accheld="'+fri+'"]').first(); await h.scrollIntoViewIfNeeded(); await h.tap(); await pg.waitForTimeout(300);}
console.log('fri before    :',JSON.stringify(before)); console.log('fri after     :',JSON.stringify(await read()));
console.log('recorded day  :',await f.evaluate(id=>state.targets[id].day,fri));
await f.locator('[data-tab="exec"]').first().tap(); await pg.waitForTimeout(300);
console.log('overview shape:',await f.evaluate(()=>[...document.querySelectorAll('.shape .col')].map(c=>c.querySelector('.lab').textContent+'='+c.querySelector('.num').textContent).join(' ')));
console.log('errors',errs.length?errs:'none');await b.close();})();
