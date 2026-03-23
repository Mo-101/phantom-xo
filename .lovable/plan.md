

# Integrate 17 Phantom + 17 Formal Paired Corridors

The uploaded `phantom_formal_paired.geojson` contains 162 features: 17 phantom corridors, 17 formal counterparts, ~101 nodes, 17 formal gates, and 10 IOM FMPs. Each feature has a `route_type` property (`PHANTOM`, `FORMAL`, `NODE`, `PHANTOM_POE`, `FORMAL_GATE`, `IOM_FMP`) that drives styling.

## What changes

### 1. Replace data file
Copy `phantom_formal_paired.geojson` to `public/data/corridors_paired.geojson`. This replaces `corridors_dense.geojson` as the primary corridor data source.

### 2. Rewrite `drawAllCorridors.ts`
Load `corridors_paired.geojson` instead of `corridors_dense.geojson`. Parse features by `route_type`:

- **PHANTOM** (LineString): 3-layer stack as today — glow + animated dash + spine. Color by `risk_class`. Carries existing tooltip with terrain/weather/mode info. Adds `[PHANTOM]` tag in description.
- **FORMAL** (LineString): Solid blue line (`#3B82F6`), width 3, no animation, no glow. Clean and official-looking. Description shows monitoring coverage % and gap notes from `formal_poe_coverage` property.
- **NODE** (Point): Render with existing node styling logic (start=green, end=red, phantom=gold pulsing, waypoint=gray, border=orange).
- **FORMAL_GATE** (Point): Blue diamond, 14px, labeled with gate name. Same style as existing Official POE layer.
- **IOM_FMP** (Point): Cyan circle, 10px, sized by `monthly_avg_flow`. Same style as existing crossing point markers.
- **PHANTOM_POE** (Point): Gold circle, 16px, pulsing animation.

This consolidates `drawAllCorridors`, `drawNodes`, and `drawCrossingPoints` into a single unified renderer since the GeoJSON now contains everything.

Returns updated `CorridorMeta[]` (17 phantom corridors) for legend/sidebar.

### 3. Update `corridors_meta.json`
Generate new meta from the 17 phantom corridor features in the GeoJSON (id, name, risk, km, mode, center coordinates).

### 4. Update `useCesiumMap.ts`
- Remove separate `drawNodes` and `drawCrossingPoints` calls from `loadAllCorridors`
- The single `drawAllCorridors` call now renders everything from the paired GeoJSON
- Keep evidence layer, cascade engine, borders as separate calls

### 5. Update `MapLegend.tsx`
Reorganize into two visual groups:

**MONITORED** section:
- Solid blue line — "Formal Route"
- Blue diamond — "Official Gate"
- Cyan circle — "IOM FMP"

**UNMONITORED** section:
- Animated dashed line (by risk color) — "Phantom Corridor"
- Gold pulsing circle — "Phantom POE"
- Red zone — "Gap Zone"

Add coverage stat: "Avg formal coverage: 29.4%"

### 6. Update `CorridorDetailSidebar.tsx`
When a corridor is selected, show its `formal_poe_coverage` percentage and `gap_km` prominently. Display the formal counterpart info (matching `F-{id}` route) alongside the phantom data.

## Files

| File | Action |
|---|---|
| `public/data/corridors_paired.geojson` | Copy from upload |
| `public/data/corridors_meta.json` | Regenerate from 17 phantom corridors |
| `src/hooks/cesium/drawAllCorridors.ts` | Rewrite — unified renderer for all feature types |
| `src/hooks/useCesiumMap.ts` | Simplify — single draw call replaces three |
| `src/components/dashboard/MapLegend.tsx` | Reorganize into MONITORED / UNMONITORED sections |
| `src/components/dashboard/CorridorDetailSidebar.tsx` | Add coverage gap display |

## Technical details

The GeoJSON `route_type` field drives all rendering decisions:
- `PHANTOM` → dashed risk-colored polyline stack
- `FORMAL` → solid blue polyline
- `NODE` → point with `node_type` sub-styling
- `FORMAL_GATE` → blue diamond point
- `IOM_FMP` → cyan circle point, flow-scaled
- `PHANTOM_POE` → gold pulsing point

The CZML file is available but not needed — CesiumJS entity API handles everything the CZML would provide, and keeps the rendering consistent with existing patterns.

