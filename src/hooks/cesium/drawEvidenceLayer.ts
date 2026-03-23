import * as Cesium from "cesium";
import { fetchTemporalSignals, type EvidenceSignal } from "@/lib/temporalAdapter";
import { type CesiumDrawContext, T } from "./types";

const SOURCE_COLORS: Record<string, string> = {
  ACLED: "#EF4444",
  "IOM-DTM": "#3B82F6",
  DHIS2: "#22C55E",
  "AFRO-SENTINEL": "#A855F7",
};

function getSignalColor(signal: EvidenceSignal) {
  if (signal.signalType === "FLOW") return "#3B82F6";
  if (signal.signalType.includes("CONFLICT")) return "#EF4444";
  if (signal.signalType.includes("SURGE")) return "#F97316";
  if (signal.signalType.includes("HEALTH")) return "#22C55E";
  return SOURCE_COLORS[signal.src] ?? "#9CA3AF";
}

/**
 * Fetch temporal evidence and create hidden point entities.
 * Returns toggle function and the data array.
 */
export async function drawEvidenceLayer(
  ctx: CesiumDrawContext
): Promise<{ data: EvidenceSignal[]; entityIds: string[] }> {
  const data = await fetchTemporalSignals();
  const entityIds: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const e = data[i];
    const color = Cesium.Color.fromCssColorString(getSignalColor(e));
    const size = 6 + (e.score / 100) * 10; // 6–16px
    const entId = `evid-${i}`;
    entityIds.push(entId);

    ctx.addEntity(entId, {
      position: Cesium.Cartesian3.fromDegrees(e.lng, e.lat),
      show: false,
      point: {
        pixelSize: size,
        color: color.withAlpha(0.7),
        outlineColor: Cesium.Color.fromCssColorString(T.bg),
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      label: {
        text: e.label,
        font: '10px "IBM Plex Mono",monospace',
        fillColor: color,
        outlineColor: Cesium.Color.fromCssColorString(T.bg),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(0, size / 2 + 8),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(1.0e4, 1.0, 3.0e6, 0.35),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2.2e6),
      },
      description: e.desc,
      properties: {
        corridorId: e.cid,
        signalType: e.signalType,
        source: e.source,
        score: e.score,
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
