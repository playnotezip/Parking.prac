export interface Point {
  x: number;
  y: number;
}

export interface Box {
  center: Point;
  w: number; // along car length
  h: number; // along car width
  angle: number;
}

export type Gear = 'P' | 'R' | 'D';

export interface ReplayFrame {
  x: number;
  y: number;
  angle: number;
  steerAngle: number;
  gear: Gear;
  velocity: number;
  brakeActive: boolean;
}

export interface Obstacle {
  id: string;
  box: Box;
  color: string;
  label?: string;
  isCar?: boolean;
  isCurb?: boolean;
}

export interface ParkingSlot {
  center: Point;
  w: number;
  h: number;
  angle: number;
  type: 'T-park' | 'parallel' | 'front' | 'diagonal';
}

export interface ParkedCar {
  id: string;
  type: 'compact' | 'sedan' | 'suv';
  color: string;
  center: Point;
  angle: number;
}

/** Physical dimensions of the player car, already scaled to canvas units. */
export interface CarDimensions {
  length: number;
  width: number;
  wheelbase: number;
}

export interface SimulationResults {
  score: number;
  elapsedTimeSeconds: number;
  collisionCount: number;
  lineViolationDurationSeconds: number;
  finalAngleOffsetDegree: number;
  isSuccess: boolean;
}

/** Everything the physics loop mutates. Lives in a ref, never in React state. */
export interface SimState {
  x: number;
  y: number;
  angle: number;
  velocity: number;
  steerAngle: number;
  gear: Gear;
  collisions: number;
  elapsedTime: number;
  lineViolationTime: number;
  lives: number;
  isComplete: boolean;
  keys: Record<string, boolean>;
  replayBuffer: ReplayFrame[];
  replayIndex: number;
  parkedFrames: number;

  // Tutorial stage booleans
  tutorialStep: number;
  tutDroveForward: boolean;
  tutDroveBackward: boolean;

  // Gear shift safety interlock
  gearWarningTime: number;

  // Performance tracking state variables
  lastParkedPct: number;
  lastLineViolationSec: number;
}
