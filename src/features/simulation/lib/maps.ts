import { vehicles } from '../components/VehicleSelector';
import type { Obstacle, ParkedCar, ParkingSlot } from './types';

export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;

const PARKED_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#6b7280', '#e2e8f0', '#0f172a', '#a855f7', '#ec4899', '#06b6d4'];
const PARKED_TYPES = ['compact', 'sedan', 'suv'] as const;

export const getVehicle = (carType: string) => vehicles.find((v) => v.id === carType) || vehicles[1];

/** Canvas-unit footprint of a vehicle, using the original divisors. */
export const getCarFootprint = (carType: string) => {
  const spec = getVehicle(carType);
  return { carLength: spec.length / 60, carWidth: spec.width / 50 };
};

export const getStartPosition = (mapId: string, modeId: string) => {
  let startX = 150;
  let startY = 300; // 양쪽 주차 구역의 정중앙선 지점
  let startAngle = 0; // 오른쪽 방향 정방향 응시

  if (modeId === 'tutorial') {
    startX = 150;
    startY = 300;
    startAngle = 0;
  } else {
    if (mapId === 'rear') { startX = 150; startY = 300; startAngle = 0; }
    else if (mapId === 'front') { startX = 200; startY = 300; startAngle = 0; }
    else if (mapId === 'parallel') { startX = 150; startY = 320; startAngle = 0; }
    else if (mapId === 'diagonal') { startX = 150; startY = 300; startAngle = 0; }
  }

  return { x: startX, y: startY, angle: startAngle };
};

/**
 * Surrounding vehicles, re-randomised on every start/reset so the player never
 * memorises one exact layout. Offsets model imperfectly parked neighbours.
 */
export const createParkedCars = (mapId: string, modeId: string, carType: string): ParkedCar[] => {
  const { carLength, carWidth } = getCarFootprint(carType);
  const cars: ParkedCar[] = [];

  const makeRandomCar = (id: string, baseCenter: { x: number; y: number }, angle: number): ParkedCar => {
    const type = PARKED_TYPES[Math.floor(Math.random() * PARKED_TYPES.length)];
    const color = PARKED_COLORS[Math.floor(Math.random() * PARKED_COLORS.length)];
    // Random position offsets representing realistic imperfect parking
    const offsetX = (Math.random() - 0.5) * 5;
    const offsetY = (Math.random() - 0.5) * 7;
    const offsetAngle = (Math.random() - 0.5) * 0.05;

    return {
      id,
      type,
      color,
      center: { x: baseCenter.x + offsetX, y: baseCenter.y + offsetY },
      angle: angle + offsetAngle,
    };
  };

  if (mapId === 'rear' || modeId === 'tutorial') {
    const targetX = modeId === 'tutorial' ? 450 : 400;
    const targetY = modeId === 'tutorial' ? 480 : 445;
    const slotWidth = carWidth + 14;

    const indices = [-3, -2, -1, 1, 2, 3];
    indices.forEach((idx) => {
      cars.push(makeRandomCar(`rear_parked_${idx}`, { x: targetX + idx * slotWidth, y: targetY }, Math.PI / 2));
    });

    // 왼쪽(지도 상단)에도 주차 차량들을 꽉 채워서 대칭적으로 추가
    const targetYTop = modeId === 'tutorial' ? 120 : 155;
    for (let idx = -3; idx <= 3; idx++) {
      cars.push(makeRandomCar(`rear_top_parked_${idx}`, { x: targetX + idx * slotWidth, y: targetYTop }, Math.PI / 2));
    }
  } else if (mapId === 'front') {
    const targetX = 450;
    const targetY = 445;
    const targetYTop = 155;
    const slotWidth = carWidth + 12;

    const indices = [-3, -2, -1, 1, 2, 3];
    indices.forEach((idx) => {
      cars.push(makeRandomCar(`front_parked_${idx}`, { x: targetX + idx * slotWidth, y: targetY }, Math.PI / 2));
    });
    for (let idx = -3; idx <= 3; idx++) {
      cars.push(makeRandomCar(`front_top_parked_${idx}`, { x: targetX + idx * slotWidth, y: targetYTop }, Math.PI / 2));
    }
  } else if (mapId === 'parallel') {
    const targetX = 500;
    const targetY = 390;
    const targetYTop = 210;
    const slotWidth = carLength + 20;

    const indices = [-2, -1, 1];
    indices.forEach((idx) => {
      cars.push(makeRandomCar(`parallel_parked_${idx}`, { x: targetX + idx * slotWidth, y: targetY }, 0));
    });
    [-2, -1, 0, 1].forEach((idx) => {
      cars.push(makeRandomCar(`parallel_top_parked_${idx}`, { x: targetX + idx * slotWidth, y: targetYTop }, 0));
    });
  } else if (mapId === 'diagonal') {
    const targetX = 450;
    const targetY = 430;
    const targetYTop = 170;
    const horizontalSpacing = 70; // 45도 회전 시 적절한 수평 간격

    const indices = [-3, -2, -1, 1, 2, 3];
    indices.forEach((idx) => {
      cars.push(makeRandomCar(`diagonal_parked_${idx}`, { x: targetX + idx * horizontalSpacing, y: targetY }, Math.PI / 4));
    });
    for (let idx = -3; idx <= 3; idx++) {
      cars.push(makeRandomCar(`diagonal_top_parked_${idx}`, { x: targetX + idx * horizontalSpacing, y: targetYTop }, -Math.PI / 4));
    }
  }

  return cars;
};

const DEFAULT_WALLS: Obstacle[] = [
  { id: 'wall_top', box: { center: { x: 400, y: 40 }, w: 800, h: 30, angle: 0 }, color: '#333b47' },
  { id: 'wall_bottom', box: { center: { x: 400, y: 560 }, w: 800, h: 30, angle: 0 }, color: '#333b47' },
  { id: 'wall_left', box: { center: { x: 15, y: 300 }, w: 30, h: 600, angle: 0 }, color: '#333b47' },
  { id: 'wall_right', box: { center: { x: 785, y: 300 }, w: 30, h: 600, angle: 0 }, color: '#333b47' },
];

export const getMapObstacles = (mapId: string, modeId: string, parkedCars: ParkedCar[]): Obstacle[] => {
  // Build obstacles list dynamically from the randomized parkedCars
  const dynamicObstacles: Obstacle[] = parkedCars.map((car) => {
    const spec = vehicles.find((v) => v.type === car.type) || vehicles[1];
    return {
      id: car.id,
      box: { center: car.center, w: spec.length / 60, h: spec.width / 50, angle: car.angle },
      color: car.color,
      isCar: true,
    };
  });

  // If tutorial mode, enforce default tutorial layout and ignore mapId
  if (modeId === 'tutorial') {
    return [...DEFAULT_WALLS, ...dynamicObstacles];
  }

  if (mapId === 'rear') {
    return [
      ...DEFAULT_WALLS,
      { id: 'pillar_1', box: { center: { x: 200, y: 180 }, w: 40, h: 40, angle: 0 }, color: '#555f6d', label: 'P1' },
      { id: 'pillar_2', box: { center: { x: 600, y: 180 }, w: 40, h: 40, angle: 0 }, color: '#555f6d', label: 'P2' },
      ...dynamicObstacles,
    ];
  }

  if (mapId === 'parallel') {
    return [
      { id: 'curb_top', box: { center: { x: 400, y: 94.5 }, w: 800, h: 189, angle: 0 }, color: '#334155', isCurb: true },
      { id: 'curb_bottom', box: { center: { x: 400, y: 505.5 }, w: 800, h: 189, angle: 0 }, color: '#334155', isCurb: true },
      { id: 'wall_left', box: { center: { x: 15, y: 300 }, w: 30, h: 600, angle: 0 }, color: '#1e293b' },
      { id: 'wall_right', box: { center: { x: 785, y: 300 }, w: 30, h: 600, angle: 0 }, color: '#1e293b' },
      ...dynamicObstacles,
    ];
  }

  // front, diagonal and any fallback share the plain walled lot
  return [...DEFAULT_WALLS, ...dynamicObstacles];
};

export const getTargetSlot = (mapId: string, modeId: string, carType: string): ParkingSlot => {
  const { carLength, carWidth } = getCarFootprint(carType);
  const slotW = carLength + 8;
  const slotH = carWidth + 6;

  if (modeId === 'tutorial') {
    return { center: { x: 450, y: 480 }, w: slotW, h: slotH, angle: Math.PI / 2, type: 'T-park' };
  }
  if (mapId === 'front') {
    return { center: { x: 450, y: 445 }, w: slotW, h: slotH, angle: Math.PI / 2, type: 'front' };
  }
  if (mapId === 'parallel') {
    return { center: { x: 500, y: 390 }, w: slotW + 12, h: slotH, angle: 0, type: 'parallel' };
  }
  if (mapId === 'diagonal') {
    return { center: { x: 450, y: 430 }, w: slotW, h: slotH, angle: Math.PI / 4, type: 'diagonal' };
  }
  return { center: { x: 400, y: 445 }, w: slotW, h: slotH, angle: Math.PI / 2, type: 'T-park' };
};

/** Heading the car must settle into for the park to count as aligned. */
export const getTargetHeading = (mapId: string, modeId: string, slot: ParkingSlot): number => {
  if (modeId === 'tutorial' || mapId === 'rear') return -Math.PI / 2; // rear park (facing up/out)
  if (mapId === 'front') return Math.PI / 2; // front park (facing down/in)
  if (mapId === 'parallel') return 0; // facing right
  if (mapId === 'diagonal') return Math.PI / 4; // facing down-right
  return slot.angle;
};
