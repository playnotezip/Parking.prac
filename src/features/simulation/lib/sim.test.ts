import assert from 'node:assert/strict';
import test from 'node:test';
import { checkCollisionOBB } from './geometry.ts';
import { integrate, updateVelocity } from './physics.ts';
import { computeScore, isAligned, isFullyInsideSlot } from './scoring.ts';
import type { Box, ParkingSlot } from './types.ts';

const box = (x: number, y: number, angle = 0): Box => ({ center: { x, y }, w: 4, h: 2, angle });

test('SAT collision separates, overlaps and catches rotation', () => {
  assert.equal(checkCollisionOBB(box(0, 0), box(10, 0)), false);
  assert.equal(checkCollisionOBB(box(0, 0), box(3, 0)), true);

  // 4.1 apart clears a 4-long box end to end, but rotating it 45° swings a
  // corner back across the gap. A naive AABB check would miss this.
  assert.equal(checkCollisionOBB(box(0, 0), box(4.1, 0)), false);
  assert.equal(checkCollisionOBB(box(0, 0), box(4.1, 0, Math.PI / 4)), true);
});

test('gears drive, reverse, hold and brake', () => {
  assert.ok(updateVelocity(0, 'D', input({ accelerate: true })).velocity > 0);
  assert.ok(updateVelocity(0, 'R', input({ reverse: true })).velocity < 0);

  const parked = updateVelocity(1.5, 'P', input({ accelerate: true }));
  assert.equal(parked.velocity, 0);
  assert.equal(parked.isBraking, true);

  assert.ok(updateVelocity(1.5, 'D', input({ brake: true })).velocity < 1.5);
  // Braking must not push the car backwards past a standstill.
  assert.equal(updateVelocity(0.05, 'D', input({ brake: true })).velocity, 0);

  // Creep: with no key held at all, D still crawls forward.
  assert.ok(updateVelocity(0, 'D', input({})).velocity > 0);
});

test('steering turns the car, straight wheels do not', () => {
  const straight = integrate({ x: 0, y: 0, angle: 0 }, 1, 0, 50);
  assert.equal(straight.angle, 0);
  assert.ok(straight.x > 0);

  const turned = integrate({ x: 0, y: 0, angle: 0 }, 1, 0.4, 50);
  assert.ok(turned.angle > 0);
});

test('score rewards a clean fast park over a slow messy one', () => {
  const clean = computeScore({ elapsedTime: 30, collisions: 0, lineViolationTime: 0 });
  const messy = computeScore({ elapsedTime: 180, collisions: 2, lineViolationTime: 10 });
  assert.ok(clean > messy);
  assert.ok(clean <= 100);
  assert.ok(messy >= 10); // never worth nothing
});

test('a park only counts when fully inside and straight', () => {
  const slot: ParkingSlot = { center: { x: 0, y: 0 }, w: 6, h: 4, angle: 0, type: 'T-park' };
  assert.equal(isFullyInsideSlot(box(0, 0), slot), true);
  assert.equal(isFullyInsideSlot(box(20, 0), slot), false);

  assert.equal(isAligned(0, 0), true);
  assert.equal(isAligned(0.5, 0), false);
  // Wrap-around must not read as a large error.
  assert.equal(isAligned(-Math.PI + 0.01, Math.PI), true);
});

function input(overrides: Partial<Parameters<typeof updateVelocity>[2]>) {
  return { steerLeft: false, steerRight: false, accelerate: false, reverse: false, brake: false, ...overrides };
}
