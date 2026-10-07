const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**', r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  await pg.goto('file://'+__dirname+'/AAO 2026 - Field Brief.html',{waitUntil:'load'});
  await pg.waitForTimeout(2300);
  await pg.getByText('Eyecelerator',{exact:true}).first().click();
  await pg.waitForTimeout(800);
  console.log('page errors        :', errs.length?errs:'none');
  console.log('dead (disabled) controls:', await pg.evaluate(()=>
    document.querySelectorAll('.sessionbtn[disabled]').length), '(must be 0 — house rule)');
  console.log('sessions on the day:', await pg.evaluate(()=>
    document.querySelectorAll('.sessioncard').length));
  console.log('companies indexed  :', await pg.evaluate(()=>COMPANIES.length));

  // the actual complaint: tap the showcase and see if it opens
  const btn = pg.locator('button.sessionbtn', {hasText:'Retina Drug Delivery'});
  console.log('showcase is a live button:', await btn.count()>0, '| disabled:', await btn.first().isDisabled());
  await btn.first().click();
  await pg.waitForTimeout(600);
  const r=await pg.evaluate(()=>{
    const card=[...document.querySelectorAll('.sessioncard')]
      .find(c=>/Retina Drug Delivery/.test(c.textContent));
    const body=card && card.querySelector('.sbody');
    return {expanded:card.querySelector('[aria-expanded]')?.getAttribute('aria-expanded'),
            companyCards:body?body.querySelectorAll('.ccard').length:0,
            firstNames:body?[...body.querySelectorAll('.cname')].slice(0,4).map(e=>e.textContent.trim()):[]};
  });
  console.log('after tapping      :', JSON.stringify(r));
  await pg.screenshot({path:'app-showcase.png',fullPage:false});
  await b.close();
})();
