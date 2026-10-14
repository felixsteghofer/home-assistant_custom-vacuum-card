import { chromium } from 'playwright-core';
import { readFile,mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
const page=await browser.newPage({viewport:{width:390,height:1000}});
page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.route('http://card.test/**',route=>route.fulfill({contentType:'text/html',body:'<html><head><meta charset="utf-8"><style>body{font:14px system-ui;background:#eef2f1;margin:16px}dahoam-vacuum-card{display:block;max-width:440px;margin:auto}</style></head><body></body></html>'}));
const image=process.env.DOBBY_MAP_FIXTURE?await readFile(process.env.DOBBY_MAP_FIXTURE):null;
await page.route('http://card.test/api/camera_proxy/**',route=>route.fulfill(image?{contentType:'image/png',body:image}:{contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path fill="#90caff" d="M10 10H90V90H10Z"/></svg>'}));
await page.goto('http://card.test');
await page.addScriptTag({content:await readFile(new URL('../dahoam-dreame-card.js',import.meta.url),'utf8'),type:'module'});
await page.evaluate(()=>{
 const sensor=(state,unit)=>({state,attributes:{unit_of_measurement:unit}});
 window.calls=[];window.hass={states:{
 'vacuum.dobby':{state:'docked',attributes:{friendly_name:'Dobby',supported_features:12988,fan_speed_list:['min','low','medium','high','max'],fan_speed:'max'}},
 'camera.map':{state:'idle',attributes:{entity_picture:'/api/camera_proxy/camera.map?token=example'}},
 'sensor.battery':sensor('100','%'),'sensor.area':sensor('143975','cm²'),'sensor.time':sensor('976','seconds'),
 'sensor.brush':sensor('13469','minutes'),'sensor.filter':sensor('4469','minutes'),'sensor.side':sensor('7469','minutes'),'sensor.sensors':sensor('0','minutes'),
 'sensor.error':{state:'No error',attributes:{}},'switch.carpet':{state:'on',attributes:{}}
 },services:{vacuum:Object.fromEntries(['start','pause','stop','return_to_base','set_fan_speed','locate','clean_spot'].map(key=>[key,{}])),switch:{turn_on:{},turn_off:{}}},callService:async(...args)=>calls.push(args),hassUrl:path=>'http://card.test'+path};
 window.card=document.createElement('dahoam-vacuum-card');card.setConfig({entity:'vacuum.dobby',map_entity:'camera.map',battery_entity:'sensor.battery',area_entity:'sensor.area',time_entity:'sensor.time',error_entity:'sensor.error',main_brush_entity:'sensor.brush',filter_entity:'sensor.filter',side_brush_entity:'sensor.side',sensor_cleaning_entity:'sensor.sensors',carpet_mode_entity:'switch.carpet'});card.hass=hass;document.body.append(card);
});
const root=page.locator('dahoam-vacuum-card');
assert.equal(await root.locator('[data-action="panel-rooms"]').count(),0);
assert.equal(await root.locator('[data-action="panel-dock"]').count(),0);
assert.match(await root.locator('.battery').innerText(),/100%/);
assert.match(await root.locator('.stats').innerText(),/14.4 m²/);
assert.match(await root.locator('.stats').innerText(),/16.3 min/);
assert.equal(await root.locator('.progress').count(),0);
await root.locator('[data-action="panel-settings"]').click();
assert.equal(await root.locator('[data-setting="mode"]').count(),0);
assert.equal(await root.locator('[data-setting="water"]').count(),0);
assert.equal(await root.locator('[data-setting="fan"] option').count(),5);
await root.locator('[data-setting="fan"]').selectOption('medium');
assert.deepEqual(await page.evaluate(()=>calls.at(-1)),['vacuum','set_fan_speed',{entity_id:'vacuum.dobby',fan_speed:'medium'}]);
await root.locator('[data-action="carpet"]').click();
assert.deepEqual(await page.evaluate(()=>calls.at(-1)),['switch','turn_off',{entity_id:'switch.carpet'}]);
await page.evaluate(()=>card._closeFlyout(false));
await root.locator('[data-action="panel-tools"]').click();
await root.locator('[data-action="locate"]').click();
assert.deepEqual(await page.evaluate(()=>calls.at(-1)),['vacuum','locate',{entity_id:'vacuum.dobby'}]);
await root.locator('[data-action="clean_spot"]').click();
assert.deepEqual(await page.evaluate(()=>calls.at(-1)),['vacuum','clean_spot',{entity_id:'vacuum.dobby'}]);
await page.evaluate(()=>card._closeFlyout(false));
await root.locator('[data-action="panel-maintenance"]').click();
assert.match(await root.locator('.supplies').innerText(),/224.5 h/);
assert.match(await root.locator('.supplies').innerText(),/0 h/);
assert.equal(await root.locator('.supplies progress').count(),0);
await page.evaluate(()=>card._closeFlyout(false));
await root.locator('[data-action="start"]').click();assert.equal(await page.evaluate(()=>calls.at(-1)[1]),'start');
// Remove the underlying capabilities: no unsupported controls or blank maintenance remain.
await page.evaluate(()=>{hass.states['vacuum.dobby'].attributes.supported_features=8192;card.setConfig({entity:'vacuum.dobby'});card.hass={...hass}});
assert.equal(await root.locator('[data-action="panel-settings"]').count(),0);
assert.equal(await root.locator('[data-action="panel-tools"]').count(),0);
assert.equal(await root.locator('[data-action="panel-maintenance"]').count(),0);
assert.equal(await root.locator('[data-action="return_to_base"]').count(),0);
assert.equal(await root.locator('[data-action="stop"]').count(),0);
// Restore Dobby for a visual check and show a real sensor error without HTML injection.
await page.evaluate(()=>{card.setConfig({entity:'vacuum.dobby',map_entity:'camera.map',battery_entity:'sensor.battery',area_entity:'sensor.area',time_entity:'sensor.time',main_brush_entity:'sensor.brush',carpet_mode_entity:'switch.carpet',error_entity:'sensor.error'});hass.states['vacuum.dobby'].attributes.supported_features=12988;card.hass={...hass}});
await root.locator('.map img').evaluate(img=>img.decode());
await mkdir(new URL('../reports/',import.meta.url),{recursive:true});
await page.screenshot({path:new URL('../reports/dobby-mobile.png',import.meta.url).pathname,fullPage:true});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await root.locator('[data-action="panel-settings"]').click();
await page.screenshot({path:new URL('../reports/dobby-flyout.png',import.meta.url).pathname,fullPage:true});
// Escape dismisses and a popup stays usable across HA updates.
await page.evaluate(()=>{window.dialog=card.shadowRoot.querySelector('.flyout');hass.states['sensor.battery'].state='99';card.hass={...hass}});
assert.equal(await page.evaluate(()=>dialog===card.shadowRoot.querySelector('.flyout') && dialog.matches(':popover-open')),true);
await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>dialog.matches(':popover-open')),false);
await page.evaluate(()=>{hass.states['sensor.error'].state='<b>Wheel blocked</b>';card.hass={...hass}});
assert.match(await root.locator('.error').innerText(),/Wheel blocked/);assert.equal(await root.locator('.error b').count(),0);
assert.deepEqual(errors,[]);await browser.close();
console.log('Passed: Dobby capability gating, five speeds, carpet mode, locate/spot commands, sensor unit conversions, consumable hours, error display, flyout stability and Escape dismissal. Commands mocked.');
