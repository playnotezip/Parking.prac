'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, Volume2, VolumeX, Eye, Heart, Sparkles, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { vehicles, Vehicle } from './VehicleSelector';

interface Point {
  x: number;
  y: number;
}

interface Box {
  center: Point;
  w: number; // along car length
  h: number; // along car width
  angle: number;
}

interface ReplayFrame {
  x: number;
  y: number;
  angle: number;
  steerAngle: number;
  gear: 'P' | 'R' | 'D';
  velocity: number;
  brakeActive: boolean;
}

interface SimulatorCanvasProps {
  carType: string;
  mapId: string;
  modeId: string; // 'practice' | 'survival' | 'hard' | 'tutorial'
  isReplayActive: boolean;
  onComplete: (results: {
    score: number;
    elapsedTimeSeconds: number;
    collisionCount: number;
    lineViolationDurationSeconds: number;
    finalAngleOffsetDegree: number;
    isSuccess: boolean;
  }) => void;
  onReplayFinished: () => void;
  canvasRef?: React.MutableRefObject<any>;
}

export default function SimulatorCanvas({
  carType,
  mapId,
  modeId,
  isReplayActive,
  onComplete,
  onReplayFinished,
  canvasRef: externalRef,
}: SimulatorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const carConfig = vehicles.find((v) => v.id === carType) || vehicles[1];

  // Game States (Gears are simplified to P, D, R)
  const [gear, setGear] = useState<'P' | 'R' | 'D'>('D');
  const [collisions, setCollisions] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [lineViolationTime, setLineViolationTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const viewMode = '3rd';
  const [parkedTimer, setParkedTimer] = useState<number>(0);

  // Tutorial Progress State
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  const [tutDroveForward, setTutDroveForward] = useState<boolean>(false);
  const [tutDroveBackward, setTutDroveBackward] = useState<boolean>(false);

  // Lives State
  const initialLives = modeId === 'survival' ? 3 : modeId === 'hard' ? 1 : 999;
  const [lives, setLives] = useState<number>(initialLives);

  // Ref for surrounding vehicles randomized at start/reset
  const parkedCarsRef = useRef<any[]>([]);

  const initRandomParkedCars = (selectedCarType: string) => {
    const carConfig = vehicles.find((v) => v.id === selectedCarType) || vehicles[1];
    const carLength = carConfig.length / 60;
    const carWidth = carConfig.width / 50;

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#6b7280', '#e2e8f0', '#0f172a', '#a855f7', '#ec4899', '#06b6d4'];
    const types = ['compact', 'sedan', 'suv'] as const;
    
    const cars: any[] = [];
    
    const makeRandomCar = (id: string, baseCenter: { x: number; y: number }, angle: number) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      // Random position offsets representing realistic imperfect parking
      const offsetX = (Math.random() - 0.5) * 5;
      const offsetY = (Math.random() - 0.5) * 7;
      const offsetAngle = (Math.random() - 0.5) * 0.05;
      
      return {
        id,
        type,
        color,
        center: { x: baseCenter.x + offsetX, y: baseCenter.y + offsetY },
        angle: angle + offsetAngle
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

    parkedCarsRef.current = cars;
  };

  // References for physics loop
  const stateRef = useRef({
    x: 150,
    y: 300,
    angle: 0,
    velocity: 0,
    steerAngle: 0,
    gear: 'D' as 'P' | 'R' | 'D',
    collisions: 0,
    elapsedTime: 0,
    lineViolationTime: 0,
    lives: initialLives,
    isComplete: false,
    keys: {} as Record<string, boolean>,
    replayBuffer: [] as ReplayFrame[],
    replayIndex: 0,
    parkedFrames: 0,
    
    // Tutorial stage booleans
    tutorialStep: 1,
    tutDroveForward: false,
    tutDroveBackward: false,

    // Gear shift safety interlock
    gearWarningTime: 0,

    // Performance tracking state variables
    lastParkedPct: 0,
    lastLineViolationSec: 0,
  });

  // Sound generator helpers
  const playBeep = (freq: number, duration: number) => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio Context failed:', e);
    }
  };

  const playSuccessChime = () => {
    playBeep(880, 0.1);
    setTimeout(() => playBeep(1320, 0.15), 100);
  };

  // Reset/Initialize State depending on Map & Mode
  useEffect(() => {
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

    initRandomParkedCars(carType);

    stateRef.current = {
      x: startX,
      y: startY,
      angle: startAngle,
      velocity: 0,
      steerAngle: 0,
      gear: 'D',
      collisions: 0,
      elapsedTime: 0,
      lineViolationTime: 0,
      lives: initialLives,
      isComplete: false,
      keys: {},
      replayBuffer: [],
      replayIndex: 0,
      parkedFrames: 0,
      
      tutorialStep: 1,
      tutDroveForward: false,
      tutDroveBackward: false,
      gearWarningTime: 0,
      lastParkedPct: 0,
      lastLineViolationSec: 0,
    };

    setGear('D');
    setCollisions(0);
    setElapsedTime(0);
    setLineViolationTime(0);
    setParkedTimer(0);
    setLives(initialLives);
    setTutorialStep(1);
    setTutDroveForward(false);
    setTutDroveBackward(false);
  }, [mapId, carType, modeId, initialLives]);

  // Sync React gear state to physics ref
  useEffect(() => {
    stateRef.current.gear = gear;
  }, [gear]);

  // Canvas Grid Constants
  const mapWidth = 800;
  const mapHeight = 600;

  // Obstacle Definitions
  interface Obstacle {
    id: string;
    box: Box;
    color: string;
    label?: string;
    isCar?: boolean;
    isCurb?: boolean;
  }

  const getMapObstacles = (): Obstacle[] => {
    const carConfig = vehicles.find((v) => v.id === carType) || vehicles[1];
    const carLength = carConfig.length / 60;
    const carWidth = carConfig.width / 50;

    const defaultWalls: Obstacle[] = [
      { id: 'wall_top', box: { center: { x: 400, y: 40 }, w: 800, h: 30, angle: 0 }, color: '#333b47' },
      { id: 'wall_bottom', box: { center: { x: 400, y: 560 }, w: 800, h: 30, angle: 0 }, color: '#333b47' },
      { id: 'wall_left', box: { center: { x: 15, y: 300 }, w: 30, h: 600, angle: 0 }, color: '#333b47' },
      { id: 'wall_right', box: { center: { x: 785, y: 300 }, w: 30, h: 600, angle: 0 }, color: '#333b47' },
    ];

    // Build obstacles list dynamically from the randomized parkedCars ref
    const dynamicObstacles: Obstacle[] = parkedCarsRef.current.map((car) => {
      const spec = vehicles.find((v) => v.type === car.type) || vehicles[1];
      const w = spec.length / 60;
      const h = spec.width / 50;
      return {
        id: car.id,
        box: { center: car.center, w, h, angle: car.angle },
        color: car.color,
        isCar: true
      };
    });

    // If tutorial mode, enforce default tutorial layout and ignore mapId
    if (modeId === 'tutorial') {
      return [
        ...defaultWalls,
        ...dynamicObstacles,
      ];
    }

    if (mapId === 'rear' && modeId !== 'tutorial') {
      return [
        ...defaultWalls,
        { id: 'pillar_1', box: { center: { x: 200, y: 180 }, w: 40, h: 40, angle: 0 }, color: '#555f6d', label: 'P1' },
        { id: 'pillar_2', box: { center: { x: 600, y: 180 }, w: 40, h: 40, angle: 0 }, color: '#555f6d', label: 'P2' },
        ...dynamicObstacles,
      ];
    } else if (mapId === 'front') {
      return [
        ...defaultWalls,
        ...dynamicObstacles,
      ];
    } else if (mapId === 'parallel') {
      return [
        { id: 'curb_top', box: { center: { x: 400, y: 94.5 }, w: 800, h: 189, angle: 0 }, color: '#334155', isCurb: true },
        { id: 'curb_bottom', box: { center: { x: 400, y: 505.5 }, w: 800, h: 189, angle: 0 }, color: '#334155', isCurb: true },
        { id: 'wall_left', box: { center: { x: 15, y: 300 }, w: 30, h: 600, angle: 0 }, color: '#1e293b' },
        { id: 'wall_right', box: { center: { x: 785, y: 300 }, w: 30, h: 600, angle: 0 }, color: '#1e293b' },
        ...dynamicObstacles,
      ];
    } else if (mapId === 'diagonal') {
      return [
        ...defaultWalls,
        ...dynamicObstacles,
      ];
    }

    // Default/tutorial map obstacles
    return [
      ...defaultWalls,
      ...dynamicObstacles,
    ];
  };

  // Target Parking Slot Definition
  interface ParkingSlot {
    center: Point;
    w: number;
    h: number;
    angle: number;
    type: 'T-park' | 'parallel' | 'front';
  }

  const getTargetSlot = (): ParkingSlot => {
    const carConfig = vehicles.find((v) => v.id === carType) || vehicles[1];
    const carLength = carConfig.length / 60;
    const carWidth = carConfig.width / 50;
    const slotW = carLength + 8;
    const slotH = carWidth + 6;

    if (modeId === 'tutorial') {
      return { center: { x: 450, y: 480 }, w: slotW, h: slotH, angle: Math.PI / 2, type: 'T-park' };
    }
    if (mapId === 'rear') {
      return { center: { x: 400, y: 445 }, w: slotW, h: slotH, angle: Math.PI / 2, type: 'T-park' };
    } else if (mapId === 'front') {
      return { center: { x: 450, y: 445 }, w: slotW, h: slotH, angle: Math.PI / 2, type: 'front' };
    } else if (mapId === 'parallel') {
      return { center: { x: 500, y: 390 }, w: slotW + 12, h: slotH, angle: 0, type: 'parallel' };
    } else if (mapId === 'diagonal') {
      return { center: { x: 450, y: 430 }, w: slotW, h: slotH, angle: Math.PI / 4, type: 'diagonal' as any };
    }
    return { center: { x: 400, y: 445 }, w: slotW, h: slotH, angle: Math.PI / 2, type: 'T-park' };
  };

  // Math Helpers for OBB Box calculation (Separating Axis Theorem)
  const getCorners = (box: Box): Point[] => {
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

  const checkCollisionOBB = (box1: Box, box2: Box): boolean => {
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

  const isPointInOBB = (point: Point, box: Box): boolean => {
    const dx = point.x - box.center.x;
    const dy = point.y - box.center.y;
    const c = Math.cos(-box.angle);
    const s = Math.sin(-box.angle);
    const localX = dx * c - dy * s;
    const localY = dx * s + dy * c;
    return Math.abs(localX) <= box.w / 2 && Math.abs(localY) <= box.h / 2;
  };

  // Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReplayActive) return;
      const key = e.key.toLowerCase();
      stateRef.current.keys[key] = true;

      // Keyboard handler viewMode toggling disabled (1st person removed)
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      stateRef.current.keys[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isReplayActive]);

  // Mouse Wheel Gear Scroll (Simplified to P, D, R)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isReplayActive || stateRef.current.isComplete) return;
      e.preventDefault();

      // Lock gear during Step 1 of tutorial
      if (modeId === 'tutorial' && stateRef.current.tutorialStep === 1) {
        return;
      }

      const gears: ('P' | 'D' | 'R')[] = ['P', 'D', 'R'];
      const currentIdx = gears.indexOf(stateRef.current.gear);

      let nextIdx = currentIdx;
      if (e.deltaY < 0) {
        nextIdx = Math.max(0, currentIdx - 1);
      } else {
        nextIdx = Math.min(2, currentIdx + 1);
      }

      if (nextIdx !== currentIdx) {
        // Enforce brake safety interlock (Spacebar) to change gears
        const isBraking = stateRef.current.keys[' '] || stateRef.current.keys['spacebar'];
        if (!isBraking) {
          stateRef.current.gearWarningTime = 120; // Show warning for 2 seconds
          playBeep(300, 0.15); // Warning buzzer tone
          return;
        }
        setGear(gears[nextIdx]);
        playBeep(600 + nextIdx * 100, 0.08);
      }
    };

    const canvas = canvasElementRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isReplayActive, modeId]);

  // Main Loop
  useEffect(() => {
    const canvas = canvasElementRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let collisionCooldown = 0;
    let secondsTimerCounter = 0;

    const loop = () => {
      const state = stateRef.current;
      const obstacles = getMapObstacles();
      const targetSlot = getTargetSlot();

      const carLength = carConfig.length / 60;
      const carWidth = carConfig.width / 50;
      const carWheelbase = carConfig.wheelbase / 54;

      // 1. Calculate corners and alignment for slot validation
      const carBox: Box = {
        center: { x: state.x, y: state.y },
        w: carLength,
        h: carWidth,
        angle: state.angle,
      };
      const corners = getCorners(carBox);
      const slotBox: Box = {
        center: targetSlot.center,
        w: targetSlot.w + 12, // Forgiving length margin (+12px)
        h: targetSlot.h + 8,  // Forgiving width margin (+8px)
        angle: targetSlot.angle,
      };
      const allCornersIn = corners.every((pt) => isPointInOBB(pt, slotBox));
      
      let targetHeading = targetSlot.angle;
      if (modeId === 'tutorial' || mapId === 'rear') {
        targetHeading = -Math.PI / 2; // rear park (facing up/out)
      } else if (mapId === 'front') {
        targetHeading = Math.PI / 2;  // front park (facing down/in)
      } else if (mapId === 'parallel') {
        targetHeading = 0;            // facing right
      } else if (mapId === 'diagonal') {
        targetHeading = Math.PI / 4;  // facing down-right
      }

      let diff = (state.angle - targetHeading) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      
      const angleDiff = diff;
      const aligned = Math.abs(angleDiff) < 0.087; // approx 5 degrees

      if (collisionCooldown > 0) collisionCooldown--;

      // ----------------------------------------------------
      // REPLAY OR PLAY physics updates
      // ----------------------------------------------------
      let isBraking = false;

      if (isReplayActive) {
        // REPLAY
        if (state.replayBuffer.length > 0) {
          const frame = state.replayBuffer[state.replayIndex];
          state.x = frame.x;
          state.y = frame.y;
          state.angle = frame.angle;
          state.steerAngle = frame.steerAngle;
          state.gear = frame.gear;
          state.velocity = frame.velocity;
          isBraking = frame.brakeActive;

          state.replayIndex = (state.replayIndex + 1) % state.replayBuffer.length;
          if (state.replayIndex === 0) {
            onReplayFinished();
          }
        }
      } else if (!state.isComplete) {
        // PLAY MODE PHYSICS
        secondsTimerCounter++;
        if (secondsTimerCounter >= 60) {
          state.elapsedTime++;
          setElapsedTime(state.elapsedTime);
          secondsTimerCounter = 0;

          if (state.elapsedTime >= 300 && modeId !== 'tutorial') {
            state.isComplete = true;
            onComplete({
              score: 0,
              elapsedTimeSeconds: 300,
              collisionCount: state.collisions,
              lineViolationDurationSeconds: state.lineViolationTime,
              finalAngleOffsetDegree: 90,
              isSuccess: false,
            });
          }
        }

        // Steer Angle (A / D)
        const targetSteerMax = 0.52;
        const steerSpeed = 0.04;
        if (state.keys['a']) {
          state.steerAngle = Math.max(-targetSteerMax, state.steerAngle - steerSpeed);
        } else if (state.keys['d']) {
          state.steerAngle = Math.min(targetSteerMax, state.steerAngle + steerSpeed);
        } else {
          if (state.steerAngle > 0) state.steerAngle = Math.max(0, state.steerAngle - steerSpeed);
          else if (state.steerAngle < 0) state.steerAngle = Math.min(0, state.steerAngle + steerSpeed);
        }

        // Speed Control (W / S / Spacebar)
        const accelForce = 0.045;
        const decelFriction = 0.015;
        const maxSpeedForward = 2.0;
        const maxSpeedReverse = 1.2;
        const creepSpeed = 0.5; // Approx 10km/h scale

        const isSpacePressed = state.keys[' '] || state.keys['spacebar'];

        if (state.gear === 'D') {
          if (isSpacePressed) {
            isBraking = true;
            state.velocity = Math.max(0, state.velocity - 0.18); // Hard brake
          } else if (state.keys['w']) {
            state.velocity = Math.min(maxSpeedForward, state.velocity + accelForce);
          } else {
            // Creep driving forward
            if (state.velocity < creepSpeed) {
              state.velocity = Math.min(creepSpeed, state.velocity + 0.01);
            } else {
              state.velocity = Math.max(creepSpeed, state.velocity - decelFriction);
            }
          }
        } else if (state.gear === 'R') {
          if (isSpacePressed) {
            isBraking = true;
            state.velocity = Math.min(0, state.velocity + 0.18); // Hard brake
          } else if (state.keys['s']) {
            state.velocity = Math.max(-maxSpeedReverse, state.velocity - accelForce);
          } else {
            // Creep driving backward
            if (state.velocity > -creepSpeed) {
              state.velocity = Math.max(-creepSpeed, state.velocity - 0.01);
            } else {
              state.velocity = Math.min(-creepSpeed, state.velocity + decelFriction);
            }
          }
        } else if (state.gear === 'P') {
          isBraking = true;
          state.velocity = 0;
        }

        // Apply Rollback on collision
        const prevX = state.x;
        const prevY = state.y;
        const prevAngle = state.angle;

        const backAxleX = state.x - (carWheelbase / 2) * Math.cos(state.angle);
        const backAxleY = state.y - (carWheelbase / 2) * Math.sin(state.angle);
        const newBackAxleX = backAxleX + state.velocity * Math.cos(state.angle);
        const newBackAxleY = backAxleY + state.velocity * Math.sin(state.angle);
        const dAngle = (state.velocity / carWheelbase) * Math.tan(state.steerAngle);
        const newAngle = state.angle + dAngle;

        state.x = newBackAxleX + (carWheelbase / 2) * Math.cos(newAngle);
        state.y = newBackAxleY + (carWheelbase / 2) * Math.sin(newAngle);
        state.angle = newAngle;

        // Collision Check (OBB vs OBB)
        const updatedCarBox: Box = {
          center: { x: state.x, y: state.y },
          w: carLength,
          h: carWidth,
          angle: state.angle,
        };

        let collided = false;
        for (const obs of obstacles) {
          if (checkCollisionOBB(updatedCarBox, obs.box)) {
            collided = true;
            break;
          }
        }

        if (collided) {
          state.x = prevX;
          state.y = prevY;
          state.angle = prevAngle;
          state.velocity = -state.velocity * 0.4; // Rebound

          if (collisionCooldown === 0) {
            state.collisions++;
            setCollisions(state.collisions);
            collisionCooldown = 45;
            playBeep(250, 0.25);

            // Handle Lives depletion in Survival & Hard modes
            if (modeId === 'survival' || modeId === 'hard') {
              state.lives--;
              setLives(state.lives);

              if (state.lives <= 0) {
                state.isComplete = true;
                onComplete({
                  score: 0,
                  elapsedTimeSeconds: state.elapsedTime,
                  collisionCount: state.collisions,
                  lineViolationDurationSeconds: state.lineViolationTime,
                  finalAngleOffsetDegree: 90,
                  isSuccess: false,
                });
              }
            }
          }
        }

        // Line Violation Check (Checking if we overlap map boundary lines)
        let isViolating = false;
        if (state.x < 30 || state.x > mapWidth - 30 || state.y < 30 || state.y > mapHeight - 30) {
          isViolating = true;
        }
        if (isViolating) {
          state.lineViolationTime += 1 / 60;
          const currentViolationSec = Math.floor(state.lineViolationTime);
          if (currentViolationSec !== state.lastLineViolationSec) {
            state.lastLineViolationSec = currentViolationSec;
            setLineViolationTime(currentViolationSec);
          }
        }

        // Record Replay
        state.replayBuffer.push({
          x: state.x,
          y: state.y,
          angle: state.angle,
          steerAngle: state.steerAngle,
          gear: state.gear,
          velocity: state.velocity,
          brakeActive: isBraking,
        });

        // ----------------------------------------------------
        // TUTORIAL STEP ACTIONS & MISSIONS CHECK
        // ----------------------------------------------------
        if (modeId === 'tutorial') {
          if (state.tutorialStep === 1) {
            // Step 1: Creep drive forward, press Spacebar to stop at the stop line (x: 300)
            const nearStopLine = state.x >= 270 && state.x <= 330;
            const stopped = Math.abs(state.velocity) < 0.01 && isSpacePressed;
            
            if (nearStopLine && stopped) {
              state.tutorialStep = 2;
              setTutorialStep(2);
              playSuccessChime();
              toast({
                title: '1단계 통과!',
                description: '정지선 제동 완료. 다음 단계: D로 전진 후 R로 바꾸어 후진해보세요!',
              });
            }
          } else if (state.tutorialStep === 2) {
            // Step 2: D gear forward, then R gear reverse
            if (state.gear === 'D' && state.velocity > 0.8) {
              state.tutDroveForward = true;
              setTutDroveForward(true);
            }
            if (state.tutDroveForward && state.gear === 'R' && state.velocity < -0.8) {
              state.tutDroveBackward = true;
              setTutDroveBackward(true);
            }
            if (state.tutDroveForward && state.tutDroveBackward) {
              state.tutorialStep = 4; // Bypassing step 3
              setTutorialStep(4);
              playSuccessChime();
              toast({
                title: '2단계 통과!',
                description: '전진 및 후진 성공. 최종 단계: 초록 주차 구역 안에 주차 후 P 기어를 1.5초간 유지하세요!',
              });
            }
          } else if (state.tutorialStep === 4) {
            // Step 4: Normal parking success
            const isParked = state.gear === 'P' && Math.abs(state.velocity) < 0.01;
            if (allCornersIn && aligned && isParked) {
              state.parkedFrames++;
              const currentPct = Math.min(100, Math.round((state.parkedFrames / 90) * 100));
              if (currentPct !== state.lastParkedPct) {
                state.lastParkedPct = currentPct;
                setParkedTimer(currentPct);
              }
              if (state.parkedFrames % 30 === 0 && state.parkedFrames < 90) {
                playBeep(1200, 0.05);
              }
              if (state.parkedFrames >= 90) {
                state.isComplete = true;
                playSuccessChime();
                onComplete({
                  score: 100,
                  elapsedTimeSeconds: state.elapsedTime,
                  collisionCount: state.collisions,
                  lineViolationDurationSeconds: state.lineViolationTime,
                  finalAngleOffsetDegree: 0,
                  isSuccess: true,
                });
              }
            } else {
              state.parkedFrames = 0;
              if (state.lastParkedPct !== 0) {
                state.lastParkedPct = 0;
                setParkedTimer(0);
              }
            }
          }
        } else {
          // NORMAL GAME MODE SUCCESS CHECK
          const isParked = state.gear === 'P' && Math.abs(state.velocity) < 0.01;
          if (allCornersIn && aligned && isParked) {
            state.parkedFrames++;
            const currentPct = Math.min(100, Math.round((state.parkedFrames / 90) * 100));
            if (currentPct !== state.lastParkedPct) {
              state.lastParkedPct = currentPct;
              setParkedTimer(currentPct);
            }

            if (state.parkedFrames % 30 === 0 && state.parkedFrames < 90) {
              playBeep(1200, 0.05);
            }

            if (state.parkedFrames >= 90) {
              state.isComplete = true;
              playBeep(2000, 0.5);

              // Calculate final stats
              const timePenalty = Math.max(0, Math.min(20, Math.floor(state.elapsedTime / 10)));
              const collisionPenalty = state.collisions * 20;
              const linePenalty = Math.floor(state.lineViolationTime) * 2;
              const timeBonus = state.elapsedTime < 60 ? 10 : state.elapsedTime < 120 ? 5 : 0;
              
              let finalScore = Math.max(10, 100 - collisionPenalty - linePenalty - timePenalty + timeBonus);
              if (finalScore > 100) finalScore = 100;

              const finalAngleOffset = (Math.abs(angleDiff) * 180) / Math.PI;

              onComplete({
                score: finalScore,
                elapsedTimeSeconds: state.elapsedTime,
                collisionCount: state.collisions,
                lineViolationDurationSeconds: state.lineViolationTime,
                finalAngleOffsetDegree: finalAngleOffset,
                isSuccess: true,
              });
            }
          } else {
            state.parkedFrames = 0;
            if (state.lastParkedPct !== 0) {
              state.lastParkedPct = 0;
              setParkedTimer(0);
            }
          }
        }
      }

      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

      // ----------------------------------------------------
      // DRAW CANVAS SCENE WITH CAMERA VIEW TRANSFORM
      // ----------------------------------------------------
      ctx.fillStyle = isDark ? '#1a1c23' : '#e2e8f0'; // asphalt texture background
      ctx.fillRect(0, 0, mapWidth, mapHeight);

      // Save context for transformed rendering (3rd/1st camera view)
      ctx.save();
      
      // 3인칭 카메라: 차량 뒤쪽 위에 고정되어 따라다님 (돌발 회전/떨림 보정 앵커링)
      ctx.translate(mapWidth / 2, mapHeight / 2 + 125);
      ctx.scale(1.2, 1.2);
      ctx.rotate(-state.angle - Math.PI / 2);
      ctx.translate(-state.x, -state.y);

      // Draw Grid Pattern (inside transformed view)
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = -800; x < mapWidth + 800; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -600);
        ctx.lineTo(x, mapHeight + 1200);
        ctx.stroke();
      }
      for (let y = -600; y < mapHeight + 1200; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-800, y);
        ctx.lineTo(mapWidth + 800, y);
        ctx.stroke();
      }

      // Draw Tutorial Stop Line if in Step 1 (inside transformed view)
      if (modeId === 'tutorial' && state.tutorialStep === 1) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(300, 150);
        ctx.lineTo(300, 450);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('정지선 (STOP LINE)', 310, 220);
        ctx.restore();
      }

      // Helper Draw Elements function
      const drawMapElements = (renderCtx: CanvasRenderingContext2D, isDark: boolean) => {
        // Draw asphalt parking lines (white grids)
        renderCtx.save();
        renderCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.35)';
        renderCtx.lineWidth = 2.5;

        if (mapId === 'rear' || modeId === 'tutorial') {
          const drawSlotsX = modeId === 'tutorial' ? 450 : 400;
          const drawSlotsY = modeId === 'tutorial' ? 480 : 445;
          const slotWidth = carWidth + 14;
          const slotW = carLength + 8;
          
          // 하단 주차 구역선 그리기
          for (let i = -3.5; i <= 3.5; i++) {
            const lx = drawSlotsX + i * slotWidth;
            renderCtx.beginPath();
            renderCtx.moveTo(lx, drawSlotsY - slotW / 2);
            renderCtx.lineTo(lx, drawSlotsY + slotW / 2);
            renderCtx.stroke();
          }
          renderCtx.beginPath();
          renderCtx.moveTo(drawSlotsX - 3.5 * slotWidth, drawSlotsY - slotW / 2);
          renderCtx.lineTo(drawSlotsX + 3.5 * slotWidth, drawSlotsY - slotW / 2);
          renderCtx.stroke();

          // 상단(왼쪽) 주차 구역선 대칭적으로 그리기
          const drawSlotsYTop = modeId === 'tutorial' ? 120 : 155;
          for (let i = -3.5; i <= 3.5; i++) {
            const lx = drawSlotsX + i * slotWidth;
            renderCtx.beginPath();
            renderCtx.moveTo(lx, drawSlotsYTop - slotW / 2);
            renderCtx.lineTo(lx, drawSlotsYTop + slotW / 2);
            renderCtx.stroke();
          }
          renderCtx.beginPath();
          renderCtx.moveTo(drawSlotsX - 3.5 * slotWidth, drawSlotsYTop + slotW / 2);
          renderCtx.lineTo(drawSlotsX + 3.5 * slotWidth, drawSlotsYTop + slotW / 2);
          renderCtx.stroke();
        } else if (mapId === 'front') {
          const drawSlotsX = 450;
          const drawSlotsY = 445;
          const drawSlotsYTop = 155;
          const slotWidth = carWidth + 12;
          const slotW = carLength + 8;
          
          // 하단 전면 주차선
          for (let i = -3.5; i <= 3.5; i++) {
            const lx = drawSlotsX + i * slotWidth;
            renderCtx.beginPath();
            renderCtx.moveTo(lx, drawSlotsY - slotW / 2);
            renderCtx.lineTo(lx, drawSlotsY + slotW / 2);
            renderCtx.stroke();
          }
          renderCtx.beginPath();
          renderCtx.moveTo(drawSlotsX - 3.5 * slotWidth, drawSlotsY - slotW / 2);
          renderCtx.lineTo(drawSlotsX + 3.5 * slotWidth, drawSlotsY - slotW / 2);
          renderCtx.stroke();

          // 상단 전면 주차선 (대칭)
          for (let i = -3.5; i <= 3.5; i++) {
            const lx = drawSlotsX + i * slotWidth;
            renderCtx.beginPath();
            renderCtx.moveTo(lx, drawSlotsYTop - slotW / 2);
            renderCtx.lineTo(lx, drawSlotsYTop + slotW / 2);
            renderCtx.stroke();
          }
          renderCtx.beginPath();
          renderCtx.moveTo(drawSlotsX - 3.5 * slotWidth, drawSlotsYTop + slotW / 2);
          renderCtx.lineTo(drawSlotsX + 3.5 * slotWidth, drawSlotsYTop + slotW / 2);
          renderCtx.stroke();
        } else if (mapId === 'parallel') {
          const drawSlotsX = 500;
          const drawSlotsY = 390;
          const drawSlotsYTop = 210;
          const slotWidth = carLength + 20;
          const slotH = carWidth + 6;
          
          // 하단 평행 주차선
          renderCtx.beginPath();
          renderCtx.moveTo(0, drawSlotsY - slotH / 2);
          renderCtx.lineTo(mapWidth, drawSlotsY - slotH / 2);
          renderCtx.stroke();
          renderCtx.beginPath();
          renderCtx.moveTo(0, drawSlotsY + slotH / 2);
          renderCtx.lineTo(mapWidth, drawSlotsY + slotH / 2);
          renderCtx.stroke();

          for (let i = -2.5; i <= 1.5; i++) {
            const lx = drawSlotsX + i * slotWidth;
            renderCtx.beginPath();
            renderCtx.moveTo(lx, drawSlotsY - slotH / 2);
            renderCtx.lineTo(lx, drawSlotsY + slotH / 2);
            renderCtx.stroke();
          }

          // 상단 평행 주차선 (대칭)
          renderCtx.beginPath();
          renderCtx.moveTo(0, drawSlotsYTop - slotH / 2);
          renderCtx.lineTo(mapWidth, drawSlotsYTop - slotH / 2);
          renderCtx.stroke();
          renderCtx.beginPath();
          renderCtx.moveTo(0, drawSlotsYTop + slotH / 2);
          renderCtx.lineTo(mapWidth, drawSlotsYTop + slotH / 2);
          renderCtx.stroke();

          for (let i = -2.5; i <= 1.5; i++) {
            const lx = drawSlotsX + i * slotWidth;
            renderCtx.beginPath();
            renderCtx.moveTo(lx, drawSlotsYTop - slotH / 2);
            renderCtx.lineTo(lx, drawSlotsYTop + slotH / 2);
            renderCtx.stroke();
          }
        } else if (mapId === 'diagonal') {
          const drawSlotsX = 450;
          const drawSlotsY = 430;
          const drawSlotsYTop = 170;
          const slotWidth = 70;
          const slotW = carLength + 8;
          const slotH = carWidth + 14;

          // 하단 45도 주차선
          for (let i = -3.5; i <= 3.5; i++) {
            const lx = drawSlotsX + i * slotWidth;
            renderCtx.save();
            renderCtx.translate(lx, drawSlotsY);
            renderCtx.rotate(Math.PI / 4);
            renderCtx.beginPath();
            renderCtx.moveTo(-slotW / 2, 0);
            renderCtx.lineTo(slotW / 2, 0);
            renderCtx.stroke();
            renderCtx.restore();
          }
          renderCtx.beginPath();
          renderCtx.moveTo(drawSlotsX - 3.5 * slotWidth, drawSlotsY + 30);
          renderCtx.lineTo(drawSlotsX + 3.5 * slotWidth, drawSlotsY + 30);
          renderCtx.stroke();

          // 상단 45도 주차선 (대칭)
          for (let i = -3.5; i <= 3.5; i++) {
            const lx = drawSlotsX + i * slotWidth;
            renderCtx.save();
            renderCtx.translate(lx, drawSlotsYTop);
            renderCtx.rotate(-Math.PI / 4);
            renderCtx.beginPath();
            renderCtx.moveTo(-slotW / 2, 0);
            renderCtx.lineTo(slotW / 2, 0);
            renderCtx.stroke();
            renderCtx.restore();
          }
          renderCtx.beginPath();
          renderCtx.moveTo(drawSlotsX - 3.5 * slotWidth, drawSlotsYTop - 30);
          renderCtx.lineTo(drawSlotsX + 3.5 * slotWidth, drawSlotsYTop - 30);
          renderCtx.stroke();
        }
        renderCtx.restore();

        // Draw slot outline
        const isTargetGlowing = allCornersIn && aligned;
        const shouldDrawSlot = modeId !== 'tutorial' || state.tutorialStep === 4;

        if (shouldDrawSlot) {
          renderCtx.strokeStyle = isTargetGlowing ? '#00ffc7' : 'rgba(0, 255, 199, 0.4)';
          renderCtx.lineWidth = 3;
          renderCtx.setLineDash([6, 4]);

          const sBox = targetSlot;
          renderCtx.save();
          renderCtx.translate(sBox.center.x, sBox.center.y);
          renderCtx.rotate(sBox.angle);
          renderCtx.strokeRect(-sBox.w / 2, -sBox.h / 2, sBox.w, sBox.h);
          
          renderCtx.fillStyle = isTargetGlowing ? 'rgba(0, 255, 199, 0.08)' : 'rgba(0, 255, 199, 0.02)';
          renderCtx.fillRect(-sBox.w / 2, -sBox.h / 2, sBox.w, sBox.h);
          renderCtx.restore();
          renderCtx.setLineDash([]);
        }

        // Draw Obstacles
        for (const obs of obstacles) {
          renderCtx.save();
          renderCtx.translate(obs.box.center.x, obs.box.center.y);
          renderCtx.rotate(obs.box.angle);

          if (obs.isCar) {
            renderCtx.fillStyle = obs.color;
            renderCtx.fillRect(-obs.box.w / 2, -obs.box.h / 2, obs.box.w, obs.box.h);

            // Car details
            renderCtx.fillStyle = '#0f172a';
            renderCtx.fillRect(obs.box.w * 0.1, -obs.box.h * 0.4, obs.box.w * 0.25, obs.box.h * 0.8);
            renderCtx.fillRect(-obs.box.w * 0.35, -obs.box.h * 0.4, obs.box.w * 0.2, obs.box.h * 0.8);
            
            renderCtx.fillStyle = '#1e293b';
            renderCtx.fillRect(obs.box.w / 2 - 4, -obs.box.h / 2 + 2, 4, obs.box.h - 4);
            renderCtx.fillRect(-obs.box.w / 2, -obs.box.h / 2 + 2, 4, obs.box.h - 4);
          } else if (obs.isCurb) {
            renderCtx.fillStyle = obs.color;
            renderCtx.fillRect(-obs.box.w / 2, -obs.box.h / 2, obs.box.w, obs.box.h);
            renderCtx.fillStyle = '#94a3b8';
            renderCtx.fillRect(-obs.box.w / 2, obs.box.h / 2 - 6, obs.box.w, 6);
          } else {
            renderCtx.fillStyle = obs.color;
            renderCtx.fillRect(-obs.box.w / 2, -obs.box.h / 2, obs.box.w, obs.box.h);

            renderCtx.strokeStyle = '#ffc700';
            renderCtx.lineWidth = 2;
            renderCtx.strokeRect(-obs.box.w / 2, -obs.box.h / 2, obs.box.w, obs.box.h);

            if (obs.label) {
              renderCtx.save();
              renderCtx.rotate(-obs.box.angle);
              renderCtx.fillStyle = '#ffffff';
              renderCtx.font = '10px sans-serif';
              renderCtx.textAlign = 'center';
              renderCtx.textBaseline = 'middle';
              renderCtx.fillText(obs.label, 0, 0);
              renderCtx.restore();
            }
          }
          renderCtx.restore();
        }

        // Draw Helper arrow from car to slot in Step 4 of tutorial
        if (modeId === 'tutorial' && state.tutorialStep === 4) {
          renderCtx.save();
          renderCtx.strokeStyle = '#00ffc7';
          renderCtx.lineWidth = 2;
          renderCtx.setLineDash([4, 4]);
          
          renderCtx.beginPath();
          renderCtx.moveTo(state.x, state.y);
          renderCtx.lineTo(targetSlot.center.x, targetSlot.center.y);
          renderCtx.stroke();
          renderCtx.restore();
        }
      };

      // Draw map elements & stop lines inside camera coordinate systems
      drawMapElements(ctx, isDark);

      // Helper Draw Car Function
      const drawCar = (renderCtx: CanvasRenderingContext2D, cX: number, cY: number, cAngle: number, cSteer: number, cGear: 'P'|'R'|'D', cVelocity: number) => {
        renderCtx.save();
        renderCtx.translate(cX, cY);
        renderCtx.rotate(cAngle);

        // Headlight cones
        if (cGear !== 'P') {
          renderCtx.save();
          const gradient = renderCtx.createRadialGradient(
            carLength / 2, 0, 10,
            carLength / 2 + 120, 0, 80
          );
          gradient.addColorStop(0, 'rgba(255, 199, 0, 0.35)');
          gradient.addColorStop(1, 'rgba(255, 199, 0, 0.0)');
          renderCtx.fillStyle = gradient;
          renderCtx.beginPath();
          renderCtx.moveTo(carLength / 2, -10);
          renderCtx.lineTo(carLength / 2 + 130, -50);
          renderCtx.lineTo(carLength / 2 + 130, 50);
          renderCtx.lineTo(carLength / 2, 10);
          renderCtx.closePath();
          renderCtx.fill();
          renderCtx.restore();
        }

        // Tires
        renderCtx.fillStyle = '#090a0f';
        const tireW = 14;
        const tireH = 6;
        const wheelYOffset = carWidth / 2 - 2;

        renderCtx.fillRect(-carWheelbase / 2 - tireW / 2, -wheelYOffset - tireH / 2, tireW, tireH);
        renderCtx.fillRect(-carWheelbase / 2 - tireW / 2, wheelYOffset - tireH / 2, tireW, tireH);

        const drawFrontTire = (yOffset: number) => {
          renderCtx.save();
          renderCtx.translate(carWheelbase / 2, yOffset);
          renderCtx.rotate(cSteer);
          renderCtx.fillRect(-tireW / 2, -tireH / 2, tireW, tireH);
          renderCtx.restore();
        };
        drawFrontTire(-wheelYOffset);
        drawFrontTire(wheelYOffset);

        // Car Frame Body
        renderCtx.fillStyle = carConfig.color;
        renderCtx.beginPath();
        renderCtx.roundRect(-carLength / 2, -carWidth / 2, carLength, carWidth, 8);
        renderCtx.fill();
        
        renderCtx.strokeStyle = '#090a0f';
        renderCtx.lineWidth = 1.5;
        renderCtx.stroke();

        // Glass cabin
        renderCtx.fillStyle = '#1e293b';
        renderCtx.beginPath();
        renderCtx.roundRect(-carLength * 0.15, -carWidth * 0.35, carLength * 0.45, carWidth * 0.7, 4);
        renderCtx.fill();

        renderCtx.fillStyle = '#334155';
        renderCtx.beginPath();
        renderCtx.roundRect(-carLength * 0.35, -carWidth * 0.3, carLength * 0.15, carWidth * 0.6, 2);
        renderCtx.fill();

        renderCtx.fillStyle = 'rgba(255,255,255,0.15)';
        renderCtx.fillRect(carLength * 0.15, -carWidth * 0.25, 4, carWidth * 0.5);

        // Lights
        renderCtx.fillStyle = '#fffae6';
        renderCtx.fillRect(carLength / 2 - 3, -carWidth * 0.35, 3, 5);
        renderCtx.fillRect(carLength / 2 - 3, carWidth * 0.35 - 5, 3, 5);

        // Taillights
        const isBrakingActive = isBraking || (cGear === 'P');
        renderCtx.fillStyle = isBrakingActive ? '#ff3b30' : cGear === 'R' ? '#ffffff' : '#991b1b';
        renderCtx.fillRect(-carLength / 2, -carWidth * 0.38, 3, 6);
        renderCtx.fillRect(-carLength / 2, carWidth * 0.38 - 6, 3, 6);

        // Side mirrors
        renderCtx.fillStyle = carConfig.color;
        renderCtx.fillRect(carLength * 0.2, -carWidth / 2 - 4, 3, 4);
        renderCtx.fillRect(carLength * 0.2, carWidth / 2, 3, 4);

        renderCtx.restore();
      };
      // Draw car body in 3rd person top-down view
      drawCar(ctx, state.x, state.y, state.angle, state.steerAngle, state.gear, state.velocity);

      ctx.restore(); // Restore back to screen-space coordinates

      // ----------------------------------------------------
      // DRAW FLASH / ANNOUNCEMENTS
      // ----------------------------------------------------
      if (collisionCooldown > 30) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, mapWidth, mapHeight);
      }

      // Parking lock count overlay
      if (parkedTimer > 0 && parkedTimer < 100) {
        ctx.save();
        ctx.fillStyle = 'rgba(12, 13, 18, 0.9)';
        ctx.beginPath();
        ctx.roundRect(mapWidth / 2 - 120, 200, 240, 60, 16);
        ctx.fill();
        ctx.strokeStyle = '#00ffc7';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('주차 완료 대기 중...', mapWidth / 2, 225);

        ctx.fillStyle = '#262930';
        ctx.fillRect(mapWidth / 2 - 80, 235, 160, 8);
        ctx.fillStyle = '#00ffc7';
        ctx.fillRect(mapWidth / 2 - 80, 235, 1.6 * parkedTimer, 8);
        ctx.restore();
      }

      // ----------------------------------------------------
      // TUTORIAL SCREEN LAYOUT SPLIT (UI 겹침 해결)
      // ----------------------------------------------------
      if (modeId === 'tutorial') {
        const topBarY = 25;
        const missionCardY = topBarY;
        const controlsCardY = mapHeight - 80;

        // 1. Top Mission Card
        ctx.save();
        ctx.fillStyle = 'rgba(18, 18, 18, 0.92)';
        ctx.strokeStyle = 'rgba(0, 255, 199, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(40, missionCardY, mapWidth - 80, 52, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00ffc7';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`현재 미션 (STAGE ${state.tutorialStep === 4 ? 3 : state.tutorialStep} / 3)`, 55, missionCardY + 17);

        ctx.fillStyle = '#E9ECEF';
        ctx.font = 'bold 13px sans-serif';
        let descText = '';
        if (state.tutorialStep === 1) {
          descText = '가만히 있어도 차가 시속 10km로 움직입니다. [Spacebar]를 눌러 지정된 정지선에 멈춰보세요!';
        } else if (state.tutorialStep === 2) {
          descText = 'D 기어로 W를 누르면 전진 가속, 기어를 R로 변경하고 S를 누르면 후진 가속합니다.';
        } else if (state.tutorialStep === 4) {
          descText = '초록 칸에 차를 넣고 기어를 P로 바꾸면 주차가 완료됩니다.';
        }
        ctx.fillText(descText, 55, missionCardY + 36);
        ctx.restore();

        // 2. Bottom Controls Card
        ctx.save();
        ctx.fillStyle = 'rgba(18, 18, 18, 0.92)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(40, controlsCardY, mapWidth - 80, 60, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00ffc7';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('조작법 가이드 및 현재 조건 만족 상태', 55, controlsCardY + 18);

        ctx.fillStyle = '#E9ECEF';
        ctx.font = '12px sans-serif';
        let missionText = '';
        if (state.tutorialStep === 1) {
          missionText = '[Spacebar] 키를 누르면 브레이크가 작동합니다.';
        } else if (state.tutorialStep === 2) {
          missionText = `[W] 전진 및 [S] 후진. (D 전진 완료: ${state.tutDroveForward ? '성공' : '대기'} ➔ R 후진 완료: ${state.tutDroveBackward ? '성공' : '대기'})`;
        } else if (state.tutorialStep === 4) {
          missionText = '초록 칸에 차를 정렬하여 정차한 후, 기어를 P로 전환해 1.5초 대기하면 최종 완수됩니다.';
        }
        ctx.fillText(missionText, 55, controlsCardY + 38);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px sans-serif';
        ctx.fillText('기본 단축키: W/S 가속, A/D 조향, Spacebar 긴급 브레이크 제동, 마우스 휠 기어 스크롤링', 55, controlsCardY + 53);
        ctx.restore();
      }

      // ----------------------------------------------------
      // DRAW VERTICAL GEAR SHIFTER (세로형 기어 표시 시스템)
      // ----------------------------------------------------
      const shifterX = mapWidth - 65;
      const shifterY = mapHeight - 170;
      const shifterW = 45;
      const shifterH = 140;

      ctx.save();
      // Shifter box container
      ctx.fillStyle = 'rgba(18, 18, 18, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(shifterX, shifterY, shifterW, shifterH, 16);
      ctx.fill();
      ctx.stroke();

      // Shifter central line track
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(shifterX + shifterW / 2, shifterY + 20);
      ctx.lineTo(shifterX + shifterW / 2, shifterY + shifterH - 20);
      ctx.stroke();

      const shifterGears = ['P', 'D', 'R'] as const;
      shifterGears.forEach((g, idx) => {
        const itemY = shifterY + 25 + idx * 45;
        const isCurrent = gear === g;

        // Glowing circle indicator
        if (isCurrent) {
          ctx.shadowColor = '#00ffc7';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#00ffc7';
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#212529';
        }

        ctx.beginPath();
        ctx.arc(shifterX + shifterW / 2, itemY, 15, 0, Math.PI * 2);
        ctx.fill();

        // Border outline
        ctx.strokeStyle = isCurrent ? '#00ffc7' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(shifterX + shifterW / 2, itemY, 15, 0, Math.PI * 2);
        ctx.stroke();

        // Gear Text Character
        ctx.shadowBlur = 0;
        ctx.fillStyle = isCurrent ? '#090a0f' : '#8a94a6';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(g, shifterX + shifterW / 2, itemY);
      });
      ctx.restore();

      // ----------------------------------------------------
      // DRAW SPEEDOMETER NEXT TO SHIFTER
      // ----------------------------------------------------
      ctx.save();
      const speedX = shifterX - 15;
      const speedY = shifterY + shifterH / 2;
      
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('SPEED', speedX, speedY - 12);
      
      const currentSpeed = Math.round(Math.abs(state.velocity) * 20);
      ctx.fillStyle = '#00ffc7';
      ctx.font = 'black 20px monospace';
      ctx.fillText(`${currentSpeed}`, speedX, speedY + 8);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '8px sans-serif';
      ctx.fillText('km/h', speedX, speedY + 24);
      ctx.restore();

      // ----------------------------------------------------
      // DRAW GEAR SHIFT INTERLOCK WARNING
      // ----------------------------------------------------
      if (state.gearWarningTime && state.gearWarningTime > 0) {
        state.gearWarningTime--;
        ctx.save();
        
        const boxW = 380;
        const boxH = 50;
        const boxX = mapWidth / 2 - boxW / 2;
        const boxY = mapHeight / 2 - boxH / 2;
        
        ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = 'rgba(220, 38, 38, 0.95)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 12);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 12);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️ 브레이크를 밟은 상태에서 기어를 변경해 주세요!', mapWidth / 2, mapHeight / 2);
        
        ctx.restore();
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, [carType, mapId, isReplayActive, isMuted, parkedTimer, carConfig, modeId, initialLives, gear]);

  // Handle external reset calls
  if (externalRef) {
    externalRef.current = {
      reset: () => {
        let startX = 150;
        let startY = 300;
        let startAngle = 0;

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

        stateRef.current = {
          x: startX,
          y: startY,
          angle: startAngle,
          velocity: 0,
          steerAngle: 0,
          gear: 'D',
          collisions: 0,
          elapsedTime: 0,
          lineViolationTime: 0,
          lives: initialLives,
          isComplete: false,
          keys: {},
          replayBuffer: [],
          replayIndex: 0,
          parkedFrames: 0,
          
          tutorialStep: 1,
          tutDroveForward: false,
          tutDroveBackward: false,
          gearWarningTime: 0,
          lastParkedPct: 0,
          lastLineViolationSec: 0,
        };
        setGear('D');
        setCollisions(0);
        setElapsedTime(0);
        setLineViolationTime(0);
        setParkedTimer(0);
        setLives(initialLives);
        setTutorialStep(1);
        setTutDroveForward(false);
        setTutDroveBackward(false);
      }
    };
  }

  const handleGearClick = (g: 'P' | 'D' | 'R') => {
    if (isReplayActive || (modeId === 'tutorial' && tutorialStep === 1)) return;
    
    // Shift safety brake interlock (Spacebar) to change gears
    const isBraking = stateRef.current.keys[' '] || stateRef.current.keys['spacebar'];
    if (!isBraking) {
      stateRef.current.gearWarningTime = 120; // 2 seconds
      playBeep(300, 0.15); // error buzzer tone
      return;
    }
    
    setGear(g);
    const gears = ['P', 'D', 'R'] as const;
    playBeep(600 + gears.indexOf(g) * 100, 0.08);
  };

  const isMinimalUI = modeId !== 'tutorial' && modeId !== 'practice';

  return (
    <div ref={containerRef} className="flex flex-col items-center select-none space-y-4">
      {/* HUD Bar */}
      <div className="w-full max-w-[800px] flex items-center justify-between px-2 text-sm text-neutral-400">
        <div className="flex gap-4 items-center">
          <span>
            ⏱ 시간: <strong className="text-white">{elapsedTime}초</strong>
          </span>
          
          {/* Display Hearts / Lives for Survival and Hard modes */}
          {(modeId === 'survival' || modeId === 'hard') ? (
            <span className="flex items-center gap-1">
              ❤️ 생명: 
              {Array.from({ length: initialLives }).map((_, i) => (
                <Heart
                  key={i}
                  className={`h-4 w-4 ${i < lives ? 'text-red-500 fill-red-500' : 'text-neutral-350 dark:text-neutral-700'}`}
                />
              ))}
            </span>
          ) : (
            <span>
              💥 충돌: <strong className="text-red-500">{collisions}회</strong>
            </span>
          )}

          {modeId === 'tutorial' && (
            <Badge className="bg-primary-500 text-neutral-950 font-bold ml-2">
              TUTORIAL STEP {tutorialStep}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              stateRef.current.keys = {};
              if (externalRef?.current) externalRef.current.reset();
              toast({ description: '시뮬레이션이 초기화되었습니다.' });
            }}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            초기화
          </Button>

          {/* Toggle View Mode disabled (1st person removed) */}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            {isMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
          </Button>
        </div>
      </div>

      {/* Simulator canvas */}
      <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden bg-[#e2e8f0] dark:bg-neutral-950 shadow-2xl">
        <canvas
          ref={canvasElementRef}
          width={800}
          height={600}
          className="block cursor-crosshair max-w-full"
        />
      </div>
    </div>
  );
}
