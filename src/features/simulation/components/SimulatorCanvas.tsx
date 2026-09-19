'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useSimulation } from '../hooks/useSimulation';
import { MAP_HEIGHT, MAP_WIDTH } from '../lib/maps';
import type { SimulationResults } from '../lib/types';

interface SimulatorCanvasProps {
  carType: string;
  mapId: string;
  modeId: string; // 'practice' | 'survival' | 'hard' | 'tutorial'
  isReplayActive: boolean;
  onComplete: (results: SimulationResults) => void;
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
  const { toast } = useToast();
  const sim = useSimulation({ carType, mapId, modeId, isReplayActive, onComplete, onReplayFinished });

  // Expose reset() to the parent page, which drives the "다시 하기" button.
  useEffect(() => {
    if (!externalRef) return;
    externalRef.current = { reset: sim.reset };
  }, [externalRef, sim.reset]);

  const handleReset = () => {
    sim.reset();
    toast({ description: '시뮬레이션이 초기화되었습니다.' });
  };

  return (
    <div className="flex flex-col items-center select-none space-y-4">
      {/* HUD Bar */}
      <div className="w-full max-w-[800px] flex items-center justify-between px-2 text-sm text-neutral-400">
        <div className="flex gap-4 items-center">
          <span>
            ⏱ 시간: <strong className="text-white">{sim.elapsedTime}초</strong>
          </span>

          {/* Display Hearts / Lives for Survival and Hard modes */}
          {modeId === 'survival' || modeId === 'hard' ? (
            <span className="flex items-center gap-1">
              ❤️ 생명:
              {Array.from({ length: sim.initialLives }).map((_, i) => (
                <Heart
                  key={i}
                  className={`h-4 w-4 ${i < sim.lives ? 'text-red-500 fill-red-500' : 'text-neutral-350 dark:text-neutral-700'}`}
                />
              ))}
            </span>
          ) : (
            <span>
              💥 충돌: <strong className="text-red-500">{sim.collisions}회</strong>
            </span>
          )}

          {modeId === 'tutorial' && (
            <Badge className="bg-primary-500 text-neutral-950 font-bold ml-2">
              TUTORIAL STEP {sim.tutorialStep}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            초기화
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => sim.setIsMuted(!sim.isMuted)}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            {sim.isMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
          </Button>
        </div>
      </div>

      {/* Simulator canvas */}
      <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden bg-[#e2e8f0] dark:bg-neutral-950 shadow-2xl">
        <canvas
          ref={sim.canvasElementRef}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          className="block cursor-crosshair max-w-full"
        />
      </div>
    </div>
  );
}
