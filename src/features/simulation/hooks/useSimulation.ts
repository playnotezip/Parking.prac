'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { vehicles } from '../components/VehicleSelector';
import { createAudio } from '../lib/audio';
import { checkCollisionOBB } from '../lib/geometry';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  createParkedCars,
  getMapObstacles,
  getStartPosition,
  getTargetHeading,
  getTargetSlot,
} from '../lib/maps';
import { PHYSICS, integrate, toCarDimensions, updateSteering, updateVelocity } from '../lib/physics';
import { renderFrame } from '../lib/render';
import {
  PARK_HOLD_FRAMES,
  computeScore,
  isAligned,
  isFullyInsideSlot,
  isStopped,
  toAngleOffsetDegrees,
} from '../lib/scoring';
import type { Box, Gear, ParkedCar, SimState, SimulationResults } from '../lib/types';

const GEAR_ORDER: Gear[] = ['P', 'D', 'R'];
const GEAR_WARNING_FRAMES = 120; // Show warning for 2 seconds
const COLLISION_COOLDOWN_FRAMES = 45;
const TIME_LIMIT_SECONDS = 300;

export interface UseSimulationOptions {
  carType: string;
  mapId: string;
  modeId: string;
  isReplayActive: boolean;
  onComplete: (results: SimulationResults) => void;
  onReplayFinished: () => void;
}

const createState = (mapId: string, modeId: string, lives: number): SimState => {
  const start = getStartPosition(mapId, modeId);
  return {
    x: start.x,
    y: start.y,
    angle: start.angle,
    velocity: 0,
    steerAngle: 0,
    gear: 'D',
    collisions: 0,
    elapsedTime: 0,
    lineViolationTime: 0,
    lives,
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
};

export const useSimulation = ({
  carType,
  mapId,
  modeId,
  isReplayActive,
  onComplete,
  onReplayFinished,
}: UseSimulationOptions) => {
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const carConfig = vehicles.find((v) => v.id === carType) || vehicles[1];
  const initialLives = modeId === 'survival' ? 3 : modeId === 'hard' ? 1 : 999;

  // HUD-facing state. The loop drives these; nothing reads them back.
  const [gear, setGear] = useState<Gear>('D');
  const [collisions, setCollisions] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lineViolationTime, setLineViolationTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [lives, setLives] = useState(initialLives);
  const [tutorialStep, setTutorialStep] = useState(1);

  const stateRef = useRef<SimState>(createState(mapId, modeId, initialLives));
  const parkedCarsRef = useRef<ParkedCar[]>([]);
  const parkedPctRef = useRef(0);
  const collisionCooldownRef = useRef(0);

  // Keeping these in refs is what lets the rAF loop survive prop and state
  // changes instead of being torn down and restarted mid-drive.
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onReplayFinishedRef = useRef(onReplayFinished);
  onReplayFinishedRef.current = onReplayFinished;

  const audioRef = useRef(createAudio(() => isMutedRef.current));

  const resetSimulation = useCallback(() => {
    parkedCarsRef.current = createParkedCars(mapId, modeId, carType);
    stateRef.current = createState(mapId, modeId, initialLives);
    parkedPctRef.current = 0;
    collisionCooldownRef.current = 0;

    setGear('D');
    setCollisions(0);
    setElapsedTime(0);
    setLineViolationTime(0);
    setLives(initialLives);
    setTutorialStep(1);
  }, [mapId, modeId, carType, initialLives]);

  // Reset/Initialize State depending on Map & Mode
  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  // Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReplayActive) return;
      stateRef.current.keys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isReplayActive]);

  /** Gear changes require the brake to be held, mirroring a real interlock. */
  const shiftGear = useCallback(
    (next: Gear) => {
      const state = stateRef.current;
      if (next === state.gear) return;

      const isBraking = state.keys[' '] || state.keys['spacebar'];
      if (!isBraking) {
        state.gearWarningTime = GEAR_WARNING_FRAMES;
        audioRef.current.playBeep(300, 0.15); // Warning buzzer tone
        return;
      }

      state.gear = next;
      setGear(next);
      audioRef.current.playBeep(600 + GEAR_ORDER.indexOf(next) * 100, 0.08);
    },
    []
  );

  // Mouse Wheel Gear Scroll (Simplified to P, D, R)
  useEffect(() => {
    const canvas = canvasElementRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      const state = stateRef.current;
      if (isReplayActive || state.isComplete) return;
      e.preventDefault();

      // Lock gear during Step 1 of tutorial
      if (modeId === 'tutorial' && state.tutorialStep === 1) return;

      const currentIdx = GEAR_ORDER.indexOf(state.gear);
      const nextIdx = e.deltaY < 0 ? Math.max(0, currentIdx - 1) : Math.min(2, currentIdx + 1);
      if (nextIdx !== currentIdx) shiftGear(GEAR_ORDER[nextIdx]);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [isReplayActive, modeId, shiftGear]);

  // Main Loop
  useEffect(() => {
    const canvas = canvasElementRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let secondsTimerCounter = 0;
    const car = toCarDimensions(carConfig);
    const audio = audioRef.current;

    const finish = (results: SimulationResults) => {
      stateRef.current.isComplete = true;
      onCompleteRef.current(results);
    };

    const loop = () => {
      const state = stateRef.current;
      const obstacles = getMapObstacles(mapId, modeId, parkedCarsRef.current);
      const targetSlot = getTargetSlot(mapId, modeId, carType);

      const carBox: Box = {
        center: { x: state.x, y: state.y },
        w: car.length,
        h: car.width,
        angle: state.angle,
      };
      const allCornersIn = isFullyInsideSlot(carBox, targetSlot);

      const targetHeading = getTargetHeading(mapId, modeId, targetSlot);
      const aligned = isAligned(state.angle, targetHeading);

      if (collisionCooldownRef.current > 0) collisionCooldownRef.current--;
      if (state.gearWarningTime > 0) state.gearWarningTime--;

      let isBraking = false;

      if (isReplayActive) {
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
          if (state.replayIndex === 0) onReplayFinishedRef.current();
        }
      } else if (!state.isComplete) {
        secondsTimerCounter++;
        if (secondsTimerCounter >= 60) {
          state.elapsedTime++;
          setElapsedTime(state.elapsedTime);
          secondsTimerCounter = 0;

          if (state.elapsedTime >= TIME_LIMIT_SECONDS && modeId !== 'tutorial') {
            finish({
              score: 0,
              elapsedTimeSeconds: TIME_LIMIT_SECONDS,
              collisionCount: state.collisions,
              lineViolationDurationSeconds: state.lineViolationTime,
              finalAngleOffsetDegree: 90,
              isSuccess: false,
            });
          }
        }

        const input = {
          steerLeft: !!state.keys['a'],
          steerRight: !!state.keys['d'],
          accelerate: !!state.keys['w'],
          reverse: !!state.keys['s'],
          brake: !!(state.keys[' '] || state.keys['spacebar']),
        };

        state.steerAngle = updateSteering(state.steerAngle, input);
        const driven = updateVelocity(state.velocity, state.gear, input);
        state.velocity = driven.velocity;
        isBraking = driven.isBraking;

        // Apply Rollback on collision
        const prevX = state.x;
        const prevY = state.y;
        const prevAngle = state.angle;

        const moved = integrate({ x: state.x, y: state.y, angle: state.angle }, state.velocity, state.steerAngle, car.wheelbase);
        state.x = moved.x;
        state.y = moved.y;
        state.angle = moved.angle;

        const updatedCarBox: Box = {
          center: { x: state.x, y: state.y },
          w: car.length,
          h: car.width,
          angle: state.angle,
        };
        const collided = obstacles.some((obs) => checkCollisionOBB(updatedCarBox, obs.box));

        if (collided) {
          state.x = prevX;
          state.y = prevY;
          state.angle = prevAngle;
          state.velocity = state.velocity * PHYSICS.collisionRebound;

          if (collisionCooldownRef.current === 0) {
            state.collisions++;
            setCollisions(state.collisions);
            collisionCooldownRef.current = COLLISION_COOLDOWN_FRAMES;
            audio.playBeep(250, 0.25);

            // Handle Lives depletion in Survival & Hard modes
            if (modeId === 'survival' || modeId === 'hard') {
              state.lives--;
              setLives(state.lives);

              if (state.lives <= 0) {
                finish({
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
        const isViolating = state.x < 30 || state.x > MAP_WIDTH - 30 || state.y < 30 || state.y > MAP_HEIGHT - 30;
        if (isViolating) {
          state.lineViolationTime += 1 / 60;
          const currentViolationSec = Math.floor(state.lineViolationTime);
          if (currentViolationSec !== state.lastLineViolationSec) {
            state.lastLineViolationSec = currentViolationSec;
            setLineViolationTime(currentViolationSec);
          }
        }

        state.replayBuffer.push({
          x: state.x,
          y: state.y,
          angle: state.angle,
          steerAngle: state.steerAngle,
          gear: state.gear,
          velocity: state.velocity,
          brakeActive: isBraking,
        });

        const parkedNow = allCornersIn && aligned && isStopped(state.gear, state.velocity);

        // Tutorial missions run instead of the normal success check until step 4.
        if (modeId === 'tutorial' && state.tutorialStep !== 4) {
          if (state.tutorialStep === 1) {
            // Step 1: Creep drive forward, press Spacebar to stop at the stop line (x: 300)
            const nearStopLine = state.x >= 270 && state.x <= 330;
            const stopped = Math.abs(state.velocity) < 0.01 && input.brake;

            if (nearStopLine && stopped) {
              state.tutorialStep = 2;
              setTutorialStep(2);
              audio.playSuccessChime();
              toast({
                title: '1단계 통과!',
                description: '정지선 제동 완료. 다음 단계: D로 전진 후 R로 바꾸어 후진해보세요!',
              });
            }
          } else if (state.tutorialStep === 2) {
            // Step 2: D gear forward, then R gear reverse
            if (state.gear === 'D' && state.velocity > 0.8) {
              state.tutDroveForward = true;
            }
            if (state.tutDroveForward && state.gear === 'R' && state.velocity < -0.8) {
              state.tutDroveBackward = true;
            }
            if (state.tutDroveForward && state.tutDroveBackward) {
              state.tutorialStep = 4; // Bypassing step 3
              setTutorialStep(4);
              audio.playSuccessChime();
              toast({
                title: '2단계 통과!',
                description: '전진 및 후진 성공. 최종 단계: 초록 주차 구역 안에 주차 후 P 기어를 1.5초간 유지하세요!',
              });
            }
          }
        } else if (parkedNow) {
          state.parkedFrames++;
          const currentPct = Math.min(100, Math.round((state.parkedFrames / PARK_HOLD_FRAMES) * 100));
          if (currentPct !== state.lastParkedPct) {
            state.lastParkedPct = currentPct;
            parkedPctRef.current = currentPct;
          }
          if (state.parkedFrames % 30 === 0 && state.parkedFrames < PARK_HOLD_FRAMES) {
            audio.playBeep(1200, 0.05);
          }

          if (state.parkedFrames >= PARK_HOLD_FRAMES) {
            if (modeId === 'tutorial') {
              audio.playSuccessChime();
              finish({
                score: 100,
                elapsedTimeSeconds: state.elapsedTime,
                collisionCount: state.collisions,
                lineViolationDurationSeconds: state.lineViolationTime,
                finalAngleOffsetDegree: 0,
                isSuccess: true,
              });
            } else {
              audio.playBeep(2000, 0.5);
              finish({
                score: computeScore({
                  elapsedTime: state.elapsedTime,
                  collisions: state.collisions,
                  lineViolationTime: state.lineViolationTime,
                }),
                elapsedTimeSeconds: state.elapsedTime,
                collisionCount: state.collisions,
                lineViolationDurationSeconds: state.lineViolationTime,
                finalAngleOffsetDegree: toAngleOffsetDegrees(state.angle, targetHeading),
                isSuccess: true,
              });
            }
          }
        } else {
          state.parkedFrames = 0;
          if (state.lastParkedPct !== 0) {
            state.lastParkedPct = 0;
            parkedPctRef.current = 0;
          }
        }
      }

      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

      renderFrame({
        ctx,
        isDark,
        state,
        gear: state.gear,
        obstacles,
        targetSlot,
        car,
        carColor: carConfig.color,
        carType,
        mapId,
        modeId,
        allCornersIn,
        aligned,
        isBraking,
        parkedTimer: parkedPctRef.current,
        collisionFlash: collisionCooldownRef.current > 30,
      });

      animFrameId = requestAnimationFrame(loop);
    };

    // Run the first frame synchronously so the scene is painted even when the
    // tab is hidden, where requestAnimationFrame never fires.
    loop();
    return () => cancelAnimationFrame(animFrameId);
  }, [carType, mapId, modeId, isReplayActive, carConfig, toast]);

  return {
    canvasElementRef,
    gear,
    collisions,
    elapsedTime,
    lineViolationTime,
    lives,
    initialLives,
    tutorialStep,
    isMuted,
    setIsMuted,
    shiftGear,
    reset: resetSimulation,
  };
};
