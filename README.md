# Dahoam Vacuum Card

A compact Home Assistant custom card with a camera map, room selection, cleaning settings and station controls. Small badges open settings in focused flyouts, keeping the dashboard compact. German UI; light and dark themes use Home Assistant's theme variables.

## Install

1. Copy `dahoam-dreame-card.js` to `/config/www/dahoam-dreame-card.js`.
2. Add `/local/dahoam-dreame-card.js?v=1.3.0` as a **JavaScript module** in **Settings → Dashboards → Resources**.
3. Hard-refresh Home Assistant, then **Add card → Dahoam Dreame**. Choose the vacuum and its related entities. See `examples/winky.yaml`.

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
| `repeats` | Room-cleaning repetitions, 1–3 |

The original Dreame card is not required. This is an independent implementation that uses existing Home Assistant entities and services. The backend integration still controls device access and availability. The map is an image preview, without zone drawing or map editing. Source timestamps can remain old while docked. Individual room customization must be disabled in the device settings when using global mode/water controls.

## Development

Node.js 22+ and an installed Chromium:

```sh
npm ci
BROWSER_EXECUTABLE=/path/to/chromium npm test
node --check dahoam-dreame-card.js
```

Tests use mock Home Assistant states and commands, cover scrolling stability, flyouts, map loading, room payloads and water-before-start sequencing, and save screenshots to ignored `reports/`. No physical device is controlled. An optional `DREAME_MAP_FIXTURE` environment variable accepts a local PNG for visual checks; private maps are never committed.

MIT license. Not affiliated with Dreame or Home Assistant.
