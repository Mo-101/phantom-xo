import * as Cesium from "cesium";
import type { EvidenceSignal } from "@/lib/temporalAdapter";

export interface CascadeState {
  day: number;
  maxDay: number;
  cumulativeScore: number;
  signalsRevealed: number;
  active: boolean;
  progress: number;
  currentDate: Date | null;
  minDate: Date | null;
  maxDate: Date | null;
  corridorId: string | null;
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
  const emptyState = (): CascadeState => ({
    day: 0,
    maxDay: 0,
    cumulativeScore: 0,
    signalsRevealed: 0,
    active: false,
    progress: 0,
    currentDate: null,
    minDate: null,
    maxDate: null,
    corridorId: null,
  });

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let state: CascadeState = emptyState();
  let onUpdate: ((s: CascadeState) => void) | null = null;
  let activeCorridorId: string | null = null;
  let groupedSignals = new Map<number, Array<EvidenceSignal & { entityIdx: number }>>();
  let timelineKeys: number[] = [];
  let maxDay = 0;

  function emit(callback?: (s: CascadeState) => void) {
    (callback ?? onUpdate)?.({ ...state });
  }

  function clearTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function buildTimeline(corridorId: string) {
    const filtered = evidenceData
      .map((signal, entityIdx) => ({ ...signal, entityIdx }))
      .filter((signal) => signal.cid === corridorId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    activeCorridorId = corridorId;
    groupedSignals = new Map();
    timelineKeys = [];
    maxDay = filtered[filtered.length - 1]?.day ?? 0;

    for (const signal of filtered) {
      const timeKey = signal.timestamp.getTime();
      const bucket = groupedSignals.get(timeKey) ?? [];
      bucket.push(signal);
      groupedSignals.set(timeKey, bucket);
    }

    timelineKeys = Array.from(groupedSignals.keys()).sort((a, b) => a - b);
    return filtered.length > 0;
  }

  function resetVisibleSignals() {
    for (const id of evidenceEntityIds) {
      const entity = viewer.entities.getById(id);
      if (entity) entity.show = false;
    }
  }

  function buildStateThroughIndex(targetIndex: number, active: boolean) {
    resetVisibleSignals();

    if (!timelineKeys.length || targetIndex < 0) {
      state = {
        ...emptyState(),
        active,
        maxDay,
        corridorId: activeCorridorId,
        minDate: timelineKeys[0] ? new Date(timelineKeys[0]) : null,
        maxDate: timelineKeys.length ? new Date(timelineKeys[timelineKeys.length - 1]) : null,
      };
      return;
    }

    let cumulativeScore = 0;
    let signalsRevealed = 0;
    let day = 0;

    for (let index = 0; index <= targetIndex; index++) {
      const key = timelineKeys[index];
      const signals = groupedSignals.get(key) ?? [];
      for (const signal of signals) {
        const entity = viewer.entities.getById(evidenceEntityIds[signal.entityIdx]);
        if (entity) entity.show = true;
        cumulativeScore += signal.score;
        signalsRevealed++;
        day = Math.max(day, signal.day);
      }
    }

    state = {
      day,
      maxDay,
      cumulativeScore,
      signalsRevealed,
      active,
      progress:
        timelineKeys.length <= 1
          ? (targetIndex >= 0 ? 100 : 0)
          : (targetIndex / (timelineKeys.length - 1)) * 100,
      currentDate: new Date(timelineKeys[targetIndex]),
      minDate: new Date(timelineKeys[0]),
      maxDate: new Date(timelineKeys[timelineKeys.length - 1]),
      corridorId: activeCorridorId,
    };
  }

  function start(corridorId: string, callback: (s: CascadeState) => void) {
    stop();
    onUpdate = callback;

    if (!buildTimeline(corridorId)) {
      state = { ...emptyState(), corridorId };
      emit(callback);
      return;
    }

    let timelineIndex = 0;
    buildStateThroughIndex(0, true);
    emit(callback);

    intervalId = setInterval(() => {
      const nextIndex = timelineIndex + 1;
      if (nextIndex >= timelineKeys.length) {
        stop();
        return;
      }

      timelineIndex = nextIndex;
      buildStateThroughIndex(timelineIndex, true);
      emit();

      if (timelineIndex === timelineKeys.length - 1) {
        stop();
      }
    }, 1500);
  }

  function stop() {
    clearTimer();
    state = { ...state, active: false };
    emit();
    onUpdate = null;
  }

  function seek(corridorId: string, progress: number, callback: (s: CascadeState) => void) {
    clearTimer();
    onUpdate = callback;

    if (!buildTimeline(corridorId)) {
      state = { ...emptyState(), corridorId };
      emit(callback);
      return;
    }

    const clamped = Math.min(100, Math.max(0, progress));
    const targetIndex =
      timelineKeys.length <= 1 ? 0 : Math.round((clamped / 100) * (timelineKeys.length - 1));

    buildStateThroughIndex(targetIndex, false);
    emit(callback);
  }

  function hideAll() {
    resetVisibleSignals();
  }

  return { start, stop, hideAll, seek };
}
