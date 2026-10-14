import {chromium} from 'playwright-core';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
const code=await readFile(new URL('../dahoam-dreame-card.js',import.meta.url),'utf8');
for(const width of [1000,390]){
 const page=await browser.newPage({viewport:{width,height:850}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://card.test/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1">'}));
 await page.goto('http://card.test');await page.addScriptTag({content:code,type:'module'});
 await page.evaluate(()=>{
  window.calls=[];window.events=[];window.locationChanges=0;
  window.addEventListener('location-changed',()=>locationChanges++);
  window.hass={states:{'vacuum.test':{state:'docked',attributes:{supported_features:8192}},'camera.live':{state:'idle',attributes:{supported_features:1}}},services:{camera:{turn_on:{}}},callService:async(...args)=>{calls.push(args);if(window.fail)throw new Error('Camera is busy');hass.states['camera.live'].state='streaming';}};
  window.card=document.createElement('dahoam-vacuum-card');card.setConfig({entity:'vacuum.test',live_camera_entity:'camera.live',live_camera_path:'/dashboard-test/camera',show_map:false});card.hass=hass;card.addEventListener('hass-more-info',e=>events.push(e.detail));document.body.append(card);
 });
 const badge=page.locator('dahoam-vacuum-card [data-action="camera-open"]');
 assert.equal(await page.evaluate(()=>calls.length),0);
 await badge.click();await page.waitForFunction(()=>locationChanges===1);
 assert.equal(new URL(page.url()).pathname,'/dashboard-test/camera');
 assert.deepEqual(await page.evaluate(()=>calls),[['camera','turn_on',{entity_id:'camera.live'}]]);
 assert.equal(await page.evaluate(()=>card._isFlyoutOpen()),false);
 assert.equal(await page.locator('dahoam-vacuum-card [data-native-camera-host]').count(),0);
 // Existing stream opens without a duplicate start. The badge remains last.
 await badge.click();assert.equal(await page.evaluate(()=>calls.length),1);
 assert.equal(await page.locator('dahoam-vacuum-card .badges button').last().getAttribute('data-action'),'camera-open');
 // No configured panel uses HA's native more-info camera view.
 await page.evaluate(()=>card.setConfig({entity:'vacuum.test',live_camera_entity:'camera.live',show_map:false}));
 await badge.click();assert.deepEqual(await page.evaluate(()=>events),[{entityId:'camera.live'}]);
 // Startup failure stays on current page and shows the backend error.
 await page.evaluate(()=>{hass.states['camera.live'].state='idle';window.fail=true;card.hass=hass;events.length=0});
 await badge.click();await page.waitForFunction(()=>!card._cameraBusy);
 assert.equal(await page.evaluate(()=>events.length),0);
 assert.match(await page.locator('dahoam-vacuum-card .notice.error').innerText(),/Camera is busy/);
 // Cross-origin paths are rejected.
 assert.equal(await page.evaluate(()=>{try{card.setConfig({entity:'vacuum.test',live_camera_path:'//foreign.invalid/camera'});return false;}catch{return true;}}),true);
 await page.evaluate(()=>card.setConfig({entity:'vacuum.test',show_map:false}));assert.equal(await badge.count(),0);
 assert.deepEqual(errors,[]);await page.close();
}
await browser.close();console.log('Native camera navigation: desktop/mobile, automatic start, existing stream, native details fallback, failure handling and last badge passed');
