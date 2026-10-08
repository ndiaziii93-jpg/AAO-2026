/* The upgrade a user actually does: data typed into the OLD app, the HTML file
   replaced in place, the NEW app opened. Nothing typed may be lost.
   usage: NODE_PATH=/opt/node22/lib/node_modules node upgrade.js <dir> <backup.json>
   <dir> holds old.html (the build being replaced) and new.html (the candidate).
   The typed text below is invented; the backup supplies the real meeting ids. */
const fs=require('fs');const {chromium}=require('playwright');
const [DIR,BK]=process.argv.slice(2);
const APP=DIR+'/app.html';
const TYPED={
  aao01:{topic:'MGD endpoints',objective:'OBJ-typed: agree the sign endpoint for Phase 3',background:'BG-typed: background line one'},
  aao08:{topic:'US Phase 3 grading',objective:'OBJ-typed: own AC cell grading across US sites',background:'BG-typed: background line two'},
  mmux1b91f:{topic:'NPDR Upcoming RFP',objective:'OBJ-typed: get on the CLEAR-DE successor RFP',background:'BG-typed: background line three'}
};
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844}});
  const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('dialog',d=>d.accept());
  await pg.route('**',r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  fs.copyFileSync(DIR+'/old.html',APP);
  await pg.goto('file://'+APP,{waitUntil:'load'}); await pg.waitForTimeout(2300);
  console.log('OLD build:', await pg.evaluate(()=>BUILD));
  const [fc]=await Promise.all([pg.waitForEvent('filechooser'),pg.locator('button[data-restore]').first().click()]);
  await fc.setFiles(BK); await pg.waitForTimeout(900);
  // type through the real edit form in the OLD app
  for(const [id,v] of Object.entries(TYPED)){
    const day=await pg.evaluate(id=>state.meetings[id].day,id);
    await pg.locator('[data-tab="'+day+'"]').first().click(); await pg.waitForTimeout(300);
    await pg.locator('[data-row="mtg-'+id+'"]').click(); await pg.waitForTimeout(300);
    await pg.locator('[data-edit="'+id+'"]').click(); await pg.waitForTimeout(300);
    await pg.locator('#mform [name="topic"]').fill(v.topic);
    await pg.locator('#mform [name="objective"]').fill(v.objective);
    await pg.locator('#mform [name="background"]').fill(v.background);
    await pg.locator('[data-save]').first().click(); await pg.waitForTimeout(500);
  }
  const before=await pg.evaluate(()=>JSON.stringify(state.meetings));
  const beforeStore=await pg.evaluate(()=>localStorage.getItem(STORE_KEY).length);
  // swap the file in place, reopen
  fs.copyFileSync(DIR+'/new.html',APP);
  await pg.goto('file://'+APP,{waitUntil:'load'}); await pg.waitForTimeout(2300);
  console.log('NEW build:', await pg.evaluate(()=>BUILD), '| stored bytes before swap:', beforeStore);
  const after=await pg.evaluate(()=>JSON.stringify(state.meetings));
  const A=JSON.parse(before), B=JSON.parse(after);
  const lost=[];
  for(const id of Object.keys(A)) for(const k of Object.keys(A[id]))
    if(JSON.stringify(A[id][k])!==JSON.stringify((B[id]||{})[k])) lost.push(id+'.'+k);
  console.log('meetings before/after:', Object.keys(A).length, Object.keys(B).length, '| fields changed or lost:', lost.length?lost:'none');
  console.log('briefs after swap:', await pg.evaluate(()=>Object.keys(BRIEFS).length));
  // what the new card shows, opened by a real tap
  for(const [id,v] of Object.entries(TYPED)){
    const day=await pg.evaluate(id=>state.meetings[id].day,id);
    await pg.locator('[data-tab="'+day+'"]').first().click(); await pg.waitForTimeout(300);
    const row=pg.locator('[data-row="mtg-'+id+'"]');
    const collapsed=await row.locator('.mobj').innerText();
    await row.click(); await pg.waitForTimeout(300);
    const box=await pg.locator('.bdv').first().innerText();
    console.log(id,'| collapsed:',JSON.stringify(collapsed),'| opened shows topic/obj/bg:',
      box.includes(v.topic), box.includes(v.objective), box.includes(v.background));
    await row.click(); await pg.waitForTimeout(200);
  }
  // edit only the topic in the NEW app: objective and background must survive the save
  const id='aao08', day=await pg.evaluate(id=>state.meetings[id].day,id);
  await pg.locator('[data-tab="'+day+'"]').first().click(); await pg.waitForTimeout(300);
  await pg.locator('[data-row="mtg-'+id+'"]').click(); await pg.waitForTimeout(300);
  await pg.locator('[data-edit="'+id+'"]').click(); await pg.waitForTimeout(300);
  await pg.locator('#mform [name="topic"]').fill('Changed topic only');
  await pg.locator('[data-save]').first().click(); await pg.waitForTimeout(500);
  await pg.reload({waitUntil:'load'}); await pg.waitForTimeout(2300);
  const m=await pg.evaluate(id=>state.meetings[id],id);
  console.log('after editing topic in new app + reload:', JSON.stringify({topic:m.topic, objective:m.objective, background:m.background}));
  console.log('errors:', errs.length?errs:'none');
  await b.close();
})();
