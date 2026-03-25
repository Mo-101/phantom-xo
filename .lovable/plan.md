

# Wire Neon-backed POE Layer

## Overview
Replace the empty Supabase POE query with Neon's `poe_corridors` table. Three files to create/edit, one line-level export fix.

## 1. Install dependency
```
npm install @neondatabase/serverless
```

## 2. Create `src/lib/neon.ts`
Neon serverless client reading `VITE_NEON_DATABASE_URL` (already in `.env`). Exports `queryNeon<T>(query, params)` — returns `T[]`, catches errors gracefully.

## 3. Rewrite `src/hooks/mapbox/drawOfficialPOEs.ts`
- Replace `supabase` import with `queryNeon` from `@/lib/neon`
- Query `poe_corridors` with `UNION ALL` for start + end nodes
- Deduplicate by `name + lat.toFixed(3) + lng.toFixed(3)` → ~28 unique nodes
- Cleanup existing layers/source before re-adding (no `ctx.sourceIds` — just `map`)
- Three layers:
  - `official-poes-outline` — outer ring, stroke color from risk class
  - `official-poes-circle` — inner fill, green (start) / orange (end)
  - `official-poes-label` — name + country text at zoom 6+
- Export `POE_LAYER_IDS` from this file (3 IDs)

## 4. Remove `POE_LAYER_IDS` from `src/hooks/mapbox/drawCorridors.ts`
Delete line 405: `export const POE_LAYER_IDS = ["official-poes-circle", "official-poes-labels"];`

## 5. Update import in `src/hooks/useMapboxMap.ts`
```diff
- import { drawCorridors, CORRIDOR_LAYER_IDS, BORDER_LAYER_IDS, LABEL_LAYER_IDS, POE_LAYER_IDS, type CoverageStats } from "./mapbox/drawCorridors";
+ import { drawCorridors, CORRIDOR_LAYER_IDS, BORDER_LAYER_IDS, LABEL_LAYER_IDS, type CoverageStats } from "./mapbox/drawCorridors";
+ import { drawOfficialPOEs, POE_LAYER_IDS } from "./mapbox/drawOfficialPOEs";
```
(Note: `drawOfficialPOEs` is already imported on line 11 — just add `POE_LAYER_IDS` to that import and remove it from the drawCorridors import.)

## 6. Add `text` color to `src/hooks/mapbox/types.ts`
Add `text: "#E5E7EB"` to the `T` object for label color consistency.

## Files Summary

| Action | File |
|--------|------|
| Install | `@neondatabase/serverless` |
| Create | `src/lib/neon.ts` |
| Rewrite | `src/hooks/mapbox/drawOfficialPOEs.ts` |
| Edit (1 line delete) | `src/hooks/mapbox/drawCorridors.ts` |
| Edit (1 line change) | `src/hooks/useMapboxMap.ts` |
| Edit (1 property add) | `src/hooks/mapbox/types.ts` |

