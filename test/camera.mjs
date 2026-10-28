import {chromium} from 'playwright-core';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
const code=await readFile(new URL('../dahoam-dreame-card.js',import.meta.url),'utf8');
await mkdir(new URL('../reports/',import.meta.url),{recursive:true});
for(const width of [1000,390]){
 const page=await browser.newPage({viewport:{width,height:850}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://card.test/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:Arial;background:#fafafa}</style>'}));
 await page.goto('http://card.test');await page.addScriptTag({content:code,type:'module'});
 await page.evaluate(()=>{
  window.calls=[];window.events=[];
  customElements.define('hui-picture-entity-card',class extends HTMLElement {setConfig(config){this.config=config;this.textContent='Native live video';this.style.cssText='aspect-ratio:16/9;background:#222;color:white;display:grid;place-items:center';}});
  window.loadCardHelpers=async()=>{if(window.waitHelpers)await new Promise(resolve=>window.resolveHelpers=resolve);return {createCardElement:config=>{const card=document.createElement('hui-picture-entity-card');card.setConfig(config);return card;}}};
  window.hass={states:{'vacuum.test':{state:'docked',attributes:{supported_features:8192}},'camera.live':{state:'idle',attributes:{supported_features:1,friendly_name:'Winky Live'}}},services:{camera:{turn_on:{}}},callService:async(...args)=>{calls.push(args);if(args[1]==='turn_on'){if(window.waitStart)await new Promise((resolve,reject)=>{window.resolveStart=resolve;window.rejectStart=reject;});if(window.fail)throw new Error('Camera is busy');hass.states['camera.live'].state='streaming';}else hass.states['camera.live'].state='idle';}};
  window.card=document.createElement('dahoam-vacuum-card');card.setConfig({entity:'vacuum.test',live_camera_entity:'camera.live',show_map:false});card.hass=hass;
  // Match HA's manager: hass + showDialog BEFORE attaching the new component.
  card.addEventListener('show-dialog',e=>{events.push(e.detail);window.viewer ||= document.createElement(e.detail.dialogTag);viewer.hass=hass;viewer.showDialog(e.detail.dialogParams);document.body.append(viewer);});
  document.body.append(card);
 });
 const badge=page.locator('dahoam-vacuum-card [data-action="camera-open"]');
 const modal=page.locator('dahoam-vacuum-camera-dialog').last();
 const close=()=>page.evaluate(()=>{viewer.closeDialog();viewer.remove();});
 const reset=()=>page.evaluate(()=>{calls.length=0;hass.states['camera.live'].state='idle';window.waitStart=false;window.fail=false;window.waitHelpers=false;card.hass=hass;});
 await page.evaluate(()=>window.waitStart=true);
 await badge.click();
 assert.equal(await modal.locator('dialog').evaluate(e=>e.open),true);
 assert.equal(await modal.locator('.spinner').isVisible(),true);
 assert.match(await modal.locator('.message').innerText(),/gestartet/);
 assert.equal(await badge.getAttribute('aria-busy'),'true');
 await page.evaluate(()=>card._openCamera());assert.equal(await page.evaluate(()=>events.length),1);
 await page.screenshot({path:new URL(`../reports/camera-loading-${width}.png`,import.meta.url).pathname});
 await page.evaluate(()=>resolveStart());await page.waitForFunction(()=>!card._cameraBusy);
 assert.equal(await modal.locator('hui-picture-entity-card').count(),1);
 assert.deepEqual(await modal.locator('hui-picture-entity-card').evaluate(e=>e.config),{type:'picture-entity',entity:'camera.live',camera_view:'live',show_name:false,show_state:false,aspect_ratio:'16:9',fit_mode:'contain',tap_action:{action:'none'},hold_action:{action:'none'}});
 assert.equal(new URL(page.url()).pathname,'/');
 await page.evaluate(()=>{window.native=viewer._nativeCard;viewer.hass={...hass};});
 assert.equal(await page.evaluate(()=>viewer._nativeCard===native),true);
 assert.equal(await modal.locator('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true);
 await page.screenshot({path:new URL(`../reports/camera-live-${width}.png`,import.meta.url).pathname});
 await close();await page.waitForFunction(()=>!card._cameraBusy);
 assert.deepEqual(await page.evaluate(()=>calls.map(c=>c[1])),['turn_on','turn_off']);
 // Escape stops an owned session, but not one already running elsewhere.
 await reset();await page.evaluate(()=>hass.states['camera.live'].state='streaming');
 await badge.click();await page.waitForFunction(()=>!card._cameraBusy);await page.keyboard.press('Escape');
 assert.deepEqual(await page.evaluate(()=>calls),[]);await page.evaluate(()=>viewer.remove());
 // Closing while turn_on is pending never mounts video or leaves a late stream running.
 await reset();await page.evaluate(()=>window.waitStart=true);await badge.click();
 await close();assert.equal(await page.evaluate(()=>calls.length),1);
 await page.evaluate(()=>resolveStart());await page.waitForFunction(()=>!card._cameraBusy);
 assert.deepEqual(await page.evaluate(()=>calls.map(c=>c[1])),['turn_on','turn_off']);
 assert.equal(await page.evaluate(()=>viewer._nativeCard),undefined);
 // Closing while native helpers load cancels the wait and stops promptly.
 await reset();await page.evaluate(()=>window.waitHelpers=true);await badge.click();
 await page.waitForFunction(()=>!!window.resolveHelpers);await close();await page.waitForFunction(()=>!card._cameraBusy);
 assert.deepEqual(await page.evaluate(()=>calls.map(c=>c[1])),['turn_on','turn_off']);
 await page.evaluate(()=>resolveHelpers());
 // Backend error stays in the immediately opened viewer; retry starts a fresh session.
 await reset();await page.evaluate(()=>window.fail=true);await badge.click();await page.waitForFunction(()=>!card._cameraBusy);
 assert.match(await modal.locator('.message').innerText(),/Camera is busy/);
 assert.equal(await modal.locator('.retry').isVisible(),true);
 await page.evaluate(()=>window.fail=false);await modal.locator('.retry').click();await page.waitForFunction(()=>!card._cameraBusy);
 assert.equal(await modal.locator('hui-picture-entity-card').count(),1);await close();await page.waitForFunction(()=>!card._cameraBusy);
 // Navigation/disconnection performs the same owned-session cleanup.
 await reset();await badge.click();await page.waitForFunction(()=>!card._cameraBusy);
 await page.evaluate(()=>card.remove());await page.waitForFunction(()=>!card._cameraBusy);
 assert.deepEqual(await page.evaluate(()=>calls.map(c=>c[1])),['turn_on','turn_off']);
 await page.evaluate(()=>{viewer.remove();document.body.append(card);card.setConfig({entity:'vacuum.test',show_map:false});});assert.equal(await badge.count(),0);
 assert.deepEqual(errors,[]);await page.close();
}
await browser.close();console.log('Camera viewer: immediate feedback, native Picture Entity, stable renderer, desktop/mobile, owned cleanup, pending-start/helper dismissal, external stream, errors/retry and navigation passed');
