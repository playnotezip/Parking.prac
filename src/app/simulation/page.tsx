'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import VehicleSelector from '@/features/simulation/components/VehicleSelector';
import MapSelector from '@/features/simulation/components/MapSelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Sparkles, HelpCircle, Check } from 'lucide-react';
import Link from 'next/link';

interface GameMode {
  id: string;
  name: string;
  description: string;
  badge: string;
  badgeColor: string;
}

const gameModes: GameMode[] = [
  {
    id: 'tutorial',
    name: '1. 튜토리얼 (Tutorial)',
    description: '초보 플레이어를 위해 크리프 주행, 스페이스바 제동 및 기어 전/후진 작동법을 안내선과 화살표 지시문으로 익힙니다.',
    badge: '입문 코스',
    badgeColor: 'bg-primary-500/10 text-primary-500 border-primary-500/30'
  },
  {
    id: 'practice',
    name: '2. 연습 모드 (Practice)',
    description: '충돌 횟수나 시간제한 압박 없이 무한으로 안전하게 주차 감각을 연습하는 자유 플레이 모드입니다.',
    badge: '무제한 목숨',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'survival',
    name: '3. 서바이벌 모드 (Survival)',
    description: '최대 3회의 충돌 기회를 제공하며, 3회 이상 충돌 시 즉시 실격(게임 오버) 처리됩니다.',
    badge: '목숨 3개',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  {
    id: 'hard',
    name: '4. 하드 모드 (Hard)',
    description: '단 1회의 가벼운 접촉 사고조차 허용하지 않는 난이도로 완벽한 조작이 필요한 도전 모드입니다.',
    badge: '목숨 1개',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  }
];

export default function SimulationSetupPage() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState('sedan');
  const [selectedMap, setSelectedMap] = useState('rear');
  const [selectedMode, setSelectedMode] = useState('tutorial'); // Default set to tutorial

  const handleStartSimulation = () => {
    // Navigate to playroom using unique format: room-[vehicleId]-[mapId]-[modeId]
    const roomId = `room-${selectedVehicle}-${selectedMap}-${selectedMode}`;
    router.push(`/simulation/${roomId}`);
  };

  return (
    <div className="flex-1 bg-[#F8F9FA] dark:bg-[#121212] text-[#212529] dark:text-[#E9ECEF] py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Background Gradients */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-primary-500 font-bold">
            <Sparkles className="h-3 w-3" />
            현실감 있는 2D 물리 시뮬레이션
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            주차 시뮬레이터 설정
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-[1.6]">
            내 마음에 드는 차량과 맵, 플레이 모드를 골라 자유롭게 주차 감각을 연습하고 키워보세요.
          </p>
        </div>

        {/* Configurations */}
        <div className="space-y-10 bg-white dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-850 p-6 md:p-8 rounded-3xl backdrop-blur-sm">
          {/* Step 1: Vehicle Selector */}
          <VehicleSelector selectedVehicleId={selectedVehicle} onSelect={setSelectedVehicle} />

          <hr className="border-neutral-200 dark:border-neutral-850" />

          {/* Step 2: Map Selector */}
          <MapSelector selectedMapId={selectedMap} onSelect={setSelectedMap} />

          <hr className="border-neutral-200 dark:border-neutral-850" />

          {/* Step 3: Game Mode Selector */}
          <div className="space-y-4">
            <div className="text-left">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-500/20 text-primary-500 text-sm">3</span>
                연습 게임 모드 선택
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 leading-[1.6]">연습 단계에 따른 모드를 왼쪽에서 오른쪽 방향으로 순서대로 플레이해 볼 수 있습니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {gameModes.map((mode) => {
                const isSelected = selectedMode === mode.id;
                return (
                  <div
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`group cursor-pointer rounded-2xl border-2 bg-white dark:bg-neutral-900/50 backdrop-blur-sm p-5 transition-all duration-300 transform hover:translate-y-[-4px] active:scale-95 text-left flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary-500 shadow-[0_0_20px_rgba(0,255,199,0.15)] bg-neutral-50 dark:bg-neutral-900'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-350 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/80'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className={mode.badgeColor}>
                          {mode.badge}
                        </Badge>
                        {isSelected && (
                          <div className="rounded-full bg-primary-500 p-1 text-neutral-950">
                            <Check className="h-3 w-3 font-extrabold" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-neutral-800 dark:text-white group-hover:text-primary-500 transition-colors">
                        {mode.name}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-[1.6] min-h-[48px]">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Area */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-200 dark:border-neutral-850 pt-6">
            <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <HelpCircle className="h-4.5 w-4.5 text-secondary-500" />
              <span>키보드 조작(W, A, S, D, Spacebar)과 마우스 휠 기어 변속이 요구됩니다.</span>
            </div>
            
            <div className="flex gap-4 w-full sm:w-auto">
              <Link href="/guide" className="flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 dark:hover:text-white"
                >
                  주차 가이드 확인
                </Button>
              </Link>
              
              <Button
                onClick={handleStartSimulation}
                className="flex-1 sm:flex-none bg-primary-500 text-neutral-950 font-bold hover:bg-primary-400 hover:scale-105 active:scale-95 transition-all px-8 py-5 rounded-full text-base gap-2"
              >
                <Play className="h-5 w-5 fill-neutral-950" />
                시뮬레이션 시작
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
