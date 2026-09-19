import type { Box, Point } from './types';

/** Corners of an oriented bounding box, counter-clockwise from the front-right. */
export const getCorners = (box: Box): Point[] => {
  const c = Math.cos(box.angle);
  const s = Math.sin(box.angle);
  const halfW = box.w / 2;
  const halfH = box.h / 2;
  return [
    { x: box.center.x + halfW * c - halfH * s, y: box.center.y + halfW * s + halfH * c },
    { x: box.center.x - halfW * c - halfH * s, y: box.center.y - halfW * s + halfH * c },
    { x: box.center.x - halfW * c + halfH * s, y: box.center.y - halfW * s - halfH * c },
    { x: box.center.x + halfW * c + halfH * s, y: box.center.y + halfW * s - halfH * c },
  ];
};

const getAxes = (corners: Point[]): Point[] => {
  const axes: Point[] = [];
  for (let i = 0; i < 4; i++) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % 4];
    const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
    const len = Math.hypot(edge.x, edge.y);
    if (len > 0) {
      axes.push({ x: -edge.y / len, y: edge.x / len });
    }
  }
  return axes;
};

const project = (corners: Point[], axis: Point) => {
  let min = Infinity;
  let max = -Infinity;
  for (const p of corners) {
    const proj = p.x * axis.x + p.y * axis.y;
    if (proj < min) min = proj;
    if (proj > max) max = proj;
  }
  return { min, max };
};

/** Separating Axis Theorem overlap test between two oriented boxes. */
export const checkCollisionOBB = (box1: Box, box2: Box): boolean => {
  const corners1 = getCorners(box1);
  const corners2 = getCorners(box2);
  const axes = [...getAxes(corners1), ...getAxes(corners2)];

  for (const axis of axes) {
    const p1 = project(corners1, axis);
    const p2 = project(corners2, axis);
    if (p1.max < p2.min || p2.max < p1.min) {
      return false;
    }
  }
  return true;
};

export const isPointInOBB = (point: Point, box: Box): boolean => {
  const dx = point.x - box.center.x;
  const dy = point.y - box.center.y;
  const c = Math.cos(-box.angle);
  const s = Math.sin(-box.angle);
  const localX = dx * c - dy * s;
  const localY = dx * s + dy * c;
  return Math.abs(localX) <= box.w / 2 && Math.abs(localY) <= box.h / 2;
};

/** Signed smallest-magnitude difference between two headings, in radians. */
export const normalizeAngleDiff = (angle: number, target: number): number => {
  let diff = (angle - target) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
};
