import * as Cesium from "cesium";
import type { EvidenceSignal } from "./drawEvidenceLayer";

export interface CascadeState {
  day: number;
  maxDay: number;
  cumulativeScore: number;
  signalsRevealed: number;
  active: boolean;
}

/**
 * Day-by-day evidence cascade replay for a specific corridor.
 * Reveals evidence entities grouped by day offset with a timed interval.
 */
export function createCascadeEngine(
  viewer: Cesium.Viewer,
  evidenceData: EvidenceSignal[],
  evidenceEntityIds: string[]
) {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let state: CascadeState = {
    day: 0,
    maxDay: 0,
    cumulativeScore: 0,
    signalsRevealed: 0,
    active: false,
  };
  let onUpdate: ((s: CascadeState) => void) | null = null;

  function start(corridorId: string, callback: (s: CascadeState) => void) {
    stop();

    const filtered = evidenceData
      .map((e, i) => ({ ...e, entityIdx: i }))
      .filter((e) => e.cid === corridorId);

    if (filtered.length === 0) return;

    // Group by day
    const byDay = new Map<number, typeof filtered>();
    for (const e of filtered) {
      const arr = byDay.get(e.day) ?? [];
      arr.push(e);
      byDay.set(e.day, arr);
    }

    const days = Array.from(byDay.keys()).sort((a, b) => a - b);
    const maxDay = days[days.length - 1];

    state = { day: 0, maxDay, cumulativeScore: 0, signalsRevealed: 0, active: true };
    onUpdate = callback;
    callback(state);

    let dayIdx = 0;

    intervalId = setInterval(() => {
      if (dayIdx >= days.length) {
        stop();
        return;
      }

      const currentDay = days[dayIdx];
      const signals = byDay.get(currentDay) ?? [];

      for (const sig of signals) {
        const entityId = evidenceEntityIds[sig.entityIdx];
        const entity = viewer.entities.getById(entityId);
        if (entity) entity.show = true;
        state.cumulativeScore += sig.score;
        state.signalsRevealed++;
      }

      state.day = currentDay;
      onUpdate?.(state);
      dayIdx++;
    }, 2000);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    state = { ...state, active: false };
    onUpdate?.(state);
    onUpdate = null;
  }

  function hideAll() {
    for (const id of evidenceEntityIds) {
      const entity = viewer.entities.getById(id);
      if (entity) entity.show = false;
    }
  }

  return { start, stop, hideAll };
}
