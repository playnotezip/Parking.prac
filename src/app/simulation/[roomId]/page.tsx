'use client';

import React, { use, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SimulatorCanvas from '@/features/simulation/components/SimulatorCanvas';
import ResultModal from '@/features/simulation/components/ResultModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Play, Info } from 'lucide-react';
import { vehicles } from '@/features/simulation/components/VehicleSelector';
import { maps } from '@/features/simulation/components/MapSelector';

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;

  // Parse roomId format: room-[vehicleId]-[mapId]-[modeId]
  const parts = roomId.split('-');
  const carType = parts[1] || 'sedan';
  const mapId = parts[2] || 'rear';
  const modeId = parts[3] || 'practice';

  const carInfo = vehicles.find((v) => v.id === carType) || vehicles[1];
  const mapInfo = maps.find((m) => m.id === mapId) || maps[0];

  const modeNames: Record<string, string> = {
    practice: '연습 모드',
    survival: '서바이벌 모드',
    hard: '하드 모드',
    tutorial: '튜토리얼 모드',
  };

  const modeBadges: Record<string, string> = {
    practice: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    survival: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    hard: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    tutorial: 'bg-primary-500/10 text-primary-500 border-primary-500/30',
  };

  const canvasRef = useRef<any>(null);

  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [results, setResults] = useState({
    score: 100,
    elapsedTimeSeconds: 0,
    collisionCount: 0,
    lineViolationDurationSeconds: 0,
    finalAngleOffsetDegree: 0,
    isSuccess: true,
  });

  const handleSimulationComplete = (completedResults: typeof results) => {
    setResults(completedResults);
    setIsModalOpen(true);
    setIsReplayActive(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    router.push('/simulation');
  };

  const handleStartReplay = () => {
    setIsModalOpen(false);
    setIsReplayActive(true);
  };

  const handleReplayFinished = () => {
    setIsReplayActive(false);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 bg-neutral-950 flex flex-col justify-start py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Header Controls */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between mb-4">
        <Link href="/simulation">
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-white hover:bg-neutral-900 gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            이전으로
          </Button>
        </Link>

        {/* Dashboard Title Card */}
        <div className="text-center flex items-center gap-3">
          <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
            <span>{modeId === 'tutorial' ? '연습 튜토리얼' : mapInfo.name}</span>
            <span className="text-neutral-500">|</span>
            <span className="text-primary-500 text-sm font-semibold">{carInfo.name}</span>
          </h2>
          <Badge variant="outline" className={`font-bold ${modeBadges[modeId] || 'text-neutral-400 border-neutral-800'}`}>
            {modeNames[modeId] || modeId}
          </Badge>
        </div>

        <div className="w-[80px]" />
      </div>

      {/* Simulator canvas and wrapper */}
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col items-center justify-center">
        {isReplayActive && (
          <div className="mb-2 bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs px-3 py-1 rounded-full animate-pulse font-bold flex items-center gap-1.5">
            🎬 리플레이 재생 중...
          </div>
        )}

        <SimulatorCanvas
          canvasRef={canvasRef}
          carType={carType}
          mapId={mapId}
          modeId={modeId}
          isReplayActive={isReplayActive}
          onComplete={handleSimulationComplete}
          onReplayFinished={handleReplayFinished}
        />
      </div>

      {/* Result Overlay Modal */}
      <ResultModal
        isOpen={isModalOpen}
        score={results.score}
        elapsedTimeSeconds={results.elapsedTimeSeconds}
        collisionCount={results.collisionCount}
        lineViolationDurationSeconds={results.lineViolationDurationSeconds}
        finalAngleOffsetDegree={results.finalAngleOffsetDegree}
        carType={carType}
        mapId={mapId}
        modeId={modeId}
        isSuccess={results.isSuccess}
        onClose={handleCloseModal}
        onReplay={handleStartReplay}
      />
    </div>
  );
}
