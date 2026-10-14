/** Dahoam Vacuum Card v1.8.0 — independent implementation, MIT. */
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const available = entity => entity && !['unknown', 'unavailable'].includes(entity.state);
const validNumber = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const measure = (value, unit = '') => validNumber(value) ? `${Number(value)}${unit}` : '—';
// Stable reconciliation keeps scroll anchors, focus, open selects and the map connected.
const nodeKey = node => node.nodeType === 1 ? ['data-key','data-action','data-setting','data-room','value'].map(key => node.hasAttribute(key) ? `${node.nodeName}:${key}:${node.getAttribute(key)}` : '').find(Boolean) : undefined;
function syncChildren(parent, desired) {
  let cursor = parent.firstChild;
  for (const next of [...desired.childNodes]) {
    const key = nodeKey(next);
    let current = [...parent.childNodes].find(node => !node._dcMatched && node.nodeType === next.nodeType && node.nodeName === next.nodeName && (key ? nodeKey(node) === key : !nodeKey(node)));
    if (!current) { current = next.cloneNode(true); parent.insertBefore(current, cursor); }
    else {
      if (current !== cursor) parent.insertBefore(current, cursor);
      if (current.nodeType === 1) {
        for (const attr of [...current.attributes]) if (!next.hasAttribute(attr.name)) current.removeAttribute(attr.name);
        for (const attr of [...next.attributes]) if (current.getAttribute(attr.name) !== attr.value) current.setAttribute(attr.name, attr.value);
        syncChildren(current, next);
        if (current instanceof HTMLSelectElement && current.value !== next.value) current.value = next.value;
        if (current instanceof HTMLInputElement && current.value !== next.value && current.getRootNode().activeElement !== current) current.value = next.value;
      } else if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    }
    current._dcMatched = true; cursor = current.nextSibling;
  }
  for (const node of [...parent.childNodes]) { if (!node._dcMatched) node.remove(); else delete node._dcMatched; }
}
const styles = `
:host{display:block;--accent:var(--primary-color,#03a9f4);--soft:color-mix(in srgb,var(--accent) 10%,var(--card-background-color,#fff));--line:var(--divider-color,#e0e0e0)}*{box-sizing:border-box}
ha-card{display:block;overflow:hidden;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#212121);border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--line));border-radius:var(--ha-card-border-radius,12px);box-shadow:var(--ha-card-box-shadow,none);font-family:var(--ha-font-family-body,var(--primary-font-family,inherit))}
header{display:flex;align-items:center;gap:12px;padding:16px}.robot{display:grid;place-items:center;flex-shrink:0;width:40px;height:40px;border-radius:50%;background:var(--soft);color:var(--accent)}.robot ha-icon{--mdc-icon-size:24px}.title{flex:1;min-width:0}h2{font-size:16px;line-height:24px;font-weight:500;margin:0}.sub{font-size:13px;line-height:20px;color:var(--secondary-text-color,#727272)}.battery{display:flex;align-items:center;gap:4px;font-size:12px;color:var(--secondary-text-color,#727272)}.battery ha-icon{--mdc-icon-size:18px}
.muted{font-size:11px;color:var(--secondary-text-color,#727272)}.map{margin:0 12px;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--secondary-background-color,#f5f5f5)}.map-tools,.map-meta{display:flex;align-items:center;gap:4px;padding:4px 8px}.map-tools{justify-content:flex-end}.map-label{margin-right:auto;font-size:12px;display:flex;align-items:center;gap:5px}.map-label ha-icon{--mdc-icon-size:16px;color:var(--secondary-text-color,#727272)}.map-tools button{min-height:32px;min-width:32px;padding:4px;border:0;background:transparent}.map-tools .zoom-reset{min-width:44px;font-size:11px}.map-viewport{position:relative;height:300px;overflow:auto;touch-action:pan-x pan-y;overscroll-behavior:auto;user-select:none;scrollbar-width:thin}.map-viewport:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}.map-viewport[data-dragging]{cursor:grabbing}.map-viewport[data-zoomed]{cursor:grab}.map img{display:block;max-width:none;object-fit:contain;pointer-events:none;user-select:none;-webkit-user-drag:none}.map img[hidden]{display:none}.placeholder{display:grid;place-items:center;min-height:220px;padding:20px;font-size:12px;color:var(--secondary-text-color,#727272);text-align:center}.map-meta{justify-content:space-between;flex-wrap:wrap;border-top:1px solid var(--line);font-size:10px;color:var(--secondary-text-color,#727272)}.map-meta button{min-height:28px;font-size:10px;padding:2px 4px;border:0;background:transparent}.map-meta ha-icon{--mdc-icon-size:14px}.map-help{font-size:10px;color:var(--secondary-text-color,#727272);padding:3px 8px 6px;line-height:14px}.map-help:empty{display:none}
.stats{display:flex;gap:8px;margin:12px 16px}.stat{flex:1;text-align:center}.value{font-size:18px;line-height:24px;font-weight:500;margin-bottom:2px}.controls{display:flex;gap:8px;padding:0 16px 12px}.controls button{min-height:40px}.progress{height:3px;background:var(--line);margin:0 16px;border-radius:3px;overflow:hidden}.progress span{display:block;height:100%;background:var(--accent)}
button,select{font:inherit;color:inherit;border:1px solid var(--line);background:transparent;border-radius:8px;min-height:40px;padding:8px 12px;cursor:pointer}button{display:inline-flex;align-items:center;justify-content:center;gap:6px}button:hover{background:var(--soft)}button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}button:disabled,select:disabled,input:disabled{opacity:.4;cursor:default}.primary{background:var(--accent);border-color:transparent;color:var(--text-primary-color,#fff);font-weight:500;flex:1}.primary:hover{background:var(--accent);filter:brightness(.95)}ha-icon{--mdc-icon-size:20px}
.badges{display:flex;gap:6px;flex-wrap:wrap;padding:10px 16px 6px}.badge{min-height:32px;padding:4px 9px;border-radius:16px;background:var(--secondary-background-color,#f5f5f5);border-color:transparent;font-size:12px;gap:5px}.badge[aria-expanded=true]{background:var(--soft);color:var(--accent)}.badge ha-icon{--mdc-icon-size:16px}.chevron{font-size:12px;opacity:.65}
.flyout{position:fixed;inset:auto;margin:0;padding:0;width:min(340px,calc(100vw - 16px));max-height:min(70dvh,480px);overflow:auto;color:var(--primary-text-color,#212121);background:var(--card-background-color,#fff);border:1px solid var(--line);border-radius:12px;box-shadow:0 4px 16px #0003;font-family:var(--ha-font-family-body,var(--primary-font-family,inherit));z-index:10}.flyout::backdrop{background:transparent;pointer-events:none}.flyout-title{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;font-size:14px}.flyout-title strong{font-weight:500}.flyout-title button{min-height:32px;min-width:32px;padding:4px;border:0}.flyout section{padding:12px;border-top:1px solid var(--line)}.section-title{display:flex;justify-content:space-between;font-size:12px;color:var(--secondary-text-color,#727272);margin-bottom:8px}.rooms{display:flex;flex-wrap:wrap;gap:6px}.room{min-height:34px;padding:5px 8px;font-size:12px;gap:4px;border-radius:8px}.room ha-icon{--mdc-icon-size:16px}.room[aria-pressed=true]{color:var(--accent);background:var(--soft);border-color:var(--accent)}.room-selection{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.room-selection .section-title{margin:0}.room-selection button{min-height:34px;padding:5px 8px;font-size:12px}.room-tools{display:flex;gap:6px;margin-top:12px}.room-tools button{min-height:36px;font-size:12px}.room-tools .primary{flex:1}.settings{display:grid;grid-template-columns:1fr 1fr;gap:12px}label{display:grid;gap:6px;font-size:12px;color:var(--secondary-text-color,#727272)}select{width:100%;min-width:0;min-height:40px;font-size:13px;color:var(--primary-text-color,#212121);background:var(--card-background-color,#fff)}.water,.carpet-setting,.water-hint{grid-column:1/-1}.water-top,.carpet-setting{display:flex;align-items:center;justify-content:space-between;gap:8px}.water input{width:100%;accent-color:var(--accent);margin:5px 0}.water output{color:var(--primary-text-color,#212121);font-weight:500}.water-hint{font-size:11px;line-height:16px;color:var(--secondary-text-color,#727272)}.carpet-setting{font-size:13px}.carpet-setting button{min-height:34px;padding:4px 12px}.carpet-setting button[aria-checked=true]{color:var(--accent);background:var(--soft)}.dock{display:flex;gap:8px}.dock button{flex:1;flex-direction:column;font-size:12px;padding:10px 4px;min-height:60px}.dock ha-icon{color:var(--accent)}.supplies{display:grid;grid-template-columns:1fr 1fr;gap:12px}.supply{font-size:12px}.supply progress{display:block;width:100%;height:5px;accent-color:var(--accent);margin-top:6px}

.notice{margin:0 16px 12px;padding:8px 10px;border-radius:8px;background:color-mix(in srgb,var(--warning-color,#ff9800) 10%,transparent);font-size:12px;line-height:18px}.error{color:var(--error-color,#db4437)}footer{padding:0 12px 6px;text-align:right}footer button{min-height:28px;padding:4px;border:0;font-size:11px;color:var(--secondary-text-color,#727272)}
@media(max-width:380px){.map-viewport{height:280px}.controls button{font-size:12px;padding:8px 10px}.badge{font-size:11px}.settings{gap:8px}}
@media(prefers-reduced-motion:no-preference){button{transition:background .12s}}
`;

class DahoamDreameCard extends HTMLElement {
  constructor() {
    super(); this.attachShadow({mode:'open'}); this._selected = new Set(); this._busy = false; this._zoom = 1; this._refreshSerial = 0;
    this.shadowRoot.addEventListener('click', event => {
      const button=event.target.closest?.('button');if(!button || button.disabled)return;
      if(button.dataset.action){if(button.dataset.action.startsWith('panel-'))event.preventDefault();this._act(button.dataset.action,event.detail===0);}
      else if(button.dataset.room){const id=Number(button.dataset.room);this._selected.has(id)?this._selected.delete(id):this._selected.add(id);this._render();}
    });
    this.shadowRoot.addEventListener('keydown',event=>{if(event.key==='Escape' && this._isFlyoutOpen() && !event.defaultPrevented){event.preventDefault();this._closeFlyout();}});
    this.shadowRoot.addEventListener('change', event => {if(event.target.dataset.setting)this._setting(event.target.dataset.setting,event.target.value);});
    this.shadowRoot.addEventListener('input', event => {if(event.target.dataset.setting==='water'){this._draftWater=Number(event.target.value);this.shadowRoot.querySelector('[data-water-output]').textContent=event.target.value;}});
  }
  static getConfigElement() { return document.createElement('dahoam-dreame-card-editor'); }
  static getStubConfig(hass) {
    const id = Object.keys(hass?.states || {}).find(id => id.startsWith('vacuum.') && hass.states[id].attributes.device_class === 'dreame_vacuum');
    return {entity:id || Object.keys(hass?.states || {}).find(id=>id.startsWith('vacuum.')) || '', show_map:true};
  }
  setConfig(config) {
    if (!/^vacuum\.[a-z0-9_]+$/.test(config.entity || '')) throw new Error('Please select a vacuum entity.');
    for (const [key, domain] of Object.entries({map_entity:'camera',live_camera_entity:'camera',cleaning_mode_entity:'select',water_level_entity:'number',battery_entity:'sensor',area_entity:'sensor',time_entity:'sensor',error_entity:'sensor',main_brush_entity:'sensor',side_brush_entity:'sensor',filter_entity:'sensor',sensor_cleaning_entity:'sensor',carpet_mode_entity:'switch',wash_entity:'button',dry_entity:'button',empty_entity:'button'})) {
      if (config[key] && !new RegExp(`^${domain}\\.[a-z0-9_]+$`).test(config[key])) throw new Error(`${key} must be a ${domain} entity.`);
    }
    if(config.live_camera_path && (!/^\/(?!\/)/.test(config.live_camera_path) || /[?#]/.test(config.live_camera_path)))throw new Error('live_camera_path must be a local dashboard path.');
    if (config.repeats !== undefined && ![1,2,3].includes(config.repeats)) throw new Error('repeats must be 1, 2 or 3.');
    if(config.default_water_level !== undefined && (!Number.isInteger(config.default_water_level) || config.default_water_level<1 || config.default_water_level>32))throw new Error('default_water_level must be an integer from 1 to 32.');
    this._draftMode=undefined;this._draftWater=config.default_water_level ?? 14;
    this._zoom=1;this._pinch=undefined;this._mouseDrag=undefined;
    this._closeFlyout(false);
    this._config = {...config}; this._selected.clear(); this._mapKey = undefined; this._error = ''; this._render();
  }
  set hass(hass) { this._hass = hass; this._render(); }
  getCardSize() { return this._config?.show_map === false ? 8 : 13; }
  getGridOptions() { return {columns:12, min_columns:6}; }
  connectedCallback() {
    this._reposition ||= ()=>{if(this._isFlyoutOpen() && !this._positionFrame)this._positionFrame=requestAnimationFrame(()=>{this._positionFrame=undefined;this._positionFlyout();});};
    window.addEventListener('resize',this._reposition);window.addEventListener('scroll',this._reposition,true);window.visualViewport?.addEventListener('resize',this._reposition);window.visualViewport?.addEventListener('scroll',this._reposition);
    clearInterval(this._timer);
    this._timer = setInterval(() => {
      const interval = this._entity('entity')?.state === 'cleaning' ? 10000 : 30000;
      if (!document.hidden && Date.now() - (this._lastRefresh || 0) >= interval) this._refreshMap();
    }, 5000);
    this._render();
  }
  disconnectedCallback() {clearInterval(this._timer);cancelAnimationFrame(this._positionFrame);this._positionFrame=undefined;this._closeFlyout(false);window.removeEventListener('resize',this._reposition);window.removeEventListener('scroll',this._reposition,true);window.visualViewport?.removeEventListener('resize',this._reposition);window.visualViewport?.removeEventListener('scroll',this._reposition);}
  _entity(key) { return this._hass?.states[this._config?.[key]]; }
  _hasService(domain, service) { return !!this._hass?.services?.[domain]?.[service]; }
  _supports(action) {
    const bit={start:8192,pause:4,stop:8,return_to_base:16,set_fan_speed:32,locate:512,clean_spot:128}[action];
    return !!(Number(this._entity('entity')?.attributes.supported_features) & bit) && this._hasService('vacuum',action);
  }
  _isFlyoutOpen() {
    const flyout=this.shadowRoot.querySelector('.flyout');
    return !!flyout && (typeof flyout.showPopover==='function' ? flyout.matches(':popover-open') : !flyout.hidden);
  }
  _updateBadges() {
    for(const button of this.shadowRoot.querySelectorAll('[data-action^="panel-"]'))button.setAttribute('aria-expanded',String(this._isFlyoutOpen() && button.dataset.action===`panel-${this._panel}`));
  }
  _openFlyout(panel,keyboard=false) {
    if(this._panel===panel && this._isFlyoutOpen()){this._closeFlyout();return;}
    this._panel=panel;this._anchor=this.shadowRoot.querySelector(`[data-action="panel-${panel}"]`);
    if(!this._anchor)return;
    this._render();const flyout=this.shadowRoot.querySelector('.flyout');
    if(typeof flyout.showPopover==='function') {if(!flyout.matches(':popover-open'))flyout.showPopover({source:this._anchor});}
    else {
      flyout.hidden=false;
      this._fallbackOutside ||= event=>{const path=event.composedPath();if(!path.includes(flyout) && !path.includes(this._anchor))this._closeFlyout(false);};
      this._fallbackEscape ||= event=>{if(event.key==='Escape')this._closeFlyout();};
      document.addEventListener('pointerdown',this._fallbackOutside,true);document.addEventListener('keydown',this._fallbackEscape);
    }
    this._positionFlyout();this._updateBadges();
    if(keyboard)flyout.querySelector('select,input,button:not([data-action="close-panel"]):not(:disabled)')?.focus({preventScroll:true});
  }
  _closeFlyout(restoreFocus=true) {
    const flyout=this.shadowRoot.querySelector('.flyout'),anchor=this._anchor;
    if(flyout){if(typeof flyout.hidePopover==='function'){if(flyout.matches(':popover-open'))flyout.hidePopover();}else flyout.hidden=true;}
    document.removeEventListener('pointerdown',this._fallbackOutside,true);document.removeEventListener('keydown',this._fallbackEscape);
    this._panel=undefined;this._anchor=undefined;this._updateBadges();
    if(restoreFocus && anchor?.isConnected)anchor.focus({preventScroll:true});
  }
  _positionFlyout() {
    if(!this._isFlyoutOpen())return;
    const flyout=this.shadowRoot.querySelector('.flyout'),anchor=this._anchor;
    if(!anchor?.isConnected){this._closeFlyout(false);return;}
    const v=window.visualViewport,bounds={left:v?.offsetLeft || 0,top:v?.offsetTop || 0,width:v?.width || innerWidth,height:v?.height || innerHeight};
    const rect=anchor.getBoundingClientRect(),bottom=bounds.top+bounds.height,right=bounds.left+bounds.width;
    if(rect.bottom<bounds.top || rect.top>bottom){this._closeFlyout(false);return;}
    const below=bottom-rect.bottom-14,above=rect.top-bounds.top-14;
    flyout.style.width=`${Math.min(340,bounds.width-16)}px`;
    flyout.style.maxHeight=`${Math.max(80,Math.min(480,Math.max(below,above)))}px`;
    const box=flyout.getBoundingClientRect();
    const top=below>=box.height || below>=above ? rect.bottom+6 : rect.top-box.height-6;
    flyout.style.left=`${Math.max(bounds.left+8,Math.min(rect.left,right-box.width-8))}px`;
    flyout.style.top=`${Math.max(bounds.top+8,Math.min(top,bottom-box.height-8))}px`;
  }
  _setMapZoom(value,clientX,clientY,contentPoint) {
    const viewport=this.shadowRoot.querySelector('.map-viewport'),img=viewport?.querySelector('img');
    if(!img)return;
    const rect=viewport.getBoundingClientRect(),old=this._zoom;
    const x=clientX===undefined?viewport.clientWidth/2:clientX-rect.left,y=clientY===undefined?viewport.clientHeight/2:clientY-rect.top;
    const point=contentPoint || {x:(viewport.scrollLeft+x)/old,y:(viewport.scrollTop+y)/old};
    this._zoom=Math.max(1,Math.min(5,value));
    img.style.width=`${this._zoom*100}%`;img.style.height=`${this._zoom*100}%`;
    viewport.scrollLeft=point.x*this._zoom-x;viewport.scrollTop=point.y*this._zoom-y;
    viewport.toggleAttribute('data-zoomed',this._zoom>1);
    const reset=this.shadowRoot.querySelector('[data-action="zoom-reset"]');
    if(reset){reset.textContent=`${Math.round(this._zoom*100)}%`;reset.setAttribute('aria-label',`Kartenansicht zurücksetzen, ${Math.round(this._zoom*100)} Prozent`);}
    for(const [action,disabled] of [['zoom-in',this._zoom>=5],['zoom-out',this._zoom<=1]]){const button=this.shadowRoot.querySelector(`[data-action="${action}"]`);if(button)button.disabled=disabled;}
  }
  _bindMap() {
    const viewport=this.shadowRoot.querySelector('.map-viewport');
    if(!viewport || viewport._dcGestures)return;viewport._dcGestures=true;
    viewport.addEventListener('wheel',event=>{
      if(!event.ctrlKey && !event.metaKey && this.shadowRoot.activeElement!==viewport)return;
      const unit=event.deltaMode===1?16:event.deltaMode===2?viewport.clientHeight:1;
      const delta=Math.max(-150,Math.min(150,event.deltaY*unit));
      const zoom=Math.max(1,Math.min(5,this._zoom*Math.exp(-delta*.002)));
      if(zoom===this._zoom || !event.cancelable)return;
      event.preventDefault();this._setMapZoom(zoom,event.clientX,event.clientY);
    },{passive:false});
    const touchInfo=touches=>({x:(touches[0].clientX+touches[1].clientX)/2,y:(touches[0].clientY+touches[1].clientY)/2,distance:Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY)});
    viewport.addEventListener('touchstart',event=>{
      if(event.touches.length<2){this._pinch=undefined;return;}
      if(event.cancelable)event.preventDefault();
      const touch=touchInfo(event.touches),rect=viewport.getBoundingClientRect();
      this._pinch={zoom:this._zoom,distance:Math.max(1,touch.distance),point:{x:(viewport.scrollLeft+touch.x-rect.left)/this._zoom,y:(viewport.scrollTop+touch.y-rect.top)/this._zoom}};
    },{passive:false});
    viewport.addEventListener('touchmove',event=>{
      if(event.touches.length<2 || !this._pinch)return;
      if(event.cancelable)event.preventDefault();
      const touch=touchInfo(event.touches);this._setMapZoom(this._pinch.zoom*touch.distance/this._pinch.distance,touch.x,touch.y,this._pinch.point);
    },{passive:false});
    for(const name of ['touchend','touchcancel'])viewport.addEventListener(name,event=>{if(event.touches.length<2)this._pinch=undefined;},{passive:true});
    viewport.addEventListener('pointerdown',event=>{
      if(event.pointerType!=='mouse' || event.button!==0)return;
      viewport.focus({preventScroll:true});
      if(this._zoom<=1)return;
      event.preventDefault();this._mouseDrag={id:event.pointerId,x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
      viewport.setPointerCapture(event.pointerId);viewport.setAttribute('data-dragging','');
    });
    viewport.addEventListener('pointermove',event=>{const drag=this._mouseDrag;if(!drag || drag.id!==event.pointerId)return;viewport.scrollLeft=drag.left-(event.clientX-drag.x);viewport.scrollTop=drag.top-(event.clientY-drag.y);});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(name,()=>{this._mouseDrag=undefined;viewport.removeAttribute('data-dragging');});
    viewport.addEventListener('keydown',event=>{
      if(event.ctrlKey || event.metaKey || event.altKey)return;
      if(['+','=','-','0'].includes(event.key)){event.preventDefault();this._setMapZoom(event.key==='0'?1:this._zoom+(event.key==='-'?-.5:.5));}
      else if(this._zoom>1 && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();viewport.scrollBy({left:event.key==='ArrowLeft'?-40:event.key==='ArrowRight'?40:0,top:event.key==='ArrowUp'?-40:event.key==='ArrowDown'?40:0});}
      else if(event.key==='Escape')viewport.blur();
    });
  }
  _metric(key,attribute,kind) {
    const entity=this._entity(key), raw=entity ? (available(entity)?entity.state:undefined) : this._entity('entity')?.attributes[attribute];
    if(!validNumber(raw))return undefined;
    let value=Number(raw),unit=entity?.attributes.unit_of_measurement;
    if(kind==='area' && unit==='cm²')value/=10000;
    if(kind==='area' && unit==='mm²')value/=1000000;
    if(kind==='time' && ['seconds','s'].includes(unit))value/=60;
    if(kind==='time' && ['h','hours'].includes(unit))value*=60;
    return Math.round(value*10)/10;
  }
  _supplies() {
    return [['main_brush_entity','main_brush_left','Hauptbürste'],['side_brush_entity','side_brush_left','Seitenbürste'],['filter_entity','filter_left','Filter'],['sensor_cleaning_entity','sensor_dirty_left','Sensoren']].flatMap(([key,attr,label])=>{
      const entity=this._entity(key),raw=entity?(available(entity)?entity.state:undefined):this._entity('entity')?.attributes[attr];
      if(!validNumber(raw))return [];
      const unit=entity?.attributes.unit_of_measurement || '%';let value=Number(raw),displayUnit=unit;
      if(['minutes','min'].includes(unit)){value/=60;displayUnit='h';}
      return [{label,value:Math.round(value*10)/10,unit:displayUnit,percent:displayUnit==='%'}];
    });
  }
  _rooms(attributes) {
    const key = `${attributes.selected_map_id ?? ''}:${attributes.selected_map ?? ''}`;
    if (this._mapKey !== key) { this._selected.clear(); this._mapKey = key; }
    const rooms = attributes.rooms?.[attributes.selected_map];
    const result = Array.isArray(rooms) ? rooms.filter(room => Number.isInteger(room.id) && room.id > 0) : [];
    const ids = new Set(result.map(room => room.id));
    for (const id of this._selected) if (!ids.has(id)) this._selected.delete(id);
    return result;
  }
  _mapURL() {
    const entity = this._entity('map_entity');
    if (!available(entity)) return '';
    const raw = entity.attributes.entity_picture;
    if (!raw || !this._hass) return '';
    // Only use HA's camera proxy. Never send a camera token to another origin.
    try {
      const base = new URL(this._hass.hassUrl ? this._hass.hassUrl('/') : location.origin);
      const url = new URL(raw, base);
      if (url.origin !== base.origin || !url.pathname.startsWith('/api/camera_proxy/')) return '';
      url.searchParams.set('_dc', `${entity.last_updated || ''}:${this._refreshSerial}`);
      return url.href;
    } catch { return ''; }
  }
  async _openCamera() {
    const camera=this._entity('live_camera_entity');
    if(this._cameraBusy || !available(camera))return;
    this._closeFlyout(false);
    this._cameraBusy=true;this._error='';this._render();
    try {
      if(camera.state!=='streaming') {
        if(!(Number(camera.attributes.supported_features)&1) || !this._hasService('camera','turn_on'))throw new Error('Kamera kann nicht gestartet werden.');
        await this._hass.callService('camera','turn_on',{entity_id:this._config.live_camera_entity});
      }
      if(this._config.live_camera_path){
        history.pushState(null,'',this._config.live_camera_path);
        window.dispatchEvent(new Event('location-changed'));
      } else {
        this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:this._config.live_camera_entity}}));
      }
    } catch(error){this._error=error?.message || 'Kamera konnte nicht gestartet werden';}
    finally {this._cameraBusy=false;this._render();}
  }
  _refreshMap() {
    this._refreshSerial++; this._lastRefresh = Date.now();
    const img = this.shadowRoot.querySelector('.map img');
    const url = this._mapURL();
    if (img && url && img.src !== url) { img.hidden = false; img.src = url; }
  }
  _mapDate() {
    const raw = this._entity('map_entity')?.attributes.updated_at;
    if (!raw) return 'Zeitpunkt der Kartendaten unbekannt';
    // Backend exposes a timezone-less map timestamp: display it verbatim.
    return `Kartendaten: ${String(raw).replace('T', ' ').slice(0, 19)}`;
  }
  _badge(panel,icon,label){return `<button class="badge" data-action="panel-${panel}" aria-haspopup="dialog" aria-expanded="${this._panel===panel && this._isFlyoutOpen()}" aria-controls="dc-flyout" popovertarget="dc-flyout"><ha-icon icon="mdi:${icon}"></ha-icon>${esc(label)}<span class="chevron">⌄</span></button>`;}
  _button(action, icon, label, disabled = false, cls = '') {
    return `<button data-action="${esc(action)}" class="${cls}" ${disabled || this._busy ? 'disabled' : ''}><ha-icon icon="mdi:${icon}"></ha-icon>${esc(label)}</button>`;
  }
  _render() {
    if (!this._config || !this._hass) return;
    const state = this._entity('entity');
    const a = state?.attributes || {}, online = available(state);
    const battery=this._metric('battery_entity','battery'),area=this._metric('area_entity','cleaned_area','area'),time=this._metric('time_entity','cleaning_time','time');
    const supplies=this._supplies(),carpet=this._entity('carpet_mode_entity');
    const errorEntity=this._entity('error_entity');
    const deviceError=available(errorEntity) && !['No error','none','ok','0',''].includes(errorEntity.state) ? errorEntity.attributes.message || errorEntity.state : undefined;
    const rooms = this._rooms(a), running = state?.state === 'cleaning';
    const can = service => online && this._supports(service);
    const map = this._config.show_map !== false && this._config.map_entity;
    const url = map ? this._mapURL() : '';
    const status = ({docked:'An der Station',cleaning:'Reinigt',paused:'Pausiert',returning:'Zurück zur Station',idle:'Bereit',unavailable:'Nicht verfügbar',unknown:'Unbekannt',error:'Fehler'})[state?.state] || state?.state || 'Entität nicht gefunden';
    const percent = validNumber(a.cleaning_progress) ? Math.min(100,Math.max(0,Number(a.cleaning_progress))) : 0;
    const roomAllowed = online && !['cleaning','returning','paused'].includes(state.state) && this._hasService('dreame_vacuum','vacuum_clean_segment');
    const mode = this._entity('cleaning_mode_entity');
    const options = mode?.attributes.options || [];
    const selectedMode = this._draftMode ?? mode?.state;
    const mopping = ['mopping','sweeping_and_mopping','mopping_after_sweeping'].includes(selectedMode);
    const water=options.some(option=>['mopping','sweeping_and_mopping','mopping_after_sweeping'].includes(option)) ? this._entity('water_level_entity') : undefined, waterMin=Number(water?.attributes.min ?? 1), waterMax=Number(water?.attributes.max ?? 32);
    const waterStep=Number(water?.attributes.step ?? 1);
    const waterLevel=this._draftWater ?? this._config.default_water_level ?? 14;
    const roomsPanel = rooms.length ? `<section class="room-section" data-key="rooms"><div class="room-selection"><div class="section-title">${this._selected.size} / ${rooms.length} Räume</div><button data-action="select-all" ${this._selected.size===rooms.length || this._busy || !online ? 'disabled' : ''}>Alle auswählen</button></div><div class="rooms">${rooms.map(room=>`<button class="room" data-room="${room.id}" aria-pressed="${this._selected.has(room.id)}" ${this._busy || !online ? 'disabled' : ''}><ha-icon icon="${esc(/^mdi:[a-z0-9-]+$/.test(room.icon || '') ? room.icon : 'mdi:home-outline')}"></ha-icon>${esc(room.name || `Raum ${room.id}`)}</button>`).join('')}</div><div class="room-tools">${this._button('rooms','floor-plan','Auswahl reinigen',!roomAllowed || !this._selected.size,'primary')}<button data-action="clear" ${!this._selected.size || this._busy ? 'disabled' : ''}>Leeren</button></div></section>` : '';
    const settingsPanel = (available(mode) && options.length) || (this._supports('set_fan_speed') && a.fan_speed_list?.length) || water || carpet ? `<section class="settings" data-key="settings">${available(mode) && options.length ? `<label>Reinigungsmodus<select data-setting="mode" ${!online || this._busy || running ? 'disabled':''}>${options.map(option=>`<option value="${esc(option)}" ${selectedMode===option?'selected':''}>${esc(({sweeping:'Saugen',mopping:'Wischen',sweeping_and_mopping:'Saugen & Wischen',mopping_after_sweeping:'Wischen nach Saugen'})[option] || option)}</option>`).join('')}</select></label>`:''}${this._supports('set_fan_speed') && a.fan_speed_list?.length ? `<label>Saugkraft<select data-setting="fan" ${!can('set_fan_speed',32) || this._busy ? 'disabled':''}>${a.fan_speed_list.map(option=>`<option value="${esc(option)}" ${a.fan_speed===option?'selected':''}>${esc(({min:'Minimal',low:'Leise',medium:'Mittel',high:'Stark',max:'Maximum',silent:'Leise',standard:'Standard',strong:'Stark',turbo:'Turbo'})[option] || option)}</option>`).join('')}</select></label>`:''}${water ? `<label class="water"><span class="water-top"><span>Wassermenge</span><output data-water-output>${measure(waterLevel)}</output></span><input data-setting="water" aria-label="Wassermenge" type="range" min="${waterMin}" max="${waterMax}" step="${waterStep}" value="${waterLevel}" ${!online || !mopping || this._busy || running ? 'disabled':''}></label>`:''}${carpet ? `<div class="carpet-setting"><span>Teppichmodus</span><button data-action="carpet" role="switch" aria-checked="${carpet.state==='on'}" ${!online || !available(carpet) || this._busy || !this._hasService('switch',carpet.state==='on'?'turn_off':'turn_on') ? 'disabled':''}>${carpet.state==='on'?'Ein':'Aus'}</button></div>`:''}${available(mode) && options.length ? `<div class="water-hint">Modus${water ? ' und Wasser' : ''} werden beim Start übernommen.${!mopping && water ? ' Für Wasser Saugen & Wischen oder Wischen wählen.' : ''}</div>`:''}</section>`:'';
    const dockPanel = ['wash_entity','dry_entity','empty_entity'].some(key=>this._entity(key)) ? `<section data-key="dock"><div class="section-title">Station</div><div class="dock">${[['wash_entity','wash','Wäsche'],['dry_entity','weather-sunny','Trocknen'],['empty_entity','delete-outline','Entleeren']].filter(([key])=>this._entity(key)).map(([key,icon,label])=>this._button(key,icon,label,!online || !this._entity(key) || this._entity(key).state === 'unavailable' || !this._hasService('button','press'))).join('')}</div></section>`:'';
    const maintenancePanel = supplies.length ? `<section data-key="maintenance"><div class="supplies">${supplies.map(item=>`<div class="supply">${esc(item.label)} · ${measure(item.value,` ${item.unit}`)}${item.percent?`<progress max="100" value="${Math.min(100,Math.max(0,item.value))}"></progress>`:'<div class="muted">Restlaufzeit</div>'}</div>`).join('')}</div></section>` : '';
    const toolsPanel = ['locate','clean_spot'].some(action=>this._supports(action)) ? `<section data-key="tools"><div class="dock">${this._supports('locate')?this._button('locate','volume-high','Finden',!online):''}${this._supports('clean_spot')?this._button('clean_spot','target','Punktreinigung',!online || running):''}</div></section>` : '';

    const camera=this._entity('live_camera_entity'),cameraActive=camera?.state==='streaming';
    const panels={rooms:roomsPanel,settings:settingsPanel,dock:dockPanel,maintenance:maintenancePanel,tools:toolsPanel};
    const titles={rooms:'Räume auswählen',settings:'Reinigung einstellen',dock:'Station',maintenance:'Wartung',tools:'Weitere Aktionen'};
    const popoverSupported=typeof HTMLElement.prototype.showPopover==='function';
    const flyoutStyle=this.shadowRoot.querySelector('.flyout')?.getAttribute('style') || '';
    const template = document.createElement('template');
    template.innerHTML = `<style>${styles}</style><ha-card>
      <header><div class="robot"><ha-icon icon="mdi:robot-vacuum"></ha-icon></div><div class="title"><h2>${esc(this._config.name || a.friendly_name || 'Staubsauger')}</h2><div class="sub">${esc(status)}${a.washing ? ' · Moppwäsche' : a.drying ? ' · Trocknung' : ''}</div></div><div class="battery"><ha-icon icon="mdi:${a.charging ? 'battery-charging' : 'battery'}"></ha-icon>${measure(battery,'%')}</div></header>
      ${!online ? `<div class="notice" data-key="offline" role="status">${state ? 'Staubsauger nicht verfügbar' : `Entität nicht gefunden: ${esc(this._config.entity)}`}</div>` : ''}
      ${a.has_error || deviceError ? `<div class="notice error" data-key="device-error" role="alert">${esc(deviceError || a.error || 'Gerätefehler')}</div>` : ''}
      ${a.clean_water_tank_status === 'Low water' ? '<div class="notice" data-key="water-warning">Frischwassertank auffüllen</div>' : ''}
      ${this._error ? `<div class="notice error" data-key="call-error" role="alert">${esc(this._error)}</div>` : ''}
      ${map ? `<div class="map"><div class="map-tools"><span class="map-label"><ha-icon icon="mdi:floor-plan"></ha-icon> ${esc(a.selected_map || 'Aktuelle Karte')}</span><button data-action="zoom-out" aria-label="Karte verkleinern" ${this._zoom <= 1 ? 'disabled':''}>−</button><button data-action="zoom-in" aria-label="Karte vergrößern" ${this._zoom >= 5 ? 'disabled':''}>+</button><button class="zoom-reset" data-action="zoom-reset" aria-label="Kartenansicht zurücksetzen">${Math.round(this._zoom*100)}%</button></div><div class="map-viewport" tabindex="0" role="group" aria-label="Reinigungskarte. Zwei Finger zum Zoomen und Verschieben. Am Desktop klicken, dann Mausrad. Plus, Minus und Null sind ebenfalls möglich." ${this._zoom>1?'data-zoomed':''}>${url ? `<img draggable="false" alt="Aktuelle Reinigungskarte" style="width:${this._zoom*100}%;height:${this._zoom*100}%" src="${esc(url)}">` : '<div class="placeholder">Karte nicht verfügbar · Kartenkamera auswählen</div>'}</div><div class="map-meta"><span>${esc(this._mapDate())}</span><button data-action="refresh-map" aria-label="Karte aktualisieren"><ha-icon icon="mdi:refresh"></ha-icon>Aktualisieren</button></div><div class="map-help">2 Finger: zoomen · Desktop: klicken, dann Mausrad</div></div>` : ''}
      ${validNumber(area) || validNumber(time) || validNumber(a.cleaning_progress) ? `<div class="stats">${validNumber(area)?`<div class="stat"><div class="value">${measure(area,' m²')}</div><div class="muted">Fläche</div></div>`:''}${validNumber(time)?`<div class="stat"><div class="value">${measure(time,' min')}</div><div class="muted">Dauer</div></div>`:''}${validNumber(a.cleaning_progress)?`<div class="stat"><div class="value">${measure(a.cleaning_progress,'%')}</div><div class="muted">Fortschritt</div></div>`:''}</div>`:''}
      <div class="controls">${running && this._supports('pause') ? this._button('pause','pause','Pause',!online,'primary') : this._supports('start') ? this._button('start','play',state?.state === 'paused' ? 'Fortsetzen' : 'Start',!online,'primary'):''}${this._supports('return_to_base')?this._button('return_to_base','home-import-outline','Station',!online):''}${this._supports('stop')?this._button('stop','stop','Stopp',!online):''}</div>
      ${validNumber(a.cleaning_progress) ? `<div class="progress"><span style="width:${percent}%"></span></div>`:''}
      <div class="badges" data-key="badges">
        ${rooms.length ? this._badge('rooms','floor-plan',this._selected.size ? `${this._selected.size} Räume` : `${rooms.length} Räume`) : ''}
        ${settingsPanel ? this._badge('settings','tune-variant',`${({sweeping:'Saugen',mopping:'Wischen',sweeping_and_mopping:'Saugen & Wischen',mopping_after_sweeping:'Saugen → Wischen'})[selectedMode] || 'Saugkraft'}${mopping && water ? ` · ${waterLevel}` : ''}`) : ''}
        ${dockPanel ? this._badge('dock','home-import-outline','Station') : ''}
        ${maintenancePanel ? this._badge('maintenance','tools','Wartung') : ''}${toolsPanel ? this._badge('tools','dots-horizontal','Extras') : ''}
        ${camera ? `<button class="badge" data-action="camera-open" aria-label="Live-Kamera öffnen" ${this._cameraBusy || !available(camera)?'disabled':''}><ha-icon icon="mdi:${cameraActive?'video':'video-outline'}"></ha-icon>${this._cameraBusy?'Kamera …':cameraActive?'Kamera · Live':'Kamera'}</button>` : ''}
      </div>
      <div id="dc-flyout" data-key="flyout" class="flyout" role="dialog" aria-modal="false" style="${esc(flyoutStyle)}" ${popoverSupported?'popover="auto"':this._isFlyoutOpen()?'':'hidden'} aria-label="${esc(titles[this._panel] || 'Einstellungen')}">
        <div class="flyout-title"><strong>${esc(titles[this._panel] || '')}</strong><button data-action="close-panel" aria-label="Schließen"><ha-icon icon="mdi:close"></ha-icon></button></div>
        ${panels[this._panel] || ''}
      </div>
      <footer><button data-action="info">Gerätedetails ↗</button></footer></ha-card>`;
    syncChildren(this.shadowRoot,template.content);
    const flyout=this.shadowRoot.querySelector('.flyout');
    if(flyout){flyout.onbeforetoggle=event=>{if(event.newState==='closed'){this._panel=undefined;this._anchor=undefined;for(const button of this.shadowRoot.querySelectorAll('[data-action^="panel-"]'))button.setAttribute('aria-expanded','false');}};flyout.ontoggle=()=>{if(!this._isFlyoutOpen()){this._panel=undefined;this._anchor=undefined;this._updateBadges();}};}
    this._positionFlyout();this._bindMap();
    const img=this.shadowRoot.querySelector('.map img');
    if(img) {
      img.onload=()=>{img.hidden=false;img.parentElement.querySelector('.placeholder')?.remove();};
      img.onerror=()=>{img.hidden=true;const message=document.createElement('div');message.className='placeholder';message.textContent='Karte konnte nicht geladen werden · erneut aktualisieren';img.parentElement.querySelector('.placeholder')?.remove();img.parentElement.append(message);};
    }
  }
  async _call(domain, service, data, prepare = false) {
    if(this._busy) return;
    this._busy=true;this._error='';this._render();
    try { if(prepare)await this._prepareCleaning();await this._hass.callService(domain,service,data); }
    catch(error) { this._error=error?.message || 'Aktion fehlgeschlagen'; }
    finally {this._busy=false;this._render();}
  }
  _act(action,keyboard=false) {
    if(action.startsWith('panel-')){this._openFlyout(action.slice(6),keyboard);return;}
    if(action==='camera-open')return this._openCamera();
    if(action==='close-panel'){this._closeFlyout();return;}
    if(action==='refresh-map'){this._refreshMap();return;}
    if(action==='zoom-in' || action==='zoom-out' || action==='zoom-reset'){this._setMapZoom(action==='zoom-reset'?1:this._zoom+(action==='zoom-in'?.5:-.5));return;}
    if(action==='info') {this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:this._config.entity}}));return;}
    if(action==='clear') {this._selected.clear();this._render();return;}
    if(!available(this._entity('entity')) || this._busy) return;
    if(action==='select-all') {this._selected=new Set(this._rooms(this._entity('entity').attributes).map(room=>room.id));this._render();return;}
    if(action==='rooms') {
      const rooms=this._rooms(this._entity('entity').attributes);
      const segments=rooms.filter(room=>this._selected.has(room.id)).map(room=>room.id);
      if(!segments.length || !this._hasService('dreame_vacuum','vacuum_clean_segment')) return;
      return this._call('dreame_vacuum','vacuum_clean_segment',{entity_id:this._config.entity,segments,repeats:this._config.repeats || 1},true);
    }
    if(['wash_entity','dry_entity','empty_entity'].includes(action) && this._config[action]) return this._call('button','press',{entity_id:this._config[action]});
    if(action==='carpet' && available(this._entity('carpet_mode_entity')))return this._call('switch',this._entity('carpet_mode_entity').state==='on'?'turn_off':'turn_on',{entity_id:this._config.carpet_mode_entity});
    if(['start','pause','stop','return_to_base','locate','clean_spot'].includes(action) && this._supports(action)) return this._call('vacuum',action,{entity_id:this._config.entity},action==='start' && this._entity('entity').state !== 'paused');
  }
  async _prepareCleaning() {
    const mode=this._entity('cleaning_mode_entity');
    const selected=this._draftMode ?? mode?.state;
    if(!selected)return;
    if(!available(mode) || !mode.attributes.options?.includes(selected))throw new Error('Reinigungsmodus nicht verfügbar.');
    const mopping=['mopping','sweeping_and_mopping','mopping_after_sweeping'].includes(selected);
    if(this._entity('entity').attributes.customized_cleaning)throw new Error('Individuelle Raumreinigung ist aktiv. Für diese globalen Einstellungen zuerst in den Gerätedetails deaktivieren.');
    if(mode.state!==selected)await this._hass.callService('select','select_option',{entity_id:this._config.cleaning_mode_entity,option:selected});
    if(mopping && this._config.water_level_entity){
      const deadline=Date.now()+10000;
      while(!available(this._entity('water_level_entity')) && Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,100));
      const water=this._entity('water_level_entity');
      if(!available(water))throw new Error('Wassermenge noch nicht verfügbar. Mopp und Tank prüfen und erneut starten.');
      const value=this._draftWater ?? this._config.default_water_level ?? 14;
      const min=Number(water.attributes.min),max=Number(water.attributes.max),step=Number(water.attributes.step || 1);
      if(!Number.isFinite(value) || value<min || value>max || Math.abs((value-min)/step-Math.round((value-min)/step))>1e-6)throw new Error('Wassermenge liegt außerhalb des Gerätebereichs.');
      await this._hass.callService('number','set_value',{entity_id:this._config.water_level_entity,value});
    }
  }
  _setting(kind,value) {
    if(!available(this._entity('entity'))) return;
    if(kind==='mode' && available(this._entity('cleaning_mode_entity')) && this._entity('cleaning_mode_entity').attributes.options?.includes(value)){this._draftMode=value;this._render();return;}
    if(kind==='water'){this._draftWater=Number(value);this._render();return;}
    if(kind==='fan' && this._entity('entity').attributes.fan_speed_list?.includes(value)) return this._call('vacuum','set_fan_speed',{entity_id:this._config.entity,fan_speed:value});
  }
}

class DahoamDreameEditor extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});}
  setConfig(config){this._config={...config};this._render();}
  set hass(hass){this._hass=hass;this._render();}
  _render(){
    if(!this._hass || !this._config)return;
    if(!this._form){
      this.shadowRoot.innerHTML='<ha-form></ha-form>';this._form=this.shadowRoot.querySelector('ha-form');
      this._form.schema=[{name:'entity',required:true,selector:{entity:{domain:'vacuum'}}},{name:'name',selector:{text:{}}},{name:'show_map',selector:{boolean:{}}},{name:'live_camera_path',selector:{text:{}}},...Object.entries({map_entity:'camera',live_camera_entity:'camera',cleaning_mode_entity:'select',water_level_entity:'number',battery_entity:'sensor',area_entity:'sensor',time_entity:'sensor',error_entity:'sensor',main_brush_entity:'sensor',side_brush_entity:'sensor',filter_entity:'sensor',sensor_cleaning_entity:'sensor',carpet_mode_entity:'switch',wash_entity:'button',dry_entity:'button',empty_entity:'button'}).map(([name,domain])=>({name,selector:{entity:{domain}}})),{name:'default_water_level',selector:{number:{min:1,max:32,step:1,mode:'box'}}},{name:'repeats',selector:{number:{min:1,max:3,step:1,mode:'box'}}}];
      this._form.computeLabel=s=>({entity:'Staubsauger',name:'Name',show_map:'Karte anzeigen',map_entity:'Kartenkamera',live_camera_entity:'Live-Kamera (optional)',live_camera_path:'Kamera-Panel (Dashboard-Pfad, optional)',cleaning_mode_entity:'Reinigungsmodus',water_level_entity:'Wassermenge (Feuchtigkeit)',battery_entity:'Batteriesensor',area_entity:'Flächensensor',time_entity:'Zeitsensor',error_entity:'Fehlersensor',main_brush_entity:'Hauptbürste (Restlaufzeit)',side_brush_entity:'Seitenbürste (Restlaufzeit)',filter_entity:'Filter (Restlaufzeit)',sensor_cleaning_entity:'Sensoren (Restlaufzeit)',carpet_mode_entity:'Teppichmodus',default_water_level:'Standard-Wassermenge (14)',wash_entity:'Moppwäsche (Start/Pause)',dry_entity:'Trocknung (Start/Stopp)',empty_entity:'Staub entleeren',repeats:'Raumreinigung: Wiederholungen'})[s.name] || s.name;
      this._form.addEventListener('value-changed',event=>{event.stopPropagation();this._config={...this._config,...event.detail.value};this.dispatchEvent(new CustomEvent('config-changed',{bubbles:true,composed:true,detail:{config:this._config}}));});
    }
    this._form.hass=this._hass;this._form.data=this._config;
  }
}
if(!customElements.get('dahoam-vacuum-card'))customElements.define('dahoam-vacuum-card',class extends DahoamDreameCard {});
if(!customElements.get('dahoam-dreame-card-editor'))customElements.define('dahoam-dreame-card-editor',DahoamDreameEditor);
if(!customElements.get('dahoam-dreame-card'))customElements.define('dahoam-dreame-card',DahoamDreameCard);
window.customCards=window.customCards || [];
if(!window.customCards.some(card=>card.type==='dahoam-vacuum-card'))window.customCards.push({type:'dahoam-vacuum-card',name:'Dahoam Vacuum',description:'Kompakte Karte für Dreame, Valetudo und weitere HA-Staubsauger',preview:true});
