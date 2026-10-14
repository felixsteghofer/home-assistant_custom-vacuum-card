import { chromium } from 'playwright-core';
import { readFile,mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
const code=await readFile(new URL('../dahoam-dreame-card.js',import.meta.url),'utf8');
const fixture=process.env.DOBBY_MAP_FIXTURE?await readFile(process.env.DOBBY_MAP_FIXTURE):null;
const errors=[];
async function setup(context){
 const page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',error=>errors.push(error.message));
 await page.route('http://card.test/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"><style>body{margin:16px;font:14px Arial;background:#fafafa;--primary-color:#03a9f4;--ha-card-border-radius:12px}dahoam-vacuum-card{display:block;max-width:410px;margin:40px auto 0}.outside{position:fixed;right:8px;top:8px;z-index:2}#bottom{height:1800px}</style><button class="outside" onclick="this.dataset.clicks=String(Number(this.dataset.clicks||0)+1)">Außerhalb</button><div id="bottom"></div>'}));
 await page.route('http://card.test/api/camera_proxy/**',route=>route.fulfill(fixture?{contentType:'image/png',body:fixture}:{contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#e4f4ff"/><path d="M50 50H550V550H50ZM300 50V550M50 300H550" fill="none" stroke="#03a9f4" stroke-width="10"/></svg>'}));
 await page.goto('http://card.test');await page.addScriptTag({content:code,type:'module'});
 await page.evaluate(()=>{window.calls=[];window.hass={states:{'vacuum.test':{state:'docked',attributes:{friendly_name:'Dobby',supported_features:12988,fan_speed_list:['min','low','medium','high','max'],fan_speed:'medium'}},'camera.map':{state:'idle',attributes:{entity_picture:'/api/camera_proxy/camera.map?token=example'}},'switch.carpet':{state:'on',attributes:{}}},services:{vacuum:{start:{},pause:{},stop:{},return_to_base:{},set_fan_speed:{},locate:{},clean_spot:{}},switch:{turn_on:{},turn_off:{}}},callService:async(...args)=>calls.push(args),hassUrl:path=>'http://card.test'+path};window.card=document.createElement('dahoam-vacuum-card');card.setConfig({entity:'vacuum.test',map_entity:'camera.map',carpet_mode_entity:'switch.carpet'});card.hass=hass;document.body.insertBefore(card,document.querySelector('#bottom'));});
 await page.locator('dahoam-vacuum-card .map img').evaluate(img=>img.decode());return page;
}
const desktop=await browser.newContext({viewport:{width:1000,height:900}}),page=await setup(desktop),root=page.locator('dahoam-vacuum-card'),map=root.locator('.map-viewport');
const badge=root.locator('[data-action="panel-settings"]'),flyout=root.locator('.flyout');
await badge.click();assert.equal(await flyout.evaluate(el=>el.matches(':popover-open')),true);
assert.equal(await flyout.getAttribute('aria-modal'),'false');
assert.equal(await page.locator('dialog:modal').count(),0);
assert.equal(await flyout.evaluate(el=>getComputedStyle(el,'::backdrop').backgroundColor),'rgba(0, 0, 0, 0)');
assert.equal(await badge.getAttribute('aria-expanded'),'true');
const anchor=await badge.boundingBox(),panel=await flyout.boundingBox();
assert.ok(panel.x>=8 && panel.y>=8 && panel.x+panel.width<=992 && panel.y+panel.height<=892);
assert.ok(Math.min(Math.abs(panel.y-(anchor.y+anchor.height)),Math.abs(panel.y+panel.height-anchor.y))<10);
await page.locator('.outside').click();assert.equal(await page.locator('.outside').getAttribute('data-clicks'),'1');
await page.waitForFunction(()=>!card._isFlyoutOpen());assert.equal(await badge.getAttribute('aria-expanded'),'false');
// Same badge toggles; a different badge changes the anchored panel without a backdrop.
await badge.click();await badge.click();assert.equal(await flyout.evaluate(el=>el.matches(':popover-open')),false);
await badge.focus();await page.keyboard.press('Enter');
assert.equal(await page.evaluate(()=>card.shadowRoot.activeElement?.dataset.setting),'fan');
await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>card.shadowRoot.activeElement?.dataset.action),'panel-settings');
// An HA update preserves the panel and native control nodes.
await badge.click();await page.evaluate(()=>{window.savedFlyout=card.shadowRoot.querySelector('.flyout');window.savedSelect=card.shadowRoot.querySelector('select');hass.states['vacuum.test'].attributes.fan_speed='high';card.hass={...hass}});
assert.equal(await page.evaluate(()=>savedFlyout===card.shadowRoot.querySelector('.flyout') && savedSelect===card.shadowRoot.querySelector('select') && card._isFlyoutOpen()),true);
await page.keyboard.press('Escape');
// Unfocused wheel scrolling remains page scrolling.
await map.scrollIntoViewIfNeeded();await page.evaluate(()=>{card.shadowRoot.activeElement?.blur();window.scrollTo(0,0)});
let box=await map.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
let pageY=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,120);
await page.waitForFunction(y=>scrollY>y,pageY);assert.equal(await page.evaluate(()=>card._zoom),1);
// A click focuses the map; wheel zoom then preserves the pointer's map coordinate.
await map.scrollIntoViewIfNeeded();box=await map.boundingBox();const px=box.x+box.width*.65,py=box.y+box.height*.6;
await page.mouse.click(px,py);pageY=await page.evaluate(()=>scrollY);
const pointBefore=await page.evaluate(({px,py})=>{const el=card.shadowRoot.querySelector('.map-viewport'),r=el.getBoundingClientRect();return {x:(el.scrollLeft+px-r.left)/card._zoom,y:(el.scrollTop+py-r.top)/card._zoom}},{px,py});
await page.mouse.wheel(0,-100);await page.waitForFunction(()=>card._zoom>1);
const pointAfter=await page.evaluate(({px,py})=>{const el=card.shadowRoot.querySelector('.map-viewport'),r=el.getBoundingClientRect();return {x:(el.scrollLeft+px-r.left)/card._zoom,y:(el.scrollTop+py-r.top)/card._zoom}},{px,py});
assert.ok(Math.abs(pointBefore.x-pointAfter.x)<2 && Math.abs(pointBefore.y-pointAfter.y)<2);assert.equal(await page.evaluate(()=>scrollY),pageY);
await map.press('0');assert.equal(await page.evaluate(()=>card._zoom),1);
await map.press('+');assert.equal(await page.evaluate(()=>card._zoom),1.5);await map.press('0');
// Modifier wheel also works without focus, including trackpad pinch-as-wheel.
await page.locator('.outside').focus();box=await map.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
await page.keyboard.down('Control');await page.mouse.wheel(0,-90);await page.keyboard.up('Control');await page.waitForFunction(()=>card._zoom>1);
assert.equal(await page.evaluate(()=>visualViewport.scale),1);
// Mouse dragging pans only the zoomed map. Scrollbars and arrow keys are alternatives.
await page.evaluate(()=>card._setMapZoom(3));box=await map.boundingBox();
const panBefore=await map.evaluate(el=>el.scrollLeft);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2-40,box.y+box.height/2,{steps:4});await page.mouse.up();
assert.ok(await map.evaluate(el=>el.scrollLeft)>panBefore+30);
await root.locator('[data-action="zoom-reset"]').click();assert.equal(await page.evaluate(()=>card._zoom),1);
// Scrolling the page with an open flyout must not lock or jump the page.
await badge.click();await page.evaluate(()=>scrollTo(0,1000));await page.waitForFunction(()=>scrollY>=1000);await page.waitForFunction(()=>!card._isFlyoutOpen());assert.ok(await page.evaluate(()=>scrollY)>=1000);
await page.evaluate(()=>scrollTo(0,0));await mkdir(new URL('../reports/',import.meta.url),{recursive:true});
await page.screenshot({path:new URL('../reports/native-light.png',import.meta.url).pathname,fullPage:false});
await badge.click();await page.screenshot({path:new URL('../reports/anchored-flyout.png',import.meta.url).pathname,fullPage:false});
await page.keyboard.press('Escape');
await page.evaluate(()=>{document.body.style.cssText='--primary-text-color:#e1e1e1;--secondary-text-color:#9b9b9b;--card-background-color:#1c1c1c;--secondary-background-color:#111;--divider-color:#333;background:#111;color:#e1e1e1'});
await badge.click();await root.locator('.map img').evaluate(img=>img.decode());
assert.equal(await page.evaluate(()=>card._zoom),1);
assert.equal(await map.evaluate(el=>el.scrollLeft),0);
assert.equal(await map.evaluate(el=>el.scrollTop),0);
await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
await root.locator('.map img').screenshot({path:new URL('../reports/dark-map-element.png',import.meta.url).pathname});
await page.screenshot({path:new URL('../reports/native-dark.png',import.meta.url).pathname,fullPage:false});
assert.equal(await flyout.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(28, 28, 28)');await page.keyboard.press('Escape');
// Browser fallback still anchors without a blocking modal or document listener leaks.
const fallback=await setup(desktop);await fallback.evaluate(()=>{HTMLElement.prototype.showPopover=undefined;HTMLElement.prototype.hidePopover=undefined;card.hass={...hass}});
await fallback.locator('[data-action="panel-settings"]').click();assert.equal(await fallback.locator('.flyout').isVisible(),true);
await fallback.locator('.outside').click();assert.equal(await fallback.locator('.flyout').isVisible(),false);await fallback.close();
// Real multi-touch input in Chromium's mobile emulation (not direct method calls).
const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}),touchPage=await setup(mobile),touchMap=touchPage.locator('.map-viewport'),cdp=await mobile.newCDPSession(touchPage);
await touchMap.scrollIntoViewIfNeeded();let bounds=await touchMap.boundingBox(),cx=bounds.x+bounds.width/2,cy=bounds.y+bounds.height/2;
const touch=(id,x,y)=>({id,x,y,radiusX:5,radiusY:5,force:1});
const startY=await touchPage.evaluate(()=>scrollY);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,cx-40,cy),touch(2,cx+40,cy)]});
for(let distance=50;distance<=90;distance+=10)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,cx-distance,cy),touch(2,cx+distance,cy)]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
assert.ok(await touchPage.evaluate(()=>card._zoom)>2);assert.equal(await touchPage.evaluate(()=>visualViewport.scale),1);assert.ok(Math.abs(await touchPage.evaluate(()=>scrollY)-startY)<2);
const touchPanBefore=await touchMap.evaluate(el=>el.scrollLeft);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,cx-40,cy),touch(2,cx+40,cy)]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,cx-70,cy),touch(2,cx+10,cy)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
assert.ok(await touchMap.evaluate(el=>el.scrollLeft)>touchPanBefore+20);
// Returning to 100% restores ordinary one-finger page scrolling through the map.
await touchPage.evaluate(()=>{card._setMapZoom(1);scrollTo(0,0)});bounds=await touchMap.boundingBox();cx=bounds.x+bounds.width/2;cy=bounds.y+bounds.height*.8;
const beforeSwipe=await touchPage.evaluate(()=>scrollY);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,cx,cy)]});
for(let delta=15;delta<=120;delta+=15){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,cx,cy-delta)]});await touchPage.evaluate(()=>new Promise(requestAnimationFrame));}
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
await touchPage.waitForFunction(y=>scrollY>y+10,beforeSwipe);assert.equal(await touchPage.evaluate(()=>card._zoom),1);
assert.equal(await touchPage.evaluate(()=>getComputedStyle(document.body).touchAction),'auto');
await touchPage.evaluate(()=>scrollTo(0,0));await touchPage.locator('[data-action="panel-settings"]').click();
const mobilePanel=await touchPage.locator('.flyout').boundingBox();assert.ok(mobilePanel.x>=8 && mobilePanel.x+mobilePanel.width<=382 && mobilePanel.y>=8 && mobilePanel.y+mobilePanel.height<=836);
await touchPage.screenshot({path:new URL('../reports/mobile-flyout.png',import.meta.url).pathname,fullPage:false});
assert.deepEqual(errors,[]);await browser.close();
console.log('Passed: nonmodal anchored popovers, outside click, keyboard/Escape, viewport collision, theme variables, legacy fallback, cooperative wheel zoom, focal point, mouse pan, actual multi-touch pinch/pan and one-finger page scrolling. No device commands.');
