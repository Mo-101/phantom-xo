import * as Cesium from "cesium";
import { type CesiumDrawContext, T } from "./types";

export interface EvidenceSignal {
  cid: string;
  day: number;
  lat: number;
  lng: number;
  src: string;
  score: number;
  desc: string;
}

const SOURCE_COLORS: Record<string, string> = {
  ACLED: "#EF4444",
  "IOM-DTM": "#3B82F6",
  DHIS2: "#22C55E",
  "AFRO-SENTINEL": "#A855F7",
};

/**
 * Fetch evidence.json and create hidden point entities.
 * Returns toggle function and the data array.
 */
export async function drawEvidenceLayer(
  ctx: CesiumDrawContext
): Promise<{ data: EvidenceSignal[]; entityIds: string[] }> {
  const res = await fetch("/data/evidence.json");
  const data: EvidenceSignal[] = await res.json();
  const entityIds: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const e = data[i];
    const color = Cesium.Color.fromCssColorString(SOURCE_COLORS[e.src] ?? "#9CA3AF");
    const size = 6 + (e.score / 100) * 10; // 6–16px
    const entId = `evid-${i}`;
    entityIds.push(entId);

    ctx.addEntity(entId, {
      position: Cesium.Cartesian3.fromDegrees(e.lng, e.lat),
      show: false, // hidden by default
      point: {
        pixelSize: size,
        color: color.withAlpha(0.7),
        outlineColor: Cesium.Color.fromCssColorString(T.bg),
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
  }

  return { data, entityIds };
}

/**
 * Toggle visibility of evidence entities
 */
export function toggleEvidenceEntities(
  viewer: Cesium.Viewer,
  entityIds: string[],
  visible: boolean
): void {
  for (const id of entityIds) {
    const entity = viewer.entities.getById(id);
    if (entity) entity.show = visible;
  }
}
