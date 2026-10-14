# Dahoam Vacuum Card

A compact Home Assistant custom card with a camera map, room selection, cleaning settings and station controls. Small badges open settings in focused flyouts, keeping the dashboard compact. German UI; light and dark themes use Home Assistant's theme variables.

## Install

1. Copy `dahoam-dreame-card.js` to `/config/www/dahoam-dreame-card.js`.
2. Add `/local/dahoam-dreame-card.js?v=1.8.0` as a **JavaScript module** in **Settings → Dashboards → Resources**.
3. Hard-refresh Home Assistant, then **Add card → Dahoam Vacuum**. Choose the vacuum and its related entities. See `examples/winky.yaml` and `examples/dobby.yaml`.

No build step or runtime dependencies. Existing `custom:dahoam-dreame-card` configurations continue to work. Do not edit Home Assistant's `.storage` files.

## Controls

- Start, pause/resume, stop and return to station.
- Map preview, pinch/wheel zoom and manual refresh. Camera images refresh every 10 seconds during cleaning and every 30 seconds otherwise while the page is visible.
- **Rooms**, **Cleaning**, **Station** and **Maintenance** badges open non-modal flyouts anchored to the badge. The background remains usable, without dimming or blur. Outside click/tap, Escape, the same badge, or the close button dismisses them.
- In the room flyout, **Alle auswählen** selects every room exposed by the vacuum on the current map; **Leeren** clears the selection. Selection alone never starts cleaning. Hidden rooms omitted by the integration are not added.
- Cleaning mode includes vacuum, mop, vacuum+mop, and mop after vacuum, depending on the configured integration's options.
- Water level defaults to **14**. The range follows the configured number entity; tested with a Dreame device exposing 1–32.
- Mode and water are applied when starting a new whole-home or room task. Resume keeps the current task's settings. If preparation fails, cleaning does not start.
- Suction changes apply immediately. Dock buttons retain their integration's start/pause or start/stop behavior.

## Live camera

Configure `live_camera_entity` to add **Kamera** as the last badge. Clicking it
starts the feed through `camera.turn_on`, then opens Home Assistant's native
camera details. No camera flyout or custom media renderer is used.

Set `live_camera_path` to open a dedicated native dashboard panel instead, such
as `/dashboard-dahoam/winky-camera`. Winky's installed panel uses a native Picture
Glance card with `camera_view: live` and native Start/Stop icon buttons. The panel can
be edited in HA's visual editor; see `examples/winky-camera-view.yaml`.

Use Stop in that panel to end the feed immediately. The backend's session limit
(default 120 seconds) and real viewer-disconnect handling remain active. Some
webviews retain media connections after navigation, so navigating back alone is
not a guaranteed immediate stop. Close MOVAhome's live view before starting.
PINs stay in integration options and are never included in card configuration.
Dobby has no camera badge unless a live camera entity is explicitly configured.

## Map and flyout interactions

- **Mobile:** pinch with two fingers to zoom, or move both fingers together to pan. At 100%, one-finger swipes over the map continue scrolling the page. When zoomed, the map can also be scrolled using its native scroll area.
- **Desktop:** click the map, then use the wheel to zoom around the cursor; Ctrl/⌘ + wheel also works without first focusing it. Without focus or a modifier, the wheel keeps its normal scrolling behavior instead of changing zoom. At zoom limits, normal scrolling resumes. Drag the zoomed map with the mouse to pan.
- **Keyboard / alternatives:** focus the map and use +/− to zoom, 0 to reset, and arrow keys to pan. The on-screen +/− and percentage/reset buttons remain available. Scrollbars provide a single-pointer alternative to dragging. Browser zoom shortcuts and gestures outside the map are unchanged.
- Flyouts use the native Popover API with a small anchored fallback for older webviews. They fit above or below their invoker and stay within the visual viewport, including when the on-screen keyboard resizes it. They do not lock scrolling or trap focus; scrolling their badge out of view dismisses them.
- Theme colors, fonts, card radius and card borders follow Home Assistant's CSS variables. Controls use a flatter appearance with no decorative gradient or heavy shadow on the card. The native popover surface is elevated only enough to separate it from the dashboard.

The implementation follows [MDN's non-modal Popover API guidance](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using), [wheel-event cancellation and delta modes](https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event), [touch-action behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action), and [W3C pointer-gesture alternatives](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html). Gesture handlers are scoped to the map; they do not disable touch behavior on the document. Following [Home Assistant's custom-component guidance](https://developers.home-assistant.io/blog/2026/03/25/frontend-component-updates-2026.4/), the controls remain independent of undocumented HA popup components.

## Configuration

Only `entity` is required. The visual editor supports the optional fields below.

| Key | Meaning |
| --- | --- |
| `name` | Display name; defaults to entity friendly name |
| `show_map` | Show configured map camera; defaults to true |
| `map_entity` | Map camera entity |
| `live_camera_entity` | Optional live camera with on/off support, e.g. `camera.winky_live` |
| `live_camera_path` | Optional local path to a native camera panel; otherwise opens native camera details |
| `cleaning_mode_entity` | Cleaning-mode select entity |
| `water_level_entity` | Wetness/water number entity |
| `default_water_level` | Initial water value; defaults to 14 |
| `wash_entity`, `dry_entity`, `empty_entity` | Optional station button entities |
| `battery_entity`, `area_entity`, `time_entity` | Optional sensors used when the vacuum exposes these separately |
| `error_entity` | Optional error sensor |
| `carpet_mode_entity` | Optional carpet-mode switch |
| `main_brush_entity`, `side_brush_entity`, `filter_entity`, `sensor_cleaning_entity` | Optional consumable sensors |
| `repeats` | Room-cleaning repetitions, 1–3 |

The optional statistic and maintenance sensors override the corresponding vacuum attributes; when omitted, the card reads `battery`, `cleaned_area`, `cleaning_time`, `main_brush_left`, `side_brush_left`, `filter_left` and `sensor_dirty_left` from the vacuum. These attribute fallbacks use %, m² and minutes. Explicit sensors use their reported units, including cm²/seconds/minutes conversions. `repeats` applies to room tasks only; `default_water_level` initializes the staged water setting and is applied on starting a mopping task. The editor preserves Home Assistant layout/visibility keys.

The original Dreame card is not required. This is an independent implementation that uses existing Home Assistant entities and services. The backend integration still controls device access and availability. The map is an image preview, without zone drawing or map editing. Source timestamps can remain old while docked. Individual room customization must be disabled in the device settings when using global mode/water controls.

## Dreame and Valetudo

The general card type is `custom:dahoam-vacuum-card`; the original `custom:dahoam-dreame-card` remains a compatibility alias. Both load from the same JavaScript resource. Old dashboard cards do not need migration.

The card checks the selected vacuum's supported-feature mask and registered Home Assistant services. Unsupported commands and empty panels are hidden. Optional sensor, station and switch controls require explicitly configured, existing entities; an unavailable entity is disabled rather than treated as zero. No entity IDs or MQTT topics are guessed.

The included Valetudo example was verified against Dobby's live HA entity schemas. It provides five suction levels, carpet-mode switching, locate and spot-clean commands, battery, area/time statistics, errors, and consumable remaining hours. Area in cm² is converted to m²; seconds to minutes; consumable minutes to hours. It does not manufacture progress percentages. [Valetudo documents its optional MQTT capabilities and statistics here](https://valetudo.cloud/pages/integrations/mqtt/); the card uses the units actually reported by HA.

Dobby currently reports no map segments; no room button is shown. Valetudo room and zone commands are not implemented in this release. Dreame room cleaning remains supported through its integration service. Mopping and water controls are shown only when an appropriate cleaning-mode select is configured and reports mopping options. The card does not flash, configure, or contact Valetudo directly.

The map camera is configured explicitly, including when a separate camera integration owns it. `camera.*_map_data` entities carrying raw map data are not interchangeable with a rendered map camera; choose a camera that returns an image.

## Development

Node.js 22+ and an installed Chromium:

```sh
npm ci
BROWSER_EXECUTABLE=/path/to/chromium npm test
node --check dahoam-dreame-card.js
```

Tests use mock Home Assistant states and commands, cover scrolling stability, flyouts, map loading, room payloads, water-before-start sequencing, Valetudo capability filtering and sensor conversions, plus actual Chromium mobile touch input, cooperative wheel zoom, popup placement, keyboard focus and theme variables, and save screenshots to ignored `reports/`. No physical device is controlled. Optional `DREAME_MAP_FIXTURE` and `DOBBY_MAP_FIXTURE` environment variables accept local PNGs for visual checks; private maps are never committed.

MIT license. Not affiliated with Dreame or Home Assistant.
