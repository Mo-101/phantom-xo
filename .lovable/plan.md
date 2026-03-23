

# Enrich Tooltips, Fix Legend, and Densify Corridor Paths

Three issues identified from reviewing the current code and data:

## Problem 1: Tooltips lack movement intelligence
Current tooltips show terrain, weather, and mode but miss the key operational data — estimated monthly people flow, vehicle/canoe counts, market activity, and contributing factors. The GeoJSON properties don't carry this data.

## Problem 2: Legend symbols don't match map
The legend renders tiny CSS shapes (3 small dots for "dash", a rotated square for "diamond") that don't visually correspond to what users see on the Cesium globe (animated flowing dashes, large pulsing circles, etc.).

## Problem 3: Corridors appear as straight lines
Each corridor has only 3-9 coordinate points with linear interpolation. The previous version used `corridors_dense.geojson` which had many more waypoints following real terrain. Need to densify coordinates using geodesic arc interpolation so lines curve naturally across the globe.

---

## Plan

### 1. Add movement estimates to GeoJSON properties and enrich tooltips
Add per-corridor estimated movement data to `corridors_paired.geojson` — properties like `est_monthly_people`, `est_vehicles_day`, `est_canoe_crossings`, `market_days`, `conflict_factor`, `health_risk`, and `key_commodities` based on IOM DTM data and corridor characteristics.

Update `drawPhantomCorridor()` tooltip HTML to display:
- **Movement Volume**: est. people/month, vehicles/day or canoe crossings/day
- **Market Activity**: market days, key commodities traded across border
- **Contributing Factors**: conflict displacement, seasonal labor, pastoralism
- **Health Risk**: mpox, cholera, measles vector potential
- **Infrastructure**: nearest health post distance, mobile coverage

Update `drawFormalRoute()` tooltip to also show flow volume comparison (what formal system captures vs estimated total).

### 2. Redesign legend to match actual map visuals
Update `MapLegend.tsx` legend shapes:
- **Formal Route**: proper solid line (not just a bar)
- **Phantom Corridor**: animated gradient bar mimicking the dashed flow
- **Official Gate**: blue square with white border (matching the point on map)
- **Phantom POE**: gold circle with CSS pulse animation matching the Cesium pulse
- **IOM FMP**: cyan circle with subtle ring (matching the flow ring on map)
- **Gap Zone**: semi-transparent red rectangle with border

Add a small "coverage gap" visual indicator showing 29.4% vs 70.6%.

### 3. Densify corridor coordinates with geodesic interpolation
Add a `densifyLine()` utility function in `drawAllCorridors.ts` that takes a sparse coordinate array and interpolates additional points along geodesic arcs (great-circle paths). Target ~30-50 points per corridor so lines follow the globe curvature naturally instead of appearing as straight segments between 3-5 waypoints.

Apply to both PHANTOM and FORMAL LineString features before converting to Cesium positions.

---

## Files to modify

| File | Change |
|---|---|
| `public/data/corridors_paired.geojson` | Add movement estimate properties to all 17 PHANTOM + 17 FORMAL features |
| `src/hooks/cesium/drawAllCorridors.ts` | Add `densifyLine()` function; enrich tooltip HTML with movement/market/health data |
| `src/components/dashboard/MapLegend.tsx` | Redesign legend shapes to match actual Cesium rendering |

## Technical details

**Geodesic densification**: For each pair of consecutive coordinates, compute intermediate points along the great-circle arc using spherical interpolation. For a corridor with N original points, insert enough intermediates to reach ~40 total points. This makes lines curve naturally on the 3D globe.

```text
Before:  A ——————————— B ——————————— C   (3 points, straight)
After:   A · · · · · · B · · · · · · C   (40 points, curved)
```

**Movement data structure** (added to GeoJSON properties):
```json
{
  "est_monthly_people": 35000,
  "est_vehicles_day": 0,
  "est_canoe_crossings_day": 45,
  "market_days": "Mon/Thu",
  "key_commodities": "fish, cassava, fuel",
  "conflict_factor": "M23 displacement",
  "health_risk": "mpox, cholera",
  "nearest_health_km": 67
}
```

