import {chromium} from 'playwright-core';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
const code=await readFile(new URL('../dahoam-dreame-card.js',import.meta.url),'utf8');
for(const width of [1000,390]){
 const page=await browser.newPage({viewport:{width,height:850}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://card.test/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:12px}dahoam-vacuum-card{display:block;max-width:410px;margin:auto}</style><button id="outside">Outside</button>'}));
 await page.route('http://card.test/api/camera_proxy_stream/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="356"><rect width="640" height="356" fill="navy"/></svg>'}));
 await page.goto('http://card.test');await page.addScriptTag({content:code,type:'module'});
 await page.evaluate(()=>{
  window.nativeConfigs=[];
  customElements.define('test-native-camera',class extends HTMLElement {set hass(value){this.currentHass=value;}});
  window.loadCardHelpers=async()=>({createCardElement:config=>{nativeConfigs.push(config);return document.createElement('test-native-camera')}});
  window.calls=[];window.hass={states:{'vacuum.test':{state:'docked',attributes:{supported_features:8192,fan_speed_list:['quiet'],friendly_name:'Winky'}},'camera.live':{state:'idle',attributes:{supported_features:1,entity_picture:'/api/camera_proxy/camera.live?token=example',max_duration:120}}},services:{vacuum:{start:{}},camera:{turn_on:{},turn_off:{}}},hassUrl:p=>'http://card.test'+p,callService:async(d,s,data)=>{calls.push([d,s,data]);if(d==='camera'){if(window.holdStart && s==='turn_on')await new Promise(r=>window.finishStart=r);hass.states['camera.live'].state=s==='turn_on'?'streaming':'idle';card.hass={...hass};}}};
  window.card=document.createElement('dahoam-vacuum-card');card.setConfig({entity:'vacuum.test',live_camera_entity:'camera.live',show_map:false});card.hass=hass;document.body.append(card);
 });
 const root=page.locator('dahoam-vacuum-card'),badge=root.locator('[data-action="panel-camera"]');
 await badge.click();assert.equal(await page.evaluate(()=>calls.length),0);assert.equal(await root.locator('test-native-camera').count(),0);
 await root.locator('[data-action="camera-start"]').click();await root.locator('test-native-camera').waitFor({state:'attached'});assert.deepEqual(await page.evaluate(()=>nativeConfigs[0]),{type:'picture-entity',entity:'camera.live',camera_view:'live',show_name:false,show_state:false,fit_mode:'contain',tap_action:{action:'more-info'}});
 assert.equal(await page.evaluate(()=>calls[0][1]),'turn_on');
 // Entity updates preserve the live image node and URL instead of reconnecting.
 assert.equal(await page.evaluate(()=>{const i=card.shadowRoot.querySelector('test-native-camera');card.hass={...hass};return i===card.shadowRoot.querySelector('test-native-camera')}),true);
 const box=await root.locator('.flyout').boundingBox();assert.ok(box.x>=0 && box.x+box.width<=width);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>calls.some(c=>c[1]==='turn_off'));
 assert.equal(await root.locator('test-native-camera').count(),0);assert.equal(await page.evaluate(()=>hass.states['camera.live'].state),'idle');
 // A stream that was already running is viewable but not owned or stopped on close.
 await page.evaluate(()=>{hass.states['camera.live'].state='streaming';card.hass={...hass};calls.length=0});
 await badge.click();await page.locator('#outside').click();assert.equal(await page.evaluate(()=>calls.length),0);
 // Pending start + dismissal still explicitly queues stop; no hidden stream is attached.
 await page.evaluate(()=>{hass.states['camera.live'].state='idle';window.holdStart=true;card.hass={...hass}});
 await badge.click();await root.locator('[data-action="camera-start"]').click();await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>calls.at(-1)[1]),'turn_off');
 // Mock the backend's serialized stop completing after pending startup.
 await page.evaluate(()=>{finishStart();window.holdStart=false});await page.waitForFunction(()=>!card._cameraBusy);
 assert.equal(await root.locator('test-native-camera').count(),0);
 // The parent never constructs a media URL or stores camera tokens.
 assert.equal(await page.evaluate(()=>typeof card._liveURL),'undefined');
 assert.equal(await page.evaluate(()=>nativeConfigs.every(c=>!('image' in c) && !('url' in c))),true);
 // No configured camera means no camera badge; vacuum behavior remains independent.
 await page.evaluate(()=>{card.setConfig({entity:'vacuum.test',show_map:false});card.hass=hass});
 assert.equal(await badge.count(),0);assert.deepEqual(errors,[]);await page.close();
}
await browser.close();console.log('Camera flyout: desktop/mobile, start/close, pending startup, ownership, native card configuration, lifecycle and stable instance passed');
