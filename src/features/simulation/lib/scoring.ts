import { getCorners, isPointInOBB, normalizeAngleDiff } from './geometry.ts';
import type { Box, Gear, ParkingSlot } from './types';

/** Frames the car must hold a valid park before it counts (1.5s at 60fps). */
export const PARK_HOLD_FRAMES = 90;

/** ~5 degrees of heading error is still considered straight. */
export const ALIGN_TOLERANCE = 0.087;

export const SLOT_MARGIN = { length: 12, width: 8 } as const;

/** The slot grown by a forgiving margin, which is what corners are tested against. */
export const getForgivingSlotBox = (slot: ParkingSlot): Box => ({
  center: slot.center,
  w: slot.w + SLOT_MARGIN.length, // Forgiving length margin (+12px)
  h: slot.h + SLOT_MARGIN.width, //  Forgiving width margin (+8px)
  angle: slot.angle,
});

export const isFullyInsideSlot = (carBox: Box, slot: ParkingSlot): boolean => {
  const slotBox = getForgivingSlotBox(slot);
  return getCorners(carBox).every((pt) => isPointInOBB(pt, slotBox));
};

export const isAligned = (angle: number, targetHeading: number): boolean =>
  Math.abs(normalizeAngleDiff(angle, targetHeading)) < ALIGN_TOLERANCE;

export const isStopped = (gear: Gear, velocity: number): boolean => gear === 'P' && Math.abs(velocity) < 0.01;

export interface Telemetry {
  elapsedTime: number;
  collisions: number;
  lineViolationTime: number;
}

/**
 * Collisions dominate, then line violations, then time. A sub-minute park earns
 * a bonus. Floors at 10 so a finished run is never worth nothing.
 */
export const computeScore = ({ elapsedTime, collisions, lineViolationTime }: Telemetry): number => {
  const timePenalty = Math.max(0, Math.min(20, Math.floor(elapsedTime / 10)));
  const collisionPenalty = collisions * 20;
  const linePenalty = Math.floor(lineViolationTime) * 2;
  const timeBonus = elapsedTime < 60 ? 10 : elapsedTime < 120 ? 5 : 0;

  const finalScore = Math.max(10, 100 - collisionPenalty - linePenalty - timePenalty + timeBonus);
  return Math.min(100, finalScore);
};

export const toAngleOffsetDegrees = (angle: number, targetHeading: number): number =>
  (Math.abs(normalizeAngleDiff(angle, targetHeading)) * 180) / Math.PI;
