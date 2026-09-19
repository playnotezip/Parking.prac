import type { CarDimensions, Gear, Point } from './types';

/**
 * Tuning constants carried over verbatim from the original simulator.
 * Changing these changes how the car feels, so treat them as calibration.
 */
export const PHYSICS = {
  maxSteerAngle: 0.52,
  steerSpeed: 0.04,
  accelForce: 0.045,
  decelFriction: 0.015,
  maxSpeedForward: 2.0,
  maxSpeedReverse: 1.2,
  creepSpeed: 0.5, // Approx 10km/h scale
  creepRamp: 0.01,
  hardBrake: 0.18,
  collisionRebound: -0.4,
} as const;

export interface DriveInput {
  steerLeft: boolean;
  steerRight: boolean;
  accelerate: boolean;
  reverse: boolean;
  brake: boolean;
}

export interface Kinematics {
  x: number;
  y: number;
  angle: number;
}

/** Steering returns to centre when neither A nor D is held. */
export const updateSteering = (steerAngle: number, input: DriveInput): number => {
  const { maxSteerAngle, steerSpeed } = PHYSICS;
  if (input.steerLeft) return Math.max(-maxSteerAngle, steerAngle - steerSpeed);
  if (input.steerRight) return Math.min(maxSteerAngle, steerAngle + steerSpeed);
  if (steerAngle > 0) return Math.max(0, steerAngle - steerSpeed);
  if (steerAngle < 0) return Math.min(0, steerAngle + steerSpeed);
  return steerAngle;
};

/**
 * Throttle, brake and automatic creep. In D and R the car creeps on its own,
 * which is the behaviour the tutorial's first step teaches.
 */
export const updateVelocity = (
  velocity: number,
  gear: Gear,
  input: DriveInput
): { velocity: number; isBraking: boolean } => {
  const { accelForce, decelFriction, maxSpeedForward, maxSpeedReverse, creepSpeed, creepRamp, hardBrake } = PHYSICS;

  if (gear === 'P') {
    return { velocity: 0, isBraking: true };
  }

  if (gear === 'D') {
    if (input.brake) {
      return { velocity: Math.max(0, velocity - hardBrake), isBraking: true };
    }
    if (input.accelerate) {
      return { velocity: Math.min(maxSpeedForward, velocity + accelForce), isBraking: false };
    }
    const creeping =
      velocity < creepSpeed
        ? Math.min(creepSpeed, velocity + creepRamp)
        : Math.max(creepSpeed, velocity - decelFriction);
    return { velocity: creeping, isBraking: false };
  }

  // gear === 'R'
  if (input.brake) {
    return { velocity: Math.min(0, velocity + hardBrake), isBraking: true };
  }
  if (input.reverse) {
    return { velocity: Math.max(-maxSpeedReverse, velocity - accelForce), isBraking: false };
  }
  const creeping =
    velocity > -creepSpeed
      ? Math.max(-creepSpeed, velocity - creepRamp)
      : Math.min(-creepSpeed, velocity + decelFriction);
  return { velocity: creeping, isBraking: false };
};

/**
 * Rear-axle bicycle model: the back axle travels along the heading, and the
 * heading turns by velocity/wheelbase * tan(steer).
 */
export const integrate = (
  position: Kinematics,
  velocity: number,
  steerAngle: number,
  wheelbase: number
): Kinematics => {
  const backAxleX = position.x - (wheelbase / 2) * Math.cos(position.angle);
  const backAxleY = position.y - (wheelbase / 2) * Math.sin(position.angle);
  const newBackAxleX = backAxleX + velocity * Math.cos(position.angle);
  const newBackAxleY = backAxleY + velocity * Math.sin(position.angle);
  const angle = position.angle + (velocity / wheelbase) * Math.tan(steerAngle);

  return {
    x: newBackAxleX + (wheelbase / 2) * Math.cos(angle),
    y: newBackAxleY + (wheelbase / 2) * Math.sin(angle),
    angle,
  };
};

export interface StepState extends Kinematics {
  velocity: number;
  steerAngle: number;
  gear: Gear;
}

/** One whole frame of driving: steer, then throttle, then move. */
export const step = (state: StepState, input: DriveInput, car: CarDimensions): StepState & { isBraking: boolean } => {
  const steerAngle = updateSteering(state.steerAngle, input);
  const { velocity, isBraking } = updateVelocity(state.velocity, state.gear, input);
  const moved = integrate({ x: state.x, y: state.y, angle: state.angle }, velocity, steerAngle, car.wheelbase);
  return { ...moved, velocity, steerAngle, gear: state.gear, isBraking };
};

/** Canvas-unit dimensions for a vehicle spec, using the original divisors. */
export const toCarDimensions = (spec: { length: number; width: number; wheelbase: number }): CarDimensions => ({
  length: spec.length / 60,
  width: spec.width / 50,
  wheelbase: spec.wheelbase / 54,
});

export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
