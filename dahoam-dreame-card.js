/** Dahoam Dreame Card v1.3.0 — independent implementation, MIT. */
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
:host{display:block;--accent:var(--primary-color,#4285ef);--soft:color-mix(in srgb,var(--accent) 8%,var(--card-background-color,#fff));--line:var(--divider-color,#e9edf3)}*{box-sizing:border-box}
ha-card{display:block;overflow:hidden;border-radius:24px;border:1px solid var(--line);background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#202b3c);box-shadow:0 8px 30px #142d4b08;font-family:var(--primary-font-family,inherit)}
header{display:flex;align-items:center;gap:14px;padding:22px 22px 18px;background:linear-gradient(125deg,var(--soft),transparent 80%)}.robot{width:58px;height:58px;flex-shrink:0;display:grid;place-items:center;border-radius:20px;background:var(--card-background-color,#fff);box-shadow:0 4px 16px #142d4b0a;color:var(--accent)}.robot svg{width:44px;height:44px}.title{flex:1;min-width:0}.eyebrow{font-size:10px;letter-spacing:1.5px;font-weight:700;color:var(--secondary-text-color,#7b8799);margin-bottom:4px}h2{font-size:22px;line-height:1.2;margin:0;letter-spacing:-.6px}.sub{display:inline-flex;align-items:center;gap:5px;font-size:12px;margin-top:7px;color:var(--secondary-text-color,#738093)}.sub:before{content:'';width:6px;height:6px;border-radius:50%;background:var(--accent)}.battery{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--secondary-text-color,#738093);white-space:nowrap}
.muted{color:var(--secondary-text-color,#7b8799);font-size:11px}.map{position:relative;margin:0 12px 4px;border:1px solid var(--line);border-radius:18px;background:var(--secondary-background-color,#f4f6fa);overflow:hidden}.map-tools,.map-meta{display:flex;align-items:center;gap:6px;padding:10px 12px}.map-tools{justify-content:flex-end}.map-label{margin-right:auto;font-size:12px;font-weight:600}.map-label ha-icon{color:var(--accent)}.map-tools button,.map-meta button{min-height:30px;min-width:30px;padding:4px;border-radius:9px;background:var(--card-background-color,#fff);border-color:transparent}.map-viewport{height:360px;overflow:auto;position:relative}.map img[hidden]{display:none}.map img{width:100%;height:100%;object-fit:contain;display:block;max-width:none}.map .placeholder{display:grid;place-items:center;min-height:240px;text-align:center;padding:24px;font-size:13px;color:var(--secondary-text-color,#7b8799)}.map-meta{justify-content:space-between;border-top:1px solid var(--line);font-size:10px;color:var(--secondary-text-color,#738093)}.map-meta button{font-size:10px;padding:4px 8px;gap:4px;background:transparent}.map-meta ha-icon{--mdc-icon-size:14px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 20px}.stat{text-align:center;padding:2px 4px;border-right:1px solid var(--line)}.stat:last-child{border:0}.value{font-size:21px;letter-spacing:-.6px;font-weight:650;margin-bottom:5px}.progress{height:3px;margin:0 22px 4px;border-radius:4px;overflow:hidden;background:var(--line)}.progress span{display:block;height:100%;background:var(--accent)}
section{padding:18px 22px;border-top:1px solid var(--line)}.section-title{display:flex;justify-content:space-between;font-size:11px;font-weight:650;letter-spacing:.3px;margin-bottom:12px;color:var(--secondary-text-color,#738093)}
button,select{font:inherit;color:inherit;border:1px solid var(--line);background:transparent;border-radius:12px;min-height:44px;padding:9px 12px;cursor:pointer}button{display:inline-flex;gap:7px;align-items:center;justify-content:center;transition:background .15s,box-shadow .15s}button:hover{background:var(--soft)}button:focus-visible,select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}button:disabled,select:disabled{opacity:.4;cursor:default}.primary{background:var(--accent);color:var(--text-primary-color,#fff);border-color:var(--accent);flex:1;box-shadow:0 4px 12px color-mix(in srgb,var(--accent) 18%,transparent);font-weight:600}.primary:hover{filter:brightness(1.06);background:var(--accent)}
.controls{display:flex;gap:8px;padding:0 22px 18px}.controls button{min-height:48px}.rooms{display:flex;flex-wrap:wrap;gap:5px}.room-section{padding:12px 18px}.room-section .section-title{margin-bottom:8px}.room{font-size:11px;min-height:32px;padding:5px 8px;gap:4px;justify-content:flex-start;border-radius:9px;white-space:normal;text-align:left;background:var(--secondary-background-color,#f7f9fc)}.room ha-icon{flex-shrink:0;--mdc-icon-size:14px;color:var(--secondary-text-color,#7b8799)}.room[aria-pressed=true]{background:var(--soft);border-color:var(--accent);color:var(--accent)}.room[aria-pressed=true] ha-icon{color:var(--accent)}.room-tools{display:flex;gap:6px;align-items:center;margin-top:8px}.room-tools button{min-height:34px;padding:6px 9px}.room-tools button{font-size:12px;flex:1}.room-tools button:last-child{flex:0;padding:8px 12px}.settings{display:grid;grid-template-columns:1fr 1fr;gap:12px}label{font-size:11px;color:var(--secondary-text-color,#7b8799);display:grid;gap:7px}select{width:100%;min-width:0;font-size:13px;color:var(--primary-text-color,#202b3c);background:var(--secondary-background-color,#f7f9fc);border-color:transparent}
.water{grid-column:1/-1}.water-top{display:flex;justify-content:space-between;gap:8px}.water input{width:100%;accent-color:var(--accent);margin:5px 0}.water-hint{grid-column:1/-1;font-size:10px;color:var(--secondary-text-color,#738093);line-height:1.5}.water output{font-weight:600;color:var(--accent)}.dock{display:flex;gap:8px}.dock button{flex:1;flex-direction:column;gap:7px;padding:12px 4px;font-size:11px;border-color:transparent;background:var(--secondary-background-color,#f7f9fc);min-height:70px}.dock ha-icon{color:var(--accent)}.notice{margin:0 20px 12px;padding:10px 12px;background:color-mix(in srgb,var(--warning-color,#d99520) 10%,transparent);border:1px solid color-mix(in srgb,var(--warning-color,#d99520) 16%,transparent);border-radius:12px;font-size:12px;line-height:1.4}.error{color:var(--error-color,#bd3535)}details summary{cursor:pointer;font-size:12px;min-height:24px;color:var(--secondary-text-color,#738093)}.supplies{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.supply{font-size:11px}.supply progress{display:block;width:100%;height:5px;accent-color:var(--accent);margin-top:7px}ha-icon{--mdc-icon-size:19px}footer{padding:0 18px 8px;text-align:right}footer button{color:var(--secondary-text-color,#738093);border:0;font-size:10px;min-height:28px;padding:4px}
header{padding:15px 18px;gap:10px}.robot{width:44px;height:44px;border-radius:15px}.robot svg{width:35px;height:35px}h2{font-size:20px}.eyebrow{font-size:9px}.stats{margin:12px 14px}.value{font-size:19px}.controls{padding:0 16px 12px}.controls button{min-height:42px}.map-viewport{height:300px}.map-tools,.map-meta{padding:7px 10px}.badges{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px 6px}.badge{min-height:32px;padding:5px 9px;font-size:11px;gap:5px;border-radius:20px;background:var(--soft);border-color:transparent}.badge ha-icon{--mdc-icon-size:16px;color:var(--accent)}.chevron{opacity:.55;font-size:12px}.flyout{color:var(--primary-text-color,#202b3c);background:var(--card-background-color,#fff);border:1px solid var(--line);border-radius:20px;padding:0;width:min(420px,calc(100vw - 32px));max-height:80dvh;overflow:auto;box-shadow:0 20px 70px #10234040}.flyout::backdrop{background:#101d3655;backdrop-filter:blur(3px)}.flyout-title{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;font-size:14px}.flyout-title button{border:0;min-height:32px;padding:4px 10px;font-size:22px}.flyout-footer{padding:8px 18px 14px;text-align:right}.flyout-footer button{font-size:12px;min-height:34px;background:var(--soft)}.flyout section{padding:14px 18px}.flyout .dock button{min-height:60px}.flyout details summary{display:none}.flyout .supplies{margin-top:0}.flyout details:not([open]) .supplies{display:grid}.flyout .room-tools{margin-top:12px}
@media(max-width:380px){header{padding:18px 16px;gap:10px}.robot{width:48px;height:48px;border-radius:16px}.robot svg{width:38px;height:38px}h2{font-size:20px}.stats{margin:16px 10px}.value{font-size:19px}section{padding:16px}.controls{padding:0 16px 16px}.controls button{padding:8px 10px;font-size:12px}.map-viewport{height:280px}.settings{gap:8px}.battery{font-size:11px}}
`;
class DahoamDreameCard extends HTMLElement {
  constructor() {
    super(); this.attachShadow({mode:'open'}); this._selected = new Set(); this._busy = false; this._zoom = 1; this._refreshSerial = 0;
    this.shadowRoot.addEventListener('click', event => {
      const button=event.target.closest?.('button');if(!button || button.disabled)return;
      if(button.dataset.action)this._act(button.dataset.action);
      else if(button.dataset.room){const id=Number(button.dataset.room);this._selected.has(id)?this._selected.delete(id):this._selected.add(id);this._render();}
    });
    this.shadowRoot.addEventListener('change', event => {if(event.target.dataset.setting)this._setting(event.target.dataset.setting,event.target.value);});
    this.shadowRoot.addEventListener('input', event => {if(event.target.dataset.setting==='water'){this._draftWater=Number(event.target.value);this.shadowRoot.querySelector('[data-water-output]').textContent=event.target.value;}});
  }
  static getConfigElement() { return document.createElement('dahoam-dreame-card-editor'); }
  static getStubConfig(hass) {
    const id = Object.keys(hass?.states || {}).find(id => id.startsWith('vacuum.') && hass.states[id].attributes.device_class === 'dreame_vacuum');
    return {entity:id || '', name:'Dreame', show_map:true};
  }
  setConfig(config) {
    if (!/^vacuum\.[a-z0-9_]+$/.test(config.entity || '')) throw new Error('Please select a vacuum entity.');
    for (const [key, domain] of Object.entries({map_entity:'camera',cleaning_mode_entity:'select',water_level_entity:'number',wash_entity:'button',dry_entity:'button',empty_entity:'button'})) {
      if (config[key] && !new RegExp(`^${domain}\\.[a-z0-9_]+$`).test(config[key])) throw new Error(`${key} must be a ${domain} entity.`);
    }
    if (config.repeats !== undefined && ![1,2,3].includes(config.repeats)) throw new Error('repeats must be 1, 2 or 3.');
    if(config.default_water_level !== undefined && (!Number.isInteger(config.default_water_level) || config.default_water_level<1 || config.default_water_level>32))throw new Error('default_water_level must be an integer from 1 to 32.');
    this._draftMode=undefined;this._draftWater=config.default_water_level ?? 14;
    this._config = {...config}; this._selected.clear(); this._mapKey = undefined; this._error = ''; this._render();
  }
  set hass(hass) { this._hass = hass; this._render(); }
  getCardSize() { return this._config?.show_map === false ? 8 : 13; }
  getGridOptions() { return {columns:12, min_columns:6}; }
  connectedCallback() {
    clearInterval(this._timer);
    this._timer = setInterval(() => {
      const interval = this._entity('entity')?.state === 'cleaning' ? 10000 : 30000;
      if (!document.hidden && Date.now() - (this._lastRefresh || 0) >= interval) this._refreshMap();
    }, 5000);
    this._render();
  }
  disconnectedCallback() { clearInterval(this._timer); }
  _entity(key) { return this._hass?.states[this._config?.[key]]; }
  _hasService(domain, service) { return !!this._hass?.services?.[domain]?.[service]; }
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
  _badge(panel,icon,label){return `<button class="badge" data-action="panel-${panel}" aria-haspopup="dialog"><ha-icon icon="mdi:${icon}"></ha-icon>${esc(label)}<span class="chevron">⌄</span></button>`;}
  _button(action, icon, label, disabled = false, cls = '') {
    return `<button data-action="${esc(action)}" class="${cls}" ${disabled || this._busy ? 'disabled' : ''}><ha-icon icon="mdi:${icon}"></ha-icon>${esc(label)}</button>`;
  }
  _render() {
    if (!this._config || !this._hass) return;
    const state = this._entity('entity');
    const a = state?.attributes || {}, online = available(state);
    const rooms = this._rooms(a), running = state?.state === 'cleaning';
    const can = (service, bit) => online && this._hasService('vacuum',service) && !!(Number(a.supported_features) & bit);
    const map = this._config.show_map !== false && this._config.map_entity;
    const url = map ? this._mapURL() : '';
    const status = ({docked:'An der Station',cleaning:'Reinigt',paused:'Pausiert',returning:'Zurück zur Station',idle:'Bereit',unavailable:'Nicht verfügbar',unknown:'Unbekannt',error:'Fehler'})[state?.state] || state?.state || 'Entität nicht gefunden';
    const percent = validNumber(a.cleaning_progress) ? Math.min(100,Math.max(0,Number(a.cleaning_progress))) : 0;
    const roomAllowed = online && !['cleaning','returning','paused'].includes(state.state) && this._hasService('dreame_vacuum','vacuum_clean_segment');
    const mode = this._entity('cleaning_mode_entity');
    const options = mode?.attributes.options || [];
    const selectedMode = this._draftMode ?? mode?.state;
    const mopping = ['mopping','sweeping_and_mopping','mopping_after_sweeping'].includes(selectedMode);
    const water=this._entity('water_level_entity'), waterMin=Number(water?.attributes.min ?? 1), waterMax=Number(water?.attributes.max ?? 32);
    const waterStep=Number(water?.attributes.step ?? 1);
    const waterLevel=this._draftWater ?? this._config.default_water_level ?? 14;
    const detailsOpen = this.shadowRoot.querySelector('details')?.open;
    const roomsPanel = rooms.length ? `<section class="room-section" data-key="rooms"><div class="section-title">Räume <span>${this._selected.size} ausgewählt</span></div><div class="rooms">${rooms.map(room=>`<button class="room" data-room="${room.id}" aria-pressed="${this._selected.has(room.id)}" ${this._busy || !online ? 'disabled' : ''}><ha-icon icon="${esc(/^mdi:[a-z0-9-]+$/.test(room.icon || '') ? room.icon : 'mdi:home-outline')}"></ha-icon>${esc(room.name || `Raum ${room.id}`)}</button>`).join('')}</div><div class="room-tools">${this._button('rooms','floor-plan','Auswahl reinigen',!roomAllowed || !this._selected.size,'primary')}<button data-action="clear" ${!this._selected.size || this._busy ? 'disabled' : ''}>Leeren</button></div></section>` : '';
    const settingsPanel = (available(mode) && options.length) || a.fan_speed_list?.length || water ? `<section class="settings" data-key="settings">${available(mode) && options.length ? `<label>Reinigungsmodus<select data-setting="mode" ${!online || this._busy || running ? 'disabled':''}>${options.map(option=>`<option value="${esc(option)}" ${selectedMode===option?'selected':''}>${esc(({sweeping:'Saugen',mopping:'Wischen',sweeping_and_mopping:'Saugen & Wischen',mopping_after_sweeping:'Wischen nach Saugen'})[option] || option)}</option>`).join('')}</select></label>`:''}${a.fan_speed_list?.length ? `<label>Saugkraft<select data-setting="fan" ${!can('set_fan_speed',32) || this._busy ? 'disabled':''}>${a.fan_speed_list.map(option=>`<option value="${esc(option)}" ${a.fan_speed===option?'selected':''}>${esc(({silent:'Leise',standard:'Standard',strong:'Stark',turbo:'Turbo'})[option] || option)}</option>`).join('')}</select></label>`:''}${water ? `<label class="water"><span class="water-top"><span>Wassermenge</span><output data-water-output>${measure(waterLevel)}</output></span><input data-setting="water" aria-label="Wassermenge" type="range" min="${waterMin}" max="${waterMax}" step="${waterStep}" value="${waterLevel}" ${!online || !mopping || this._busy || running ? 'disabled':''}></label>`:''}${available(mode) && options.length ? `<div class="water-hint">Modus${water ? ' und Wasser' : ''} werden beim Start übernommen.${!mopping && water ? ' Für Wasser Saugen & Wischen oder Wischen wählen.' : ''}</div>`:''}</section>`:'';
    const dockPanel = ['wash_entity','dry_entity','empty_entity'].some(key=>this._config[key]) ? `<section data-key="dock"><div class="section-title">Station</div><div class="dock">${[['wash_entity','wash','Wäsche'],['dry_entity','weather-sunny','Trocknen'],['empty_entity','delete-outline','Entleeren']].filter(([key])=>this._config[key]).map(([key,icon,label])=>this._button(key,icon,label,!online || !this._entity(key) || this._entity(key).state === 'unavailable' || !this._hasService('button','press'))).join('')}</div></section>`:'';
    const maintenancePanel = `<section data-key="maintenance"><details open><summary>Wartung & Verbrauchsmaterial</summary><div class="supplies">${[['main_brush_left','Hauptbürste'],['side_brush_left','Seitenbürste'],['filter_left','Filter'],['sensor_dirty_left','Sensoren']].map(([key,label])=>`<div class="supply">${label} · ${measure(a[key],'%')}${validNumber(a[key])?`<progress max="100" value="${Math.min(100,Math.max(0,Number(a[key])))}"></progress>`:''}</div>`).join('')}</div></details></section>`;
    const panels={rooms:roomsPanel,settings:settingsPanel,dock:dockPanel,maintenance:maintenancePanel};
    const titles={rooms:'Räume auswählen',settings:'Reinigung einstellen',dock:'Station',maintenance:'Wartung'};
    const dialogOpen=this.shadowRoot.querySelector('dialog')?.open;
    const template = document.createElement('template');
    template.innerHTML = `<style>${styles}</style><ha-card>
      <header><div class="robot"><svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="34" r="25" fill="currentColor" opacity=".08"/><circle cx="32" cy="34" r="22" fill="var(--card-background-color,#fff)" stroke="currentColor" stroke-width="2"/><path d="M12 39h40M32 14v8" stroke="currentColor" stroke-width="1.5" opacity=".4"/><circle cx="32" cy="24" r="6" fill="var(--card-background-color,#fff)" stroke="currentColor" stroke-width="2"/><rect x="27" y="43" width="10" height="3" rx="1.5" fill="currentColor" opacity=".4"/></svg></div><div class="title"><div class="eyebrow">DREAME · REINIGUNG</div><h2>${esc(this._config.name || a.friendly_name || 'Dreame')}</h2><div class="sub">${esc(status)}${a.washing ? ' · Moppwäsche' : a.drying ? ' · Trocknung' : ''}</div></div><div class="battery"><ha-icon icon="mdi:${a.charging ? 'battery-charging' : 'battery'}"></ha-icon>${measure(a.battery,'%')}</div></header>
      ${!online ? `<div class="notice" data-key="offline" role="status">${state ? 'Staubsauger nicht verfügbar' : `Entität nicht gefunden: ${esc(this._config.entity)}`}</div>` : ''}
      ${a.has_error ? `<div class="notice error" data-key="device-error" role="alert">${esc(a.error || 'Gerätefehler')}</div>` : ''}
      ${a.clean_water_tank_status === 'Low water' ? '<div class="notice" data-key="water-warning">Frischwassertank auffüllen</div>' : ''}
      ${this._error ? `<div class="notice error" data-key="call-error" role="alert">${esc(this._error)}</div>` : ''}
      ${map ? `<div class="map"><div class="map-tools"><span class="map-label"><ha-icon icon="mdi:floor-plan"></ha-icon> ${esc(a.selected_map || 'Aktuelle Karte')}</span><button data-action="zoom-out" aria-label="Karte verkleinern" ${this._zoom <= 1 ? 'disabled':''}>−</button><button data-action="zoom-in" aria-label="Karte vergrößern" ${this._zoom >= 3 ? 'disabled':''}>+</button></div><div class="map-viewport">${url ? `<img alt="Aktuelle Reinigungskarte" style="width:${this._zoom*100}%;height:${this._zoom*100}%" src="${esc(url)}">` : '<div class="placeholder">Karte nicht verfügbar · Kartenkamera auswählen</div>'}</div><div class="map-meta"><span>${esc(this._mapDate())}</span><button data-action="refresh-map" aria-label="Karte aktualisieren"><ha-icon icon="mdi:refresh"></ha-icon>Aktualisieren</button></div></div>` : ''}
      <div class="stats"><div class="stat"><div class="value">${measure(a.cleaned_area,' m²')}</div><div class="muted">Fläche</div></div><div class="stat"><div class="value">${measure(a.cleaning_time,' min')}</div><div class="muted">Dauer</div></div><div class="stat"><div class="value">${measure(a.cleaning_progress,'%')}</div><div class="muted">Fortschritt</div></div></div>
      <div class="controls">${running ? this._button('pause','pause','Pause',!can('pause',4),'primary') : this._button('start','play',state?.state === 'paused' ? 'Fortsetzen' : 'Start',!can('start',8192),'primary')}${this._button('return_to_base','home-import-outline','Station',!can('return_to_base',16))}${this._button('stop','stop','Stopp',!can('stop',8))}</div>
      <div class="progress"><span style="width:${percent}%"></span></div>
      <div class="badges" data-key="badges">
        ${rooms.length ? this._badge('rooms','floor-plan',this._selected.size ? `${this._selected.size} Räume` : `${rooms.length} Räume`) : ''}
        ${settingsPanel ? this._badge('settings','tune-variant',`${({sweeping:'Saugen',mopping:'Wischen',sweeping_and_mopping:'Saugen & Wischen',mopping_after_sweeping:'Saugen → Wischen'})[selectedMode] || 'Saugkraft'}${mopping && water ? ` · ${waterLevel}` : ''}`) : ''}
        ${dockPanel ? this._badge('dock','home-import-outline','Station') : ''}
        ${this._badge('maintenance','tools','Wartung')}
      </div>
      <dialog data-key="flyout" class="flyout" aria-label="${esc(titles[this._panel] || 'Einstellungen')}" ${dialogOpen?'open':''}>
        <div class="flyout-title"><strong>${esc(titles[this._panel] || '')}</strong><button data-action="close-panel" aria-label="Schließen">×</button></div>
        ${panels[this._panel] || ''}
        <div class="flyout-footer"><button data-action="close-panel">Fertig</button></div>
      </dialog>
      <footer><button data-action="info">Gerätedetails ↗</button></footer></ha-card>`;
    syncChildren(this.shadowRoot,template.content);
    const dialog=this.shadowRoot.querySelector('dialog');
    if(dialog){dialog.onclose=()=>{if(!dialog.open)this._panel=undefined;};dialog.onclick=event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom)dialog.close();}};}
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
  _act(action) {
    if(action.startsWith('panel-')){this._panel=action.slice(6);this._render();const dialog=this.shadowRoot.querySelector('dialog');if(!dialog.open)dialog.showModal();return;}
    if(action==='close-panel'){this.shadowRoot.querySelector('dialog')?.close();return;}
    if(action==='refresh-map'){this._refreshMap();return;}
    if(action==='zoom-in' || action==='zoom-out'){this._zoom=Math.max(1,Math.min(3,this._zoom+(action==='zoom-in' ? .5 : -.5)));this._render();return;}
    if(action==='info') {this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:this._config.entity}}));return;}
    if(action==='clear') {this._selected.clear();this._render();return;}
    if(!available(this._entity('entity')) || this._busy) return;
    if(action==='rooms') {
      const rooms=this._rooms(this._entity('entity').attributes);
      const segments=rooms.filter(room=>this._selected.has(room.id)).map(room=>room.id);
      if(!segments.length || !this._hasService('dreame_vacuum','vacuum_clean_segment')) return;
      return this._call('dreame_vacuum','vacuum_clean_segment',{entity_id:this._config.entity,segments,repeats:this._config.repeats || 1},true);
    }
    if(['wash_entity','dry_entity','empty_entity'].includes(action) && this._config[action]) return this._call('button','press',{entity_id:this._config[action]});
    if(['start','pause','stop','return_to_base'].includes(action) && this._hasService('vacuum',action)) return this._call('vacuum',action,{entity_id:this._config.entity},action==='start' && this._entity('entity').state !== 'paused');
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
      this._form.schema=[{name:'entity',required:true,selector:{entity:{domain:'vacuum'}}},{name:'name',selector:{text:{}}},{name:'show_map',selector:{boolean:{}}},...Object.entries({map_entity:'camera',cleaning_mode_entity:'select',water_level_entity:'number',wash_entity:'button',dry_entity:'button',empty_entity:'button'}).map(([name,domain])=>({name,selector:{entity:{domain}}})),{name:'default_water_level',selector:{number:{min:1,max:32,step:1,mode:'box'}}},{name:'repeats',selector:{number:{min:1,max:3,step:1,mode:'box'}}}];
      this._form.computeLabel=s=>({entity:'Staubsauger',name:'Name',show_map:'Karte anzeigen',map_entity:'Kartenkamera',cleaning_mode_entity:'Reinigungsmodus',water_level_entity:'Wassermenge (Feuchtigkeit)',default_water_level:'Standard-Wassermenge (14)',wash_entity:'Moppwäsche (Start/Pause)',dry_entity:'Trocknung (Start/Stopp)',empty_entity:'Staub entleeren',repeats:'Raumreinigung: Wiederholungen'})[s.name] || s.name;
      this._form.addEventListener('value-changed',event=>{event.stopPropagation();this._config={...this._config,...event.detail.value};this.dispatchEvent(new CustomEvent('config-changed',{bubbles:true,composed:true,detail:{config:this._config}}));});
    }
    this._form.hass=this._hass;this._form.data=this._config;
  }
}
if(!customElements.get('dahoam-dreame-card-editor'))customElements.define('dahoam-dreame-card-editor',DahoamDreameEditor);
if(!customElements.get('dahoam-dreame-card'))customElements.define('dahoam-dreame-card',DahoamDreameCard);
window.customCards=window.customCards || [];
if(!window.customCards.some(card=>card.type==='dahoam-dreame-card'))window.customCards.push({type:'dahoam-dreame-card',name:'Dahoam Dreame',description:'Karte, Räume, Reinigung und Station — eigenständige Dreame-Karte',preview:true});
