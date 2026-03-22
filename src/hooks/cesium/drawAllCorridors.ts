import * as Cesium from "cesium";
import { type CesiumDrawContext, T } from "./types";

interface CorridorMeta {
  id: string;
  name: string;
  risk: string;
  km: number;
  mode: string;
  center: [number, number];
  zoom: number;
}

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#EF4444",
  HIGH: "#F97316",
  MEDIUM: "#EAB308",
};

/**
 * Fetch corridors_dense.geojson and render all 14 corridors
 * as 3-layer polyline stacks (glow → dash → spine), risk-colored.
 */
export async function drawAllCorridors(ctx: CesiumDrawContext): Promise<CorridorMeta[]> {
  const [geoRes, metaRes] = await Promise.all([
    fetch("/data/corridors_dense.geojson"),
    fetch("/data/corridors_meta.json"),
  ]);

  const geo = await geoRes.json();
  const meta: CorridorMeta[] = await metaRes.json();
  const metaMap = new Map(meta.map((m) => [m.id, m]));

  for (const feature of geo.features) {
    const id = feature.properties.id as string;
    const risk = feature.properties.risk as string;
    const color = RISK_COLORS[risk] ?? T.green;
    const cesiumColor = Cesium.Color.fromCssColorString(color);

    // GeoJSON coords are [lng, lat]
    const coords: number[] = feature.geometry.coordinates.flatMap(
      (c: [number, number]) => [c[0], c[1]]
    );
    const positions = Cesium.Cartesian3.fromDegreesArray(coords);

    // Layer 3: Glow ribbon
    ctx.addEntity(`corr-${id}-glow`, {
      polyline: {
        positions,
        clampToGround: true,
        width: 20,
        material: cesiumColor.withAlpha(0.06),
      },
    });

    // Layer 2: Animated dash
    let dashOffset = 0;
    ctx.addEntity(`corr-${id}-dash`, {
      polyline: {
        positions,
        clampToGround: true,
        width: 4,
        material: new Cesium.PolylineDashMaterialProperty({
          color: cesiumColor.withAlpha(0.6),
          dashLength: 18,
          dashPattern: new Cesium.CallbackProperty(() => {
            dashOffset = (dashOffset + 1) % 16;
            const base = 0xff00;
            return ((base << dashOffset) | (base >>> (16 - dashOffset))) & 0xffff;
          }, false) as any,
        }),
      },
    });

    // Layer 1: Solid spine
    ctx.addEntity(`corr-${id}-spine`, {
      polyline: {
        positions,
        clampToGround: true,
        width: 1.5,
        material: cesiumColor,
      },
    });
  }

  return meta;
}
