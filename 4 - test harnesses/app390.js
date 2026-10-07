const fs=require('fs'); const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const pg=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,
                            isMobile:true,hasTouch:true});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**', r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  await pg.goto('file://'+__dirname+'/AAO 2026 - Field Brief.html',{waitUntil:'load'});
  await pg.waitForTimeout(2400);
  const p=JSON.parse(fs.readFileSync(__dirname+'/AAO-2026-meetings-and-briefs.json','utf8'));
  await pg.evaluate(async d=>{ db.importAll(d.data); },p);
  await pg.waitForTimeout(900);
  console.log('app errors        :', errs.length?errs:'none');
  console.log('horizontal scroll :', await pg.evaluate(()=>
    document.documentElement.scrollWidth-document.documentElement.clientWidth));
  console.log('export button live:', await pg.evaluate(()=>{
    const b=[...document.querySelectorAll('button,a')]
      .filter(x=>/export the pack/i.test(x.textContent||''));
    return b.length?('yes, '+b.length+', disabled='+!!b[0].disabled):'NOT FOUND';
  }));
  // the export path itself, end to end, on a phone-sized window
  const n=await pg.evaluate(()=>{
    document.getElementById('packout').innerHTML=packHTML();
    document.body.classList.add('packing');
    return document.querySelectorAll('#packout .pk-page,#packout .pk-cover,#packout .pk-div').length;
  });
  console.log('pack sections built:', n);
  await pg.screenshot({path:'app-390-final.png'});
  await b.close();
})();
