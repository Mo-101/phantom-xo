import * as Cesium from "cesium";
import { type CesiumDrawContext, T } from "./types";

interface NodeProperties {
  id: string;
  name: string;
  type: string;
  color: string;
  size: number;
  showLabel: number;
}

const TYPE_CONFIG: Record<string, { pixelSize: number; showLabel: boolean; distMax?: number }> = {
  start: { pixelSize: 7, showLabel: true },
  end: { pixelSize: 7, showLabel: true },
  phantom: { pixelSize: 10, showLabel: true, distMax: 400_000 },
  border: { pixelSize: 5, showLabel: false },
  waypoint: { pixelSize: 3, showLabel: false, distMax: 300_000 },
};

/**
 * Fetch nodes.json and render typed markers on the globe.
 */
export async function drawNodes(ctx: CesiumDrawContext): Promise<void> {
  const res = await fetch("/data/nodes.json");
  const gj = await res.json();

  for (const feature of gj.features) {
    const props = feature.properties as NodeProperties;
    const [lng, lat] = feature.geometry.coordinates as [number, number];
    const cfg = TYPE_CONFIG[props.type] ?? TYPE_CONFIG.waypoint;
    const color = Cesium.Color.fromCssColorString(props.color);

    const pointOpts: Cesium.PointGraphics.ConstructorOptions = {
      pixelSize: cfg.pixelSize,
      color,
      outlineColor: Cesium.Color.fromCssColorString(T.bg),
      outlineWidth: 1.5,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    };

    if (cfg.distMax) {
      pointOpts.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(0, cfg.distMax);
    }

    const entityOpts: Cesium.Entity.ConstructorOptions = {
      position: Cesium.Cartesian3.fromDegrees(lng, lat),
      point: pointOpts,
    };

    if (cfg.showLabel && props.showLabel) {
      entityOpts.label = {
        text: props.name,
        font: '10px "IBM Plex Mono", monospace',
        fillColor: color,
        outlineColor: Cesium.Color.fromCssColorString(T.bg),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(0, -12),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        distanceDisplayCondition: cfg.distMax
          ? new Cesium.DistanceDisplayCondition(0, cfg.distMax)
          : undefined,
      };
    }

    ctx.addEntity(`node-${props.id}`, entityOpts);
  }
}
