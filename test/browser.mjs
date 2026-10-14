import { chromium } from 'playwright-core';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE});
const page = await browser.newPage({viewport:{width:430,height:1250},deviceScaleFactor:1});
page.setDefaultTimeout(5000);
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.route('http://card.test/**', route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><style>body{margin:16px;background:#eef2f1;font:14px system-ui}dahoam-dreame-card{display:block;max-width:480px;margin:auto}</style>'}));
await page.route('http://card.test/api/camera_proxy/**', route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260"><rect x="20" y="20" width="350" height="210" rx="12" fill="#d3e7e1" stroke="#486c62" stroke-width="4"/><path d="M180 20V230M180 140H370" stroke="#486c62" stroke-width="4"/><text x="45" y="90" font-family="sans-serif" font-size="16">Testkarte</text></svg>'}));
if(process.env.DREAME_MAP_FIXTURE){const image=await readFile(process.env.DREAME_MAP_FIXTURE);await page.route('http://card.test/api/camera_proxy/**',route=>route.fulfill({contentType:'image/png',body:image}));}
await page.goto('http://card.test/');
await page.addScriptTag({content:await readFile(new URL('../dahoam-dreame-card.js',import.meta.url),'utf8'),type:'module'});
await page.evaluate(()=>{
 window.calls=[];
 window.hass={states:{
 'vacuum.test':{state:'docked',attributes:{friendly_name:'Winky',supported_features:31676,battery:100,cleaned_area:68,cleaning_time:102,cleaning_progress:0,selected_map:'Erdgeschoss',selected_map_id:3,rooms:{Erdgeschoss:[{id:1,name:'Bad'},{id:2,name:'Flur'},{id:6,name:'Wohnzimmer'}]},fan_speed_list:['silent','standard','strong','turbo'],fan_speed:'strong',main_brush_left:84,side_brush_left:76,filter_left:68,sensor_dirty_left:43,clean_water_tank_status:'Low water'}},
 'select.mode':{state:'sweeping',attributes:{options:['sweeping','mopping','sweeping_and_mopping','mopping_after_sweeping']}},
 'number.water':{state:'unavailable',attributes:{min:1,max:32,step:1}},
 'button.wash':{state:'unknown',attributes:{}},'button.dry':{state:'unknown',attributes:{}},'button.empty':{state:'unknown',attributes:{}}
 },services:{vacuum:Object.fromEntries(['start','pause','stop','return_to_base','set_fan_speed'].map(s=>[s,{}])),dreame_vacuum:{vacuum_clean_segment:{}},button:{press:{}},number:{set_value:{}},select:{select_option:{}}},callService:async(...args)=>{window.calls.push(args);if(args[0]==='select'){hass.states['select.mode'].state=args[2].option;hass.states['number.water'].state='10'}if(args[0]==='number')hass.states['number.water'].state=String(args[2].value)},hassUrl:path=>'http://card.test'+path};
 window.card=document.createElement('dahoam-dreame-card');card.setConfig({entity:'vacuum.test',name:'Winky',show_map:false,water_level_entity:'number.water',cleaning_mode_entity:'select.mode',wash_entity:'button.wash',dry_entity:'button.dry',empty_entity:'button.empty'});card.hass=hass;document.body.append(card);
});
const root=page.locator('dahoam-dreame-card');
const closePanel=async()=>{await page.evaluate(()=>card._closeFlyout(false));};
const openPanel=async(name)=>{await closePanel();await root.locator(`[data-action="panel-${name}"]`).click();};
await openPanel('rooms');
await root.locator('[data-room="1"]').click();await root.locator('[data-room="6"]').click();
await openPanel('rooms');
await root.locator('[data-action="rooms"]').click();
assert.deepEqual(await page.evaluate(()=>calls.at(-1)),['dreame_vacuum','vacuum_clean_segment',{entity_id:'vacuum.test',segments:[1,6],repeats:1}]);
const beforeMode=await page.evaluate(()=>calls.length);
await openPanel('settings');
await root.locator('[data-setting="mode"]').selectOption('sweeping_and_mopping');
assert.equal(await page.evaluate(()=>calls.length),beforeMode);
assert.equal(await root.locator('[data-setting="water"]').inputValue(),'14');
assert.equal(await root.locator('[data-setting="water"]').isDisabled(),false);
await openPanel('settings');
await root.locator('[data-setting="fan"]').selectOption('turbo');
assert.deepEqual(await page.evaluate(()=>calls.at(-1)),['vacuum','set_fan_speed',{entity_id:'vacuum.test',fan_speed:'turbo'}]);
await openPanel('dock');
await root.locator('[data-action="wash_entity"]').click();assert.equal(await page.evaluate(()=>calls.at(-1)[0]),'button');
await closePanel();
await root.locator('[data-action="start"]').click();
await page.waitForFunction(()=>!card._busy);
assert.deepEqual(await page.evaluate(()=>calls.slice(-3)),[
 ['select','select_option',{entity_id:'select.mode',option:'sweeping_and_mopping'}],
 ['number','set_value',{entity_id:'number.water',value:14}],
 ['vacuum','start',{entity_id:'vacuum.test'}]
]);
await openPanel('settings');
await root.locator('[data-setting="water"]').fill('18');
await openPanel('rooms');
await root.locator('[data-room="2"]').click();
await openPanel('rooms');
await root.locator('[data-action="rooms"]').click();await page.waitForFunction(()=>!card._busy);
assert.equal(await page.evaluate(()=>calls.at(-2)[2].value),18);
assert.equal(await page.evaluate(()=>calls.at(-1)[1]),'vacuum_clean_segment');
// Mode change can complete before the number entity becomes available.
await page.evaluate(()=>{hass.states['select.mode'].state='sweeping';hass.states['number.water'].state='unavailable';hass.callService=async(...args)=>{calls.push(args);if(args[0]==='select'){hass.states['select.mode'].state=args[2].option;setTimeout(()=>{hass.states['number.water'].state='10';card.hass={...hass}},150);}}});
await closePanel();
await root.locator('[data-action="start"]').click();await page.waitForFunction(()=>!card._busy);
assert.deepEqual(await page.evaluate(()=>calls.slice(-3).map(call=>call[0])),['select','number','vacuum']);
// Failed setup must never start a task.
await page.evaluate(()=>{hass.callService=async(...args)=>{calls.push(args);if(args[0]==='number')throw new Error('water setting failed')};card.hass={...hass}});
const callsBeforeFailure=await page.evaluate(()=>calls.length);
await closePanel();
await root.locator('[data-action="start"]').click();await page.waitForFunction(()=>!card._busy);
assert.equal(await page.evaluate(n=>calls.slice(n).some(call=>call[0]==='vacuum'),callsBeforeFailure),false);
await page.evaluate(()=>{hass.callService=async(...args)=>calls.push(args);card._error='';card._render()});
await page.evaluate(()=>{hass.states['vacuum.test'].state='cleaning';card.hass={...hass}});
await openPanel('rooms');
assert.equal(await root.locator('[data-action="rooms"]').isDisabled(),true);
await closePanel();
await root.locator('[data-action="pause"]').click();assert.equal(await page.evaluate(()=>calls.at(-1)[1]),'pause');
await page.evaluate(()=>{hass.states['vacuum.test'].attributes.selected_map='Upstairs';card.hass={...hass}});
assert.equal(await root.locator('[data-room]').count(),0);
await page.evaluate(()=>{hass.states['vacuum.test'].state='unavailable';card.hass={...hass}});
assert.equal(await root.locator('[data-action="start"]').isDisabled(),true);
await page.evaluate(()=>{hass.states['vacuum.test'].state='docked';hass.states['vacuum.test'].attributes.selected_map='Erdgeschoss';hass.callService=async()=>{throw new Error('<img src=x onerror=alert(1)>')};card.hass={...hass}});
await closePanel();
await root.locator('[data-action="start"]').click();
assert.equal(await root.locator('.error img').count(),0);assert.match(await root.locator('.error').innerText(),/onerror/);
await page.evaluate(()=>{hass.callService=async(...args)=>calls.push(args);card._error='';card.hass={...hass}});
await closePanel();
await mkdir(new URL('../reports/',import.meta.url),{recursive:true});
await page.screenshot({path:new URL('../reports/mobile.png',import.meta.url).pathname,fullPage:true});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await page.setViewportSize({width:1100,height:1100});
await page.screenshot({path:new URL('../reports/desktop.png',import.meta.url).pathname,fullPage:true});
// Map tokens are accepted only for HA's same-origin camera proxy.
await page.evaluate(()=>{hass.states['camera.map']={state:'ok',attributes:{updated_at:'2026-10-14T12:38:45',entity_picture:'https://evil.test/api/camera_proxy/x?token=secret'}};card.setConfig({entity:'vacuum.test',map_entity:'camera.map'});card.hass=hass});
assert.equal(await root.locator('.map img').count(),0);
await page.evaluate(()=>{hass.states['camera.map'].attributes.entity_picture='/api/camera_proxy/camera.map?token=example';card.hass={...hass}});
assert.equal(await root.locator('.map img').count(),1);
await root.locator('.map img').evaluate(img=>img.decode());
// A dashboard scroll container must keep its scroll position during HA updates.
await page.evaluate(()=>{
 const container=document.createElement('div');container.id='dashboard-scroll';container.style.cssText='height:500px;overflow:auto';
 const before=document.createElement('div');before.style.height='600px';
 const after=document.createElement('div');after.style.height='1600px';
 document.body.append(container);container.append(before,card,after);container.scrollTop=1150;
 window.scrollBefore=container.scrollTop;window.originalCard=card.shadowRoot.querySelector('ha-card');
 for(let i=0;i<20;i++){hass.states['vacuum.test'].attributes.battery=100-i;card.hass={...hass};}
});
assert.equal(await page.evaluate(()=>originalCard===card.shadowRoot.querySelector('ha-card')),true);
assert.equal(await page.evaluate(()=>document.querySelector('#dashboard-scroll').scrollTop),await page.evaluate(()=>scrollBefore));
await page.evaluate(()=>{const container=document.querySelector('#dashboard-scroll');document.body.append(card);container.remove();});
// Keep the loaded map node through state updates and room selection.
await page.evaluate(()=>{window.originalMap=card.shadowRoot.querySelector('.map img');card.hass={...hass}});
assert.equal(await page.evaluate(()=>originalMap===card.shadowRoot.querySelector('.map img')),true);
const beforeRefresh=await root.locator('.map img').getAttribute('src');
await root.locator('[data-action="refresh-map"]').click();
assert.notEqual(await root.locator('.map img').getAttribute('src'),beforeRefresh);
await root.locator('.map img').evaluate(img=>img.decode());
await root.locator('[data-action="zoom-in"]').click();
assert.equal(await page.evaluate(()=>card._zoom),1.5);
await root.locator('[data-action="zoom-out"]').click();
assert.equal(await page.evaluate(()=>card._zoom),1);
assert.match(await root.locator('.map-meta').innerText(),/2026-10-14 12:38:45/);
await page.setViewportSize({width:360,height:1250});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await page.screenshot({path:new URL('../reports/map-mobile.png',import.meta.url).pathname,fullPage:true});
await page.setViewportSize({width:1100,height:1500});
await page.screenshot({path:new URL('../reports/map-desktop.png',import.meta.url).pathname,fullPage:true});
// Verify a failed image can recover after another refresh.
await page.route('http://card.test/api/camera_proxy/**',route=>route.fulfill({status:503,body:'unavailable'}));
await root.locator('[data-action="refresh-map"]').click();
await root.locator('.placeholder').waitFor({state:'visible'});
assert.equal(await root.locator('.map img').isVisible(),false);
await page.unroute('http://card.test/api/camera_proxy/**');
await page.route('http://card.test/api/camera_proxy/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="blue"/></svg>'}));
await root.locator('[data-action="refresh-map"]').click();
await root.locator('.map img').evaluate(img=>img.decode());
assert.equal(await root.locator('.map img').isVisible(),true);
assert.equal(await root.locator('.placeholder').count(),0);
// Visual editor preserves keys it does not own.
assert.equal(await page.evaluate(()=>{const editor=customElements.get('dahoam-dreame-card').getConfigElement();editor.setConfig({type:'custom:dahoam-dreame-card',entity:'vacuum.test',grid_options:{columns:12}});editor.hass=hass;let config;editor.addEventListener('config-changed',e=>config=e.detail.config);editor.shadowRoot.querySelector('ha-form').dispatchEvent(new CustomEvent('value-changed',{detail:{value:{name:'New'}}}));return config.grid_options.columns}),12);
assert.deepEqual(errors,[]);
await browser.close();
console.log('Passed: compact rooms, stable page scrolling, staged vacuum+mop/water default 14, water-before-start sequencing and failure handling, room payloads, fan/dock commands, pause, map switching, unavailable state, escaped errors, mobile layout, camera URL isolation, editor preservation. Physical device commands were mocked.');
