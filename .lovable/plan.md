

# Implement All REST API Endpoints as Edge Functions

The Fabricate/Tonic API defines 16 endpoints. Currently the project has 6 edge functions (`cascade`, `phantom-mcp`, `ingest-signals`, `ollam-chat`, `get-maptiler-key`, `flush-database`). Many Fabricate routes are partially covered by `phantom-mcp` tools or `cascade`, but there's no direct REST API surface matching the Fabricate spec.

## Mapping: Fabricate Routes → Implementation

| Fabricate Route | Status | Implementation |
|---|---|---|
| `GET /api/corridors` | **New** | Edge function `api-corridors` — query `poe_corridors` with filters (risk, country, activated) |
| `GET /api/corridors/:id` | **New** | Same function, path param — join terrain, divergence, evidence |
| `GET /api/corridors/:id/cascade` | **Exists** | `cascade` edge function already does this |
| `GET /api/corridors/:id/evidence-chain` | **New** | Edge function `api-evidence-chain` — query `corridor_evidence_chains` |
| `GET /api/corridors/:id/friction-surface` | **New** | Edge function `api-friction` — query `friction_cells` for corridor |
| `GET /api/detections` | **New** | Edge function `api-detections` — query `poe_detection_events` with since/severity/unread filters |
| `PUT /api/detections/:id/ack` | **New** | Same function, PUT — update `acknowledged = true` |
| `GET /api/diagnostics` | **Partial** | `phantom-mcp` has `test_connections` — create dedicated `api-diagnostics` querying `diagnostic_results` |
| `GET /api/divergence` | **New** | Edge function `api-divergence` — query `poe_divergence` joined with `poe_corridors` |
| `GET /api/entropy` | **New** | Edge function `api-entropy` — query `entropy_results` with spiked/risk filters |
| `GET /api/lane` | **New** | Edge function `api-lane` — query `data_lanes` |
| `PUT /api/lane/:laneId` | **New** | Same function, PUT — switch active lane |
| `GET /api/phantom-nodes` | **New** | Edge function `api-phantom-nodes` — query `phantom_node_registry` with type/country filters |
| `GET /api/poll` | **New** | Edge function `api-poll` — master polling: corridors + detections + signals since timestamp |
| `GET /api/runs` | **New** | Edge function `api-runs` — query `ingestion_runs` |
| `GET /api/runs/:runId` | **New** | Same function, path param |
| `GET /api/signals` | **Partial** | `phantom-mcp` has `fetch_sentinel_signals` — create dedicated `api-signals` |

## Implementation approach

Create **9 edge functions** that cover all 16 routes (grouping related routes):

1. **`api-corridors`** — handles `/corridors`, `/corridors/:id`, routes to `cascade` for `/corridors/:id/cascade`
2. **`api-evidence-chain`** — `/corridors/:id/evidence-chain`
3. **`api-friction`** — `/corridors/:id/friction-surface`
4. **`api-detections`** — GET detections + PUT ack
5. **`api-diagnostics`** — latest diagnostic per service
6. **`api-divergence`** — divergence data with corridor join
7. **`api-entropy`** — entropy results with filters
8. **`api-lane`** — GET/PUT lane switching
9. **`api-poll`** — master polling endpoint combining corridors, detections, signals

The existing `phantom-mcp` tools (`fetch_sentinel_signals`, `test_connections`) and `ingest-signals` already handle signals and runs — the new functions provide the REST surface the Fabricate spec expects.

Each function follows the existing pattern: Deno `serve()`, CORS headers, service role key, query params from URL.

## Files created

| File | Purpose |
|---|---|
| `supabase/functions/api-corridors/index.ts` | List/get corridors with terrain + divergence joins |
| `supabase/functions/api-evidence-chain/index.ts` | Evidence chain for corridor |
| `supabase/functions/api-friction/index.ts` | Friction cells for corridor |
| `supabase/functions/api-detections/index.ts` | Detection events + acknowledge |
| `supabase/functions/api-diagnostics/index.ts` | Latest diagnostics per service |
| `supabase/functions/api-divergence/index.ts` | Divergence with corridor context |
| `supabase/functions/api-entropy/index.ts` | Entropy results with filters |
| `supabase/functions/api-lane/index.ts` | Lane get/switch |
| `supabase/functions/api-poll/index.ts` | Master polling endpoint |

All functions will be deployed and tested after creation.

