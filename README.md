# Dahoam Vacuum Card

A compact Home Assistant custom card with a camera map, room selection, cleaning settings and station controls. Small badges open settings in focused flyouts, keeping the dashboard compact. German UI; light and dark themes use Home Assistant's theme variables.

## Install

1. Copy `dahoam-dreame-card.js` to `/config/www/dahoam-dreame-card.js`.
2. Add `/local/dahoam-dreame-card.js?v=1.4.0` as a **JavaScript module** in **Settings → Dashboards → Resources**.
3. Hard-refresh Home Assistant, then **Add card → Dahoam Vacuum**. Choose the vacuum and its related entities. See `examples/winky.yaml` and `examples/dobby.yaml`.

No build step or runtime dependencies. Existing `custom:dahoam-dreame-card` configurations continue to work. Do not edit Home Assistant's `.storage` files.

## Controls

- Start, pause/resume, stop and return to station.
- Map preview, zoom and manual refresh. Camera images refresh every 10 seconds during cleaning and every 30 seconds otherwise while the page is visible.
- **Rooms**, **Cleaning**, **Station** and **Maintenance** badges open modal flyouts. Escape, Done or the close button dismisses them.
- Cleaning mode includes vacuum, mop, vacuum+mop, and mop after vacuum, depending on the configured integration's options.
- Water level defaults to **14**. The range follows the configured number entity; tested with a Dreame device exposing 1–32.
- Mode and water are applied when starting a new whole-home or room task. Resume keeps the current task's settings. If preparation fails, cleaning does not start.
- Suction changes apply immediately. Dock buttons retain their integration's start/pause or start/stop behavior.

## Configuration

Only `entity` is required. The visual editor supports the optional fields below.

| Key | Meaning |
| --- | --- |
| `name` | Display name; defaults to entity friendly name |
| `show_map` | Show configured map camera; defaults to true |
| `map_entity` | Map camera entity |
| `cleaning_mode_entity` | Cleaning-mode select entity |
| `water_level_entity` | Wetness/water number entity |
| `default_water_level` | Initial water value; defaults to 14 |
| `wash_entity`, `dry_entity`, `empty_entity` | Optional station button entities |
| `battery_entity`, `area_entity`, `time_entity` | Optional sensors used when the vacuum exposes these separately |
| `error_entity` | Optional error sensor |
| `carpet_mode_entity` | Optional carpet-mode switch |
| `main_brush_entity`, `side_brush_entity`, `filter_entity`, `sensor_cleaning_entity` | Optional consumable sensors |
| `repeats` | Room-cleaning repetitions, 1–3 |

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

Tests use mock Home Assistant states and commands, cover scrolling stability, flyouts, map loading, room payloads, water-before-start sequencing, Valetudo capability filtering and sensor conversions, and save screenshots to ignored `reports/`. No physical device is controlled. An optional `DREAME_MAP_FIXTURE` environment variable accepts a local PNG for visual checks; private maps are never committed.

MIT license. Not affiliated with Dreame or Home Assistant.
