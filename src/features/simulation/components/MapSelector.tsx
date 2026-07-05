'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, ShieldCheck, Compass } from 'lucide-react';

export interface ParkingMap {
  id: string;
  name: string;
  type: 'T-park' | 'parallel' | 'front' | 'diagonal';
  typeName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  difficultyName: string;
  difficultyColor: string;
  imageUrl: string;
  description: string;
}

export const maps: ParkingMap[] = [
  {
    id: 'rear',
    name: '후면 주차 코스',
    type: 'T-park',
    typeName: '후면 주차 (T자)',
    difficulty: 'easy',
    difficultyName: '초급 (Easy)',
    difficultyColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    imageUrl: 'https://picsum.photos/400/250?random=1',
    description: '후진으로 직각 공간에 진입하는 T자 형태의 주차 코스입니다. 좌우 균형 감각과 진입 타이밍을 익히기에 좋습니다.',
  },
  {
    id: 'diagonal',
    name: '45도 사선주차 코스',
    type: 'diagonal',
    typeName: '사선 주차 (45도)',
    difficulty: 'medium',
    difficultyName: '중급 (Normal)',
    difficultyColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    imageUrl: 'https://picsum.photos/400/250?random=4',
    description: '45도 비스듬히 기울어진 사선 주차 공간에 진입하는 코스입니다. T자 주차보다 좁은 차로 너비에서도 쉽게 진입할 수 있어 실생활에서 많이 쓰입니다.',
  },
  {
    id: 'front',
    name: '전면 주차 코스',
    type: 'front',
    typeName: '전면 주차 (전방)',
    difficulty: 'medium',
    difficultyName: '중급 (Normal)',
    difficultyColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    imageUrl: 'https://picsum.photos/400/250?random=2',
    description: '전진으로 전방 주차 칸에 정밀하게 회전하여 진입하는 코스입니다. 회전 시 차량 후미의 쏠림 현상과 각도 조절에 유의해야 합니다.',
  },
  {
    id: 'parallel',
    name: '평행 주차 코스',
    type: 'parallel',
    typeName: '평행 주차 (수평)',
    difficulty: 'hard',
    difficultyName: '상급 (Hard)',
    difficultyColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    imageUrl: 'https://picsum.photos/400/250?random=3',
    description: '도로 옆 일렬로 주차된 앞차와 뒷차 사이의 수평 공간에 비스듬히 후진하여 주차를 완수하는 최고 난이도 코스입니다.',
  },
];

interface MapSelectorProps {
  selectedMapId: string;
  onSelect: (id: string) => void;
}

export default function MapSelector({ selectedMapId, onSelect }: MapSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-left">
        <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-500/20 text-primary-500 text-sm">2</span>
          연습할 장소(맵) 선택
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">난이도 및 주차 종류(T자, 평행)에 맞는 주차 방식을 고를 수 있습니다.</p>
      </div>
 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {maps.map((map) => {
          const isSelected = selectedMapId === map.id;
          return (
            <div
              key={map.id}
              onClick={() => onSelect(map.id)}
              className={`group cursor-pointer overflow-hidden rounded-2xl border-2 bg-white dark:bg-neutral-900/50 backdrop-blur-sm transition-all duration-300 transform hover:translate-y-[-4px] active:scale-95 flex flex-col justify-between ${
                isSelected
                  ? 'border-primary-500 shadow-[0_0_20px_rgba(0,255,199,0.15)] bg-neutral-50 dark:bg-neutral-900'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-350 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/80'
              }`}
            >
              {/* Info Area */}
              <div className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3 text-left">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline" className="bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800">
                      {map.typeName}
                    </Badge>
                    {isSelected && (
                      <div className="rounded-full bg-primary-500 p-0.5 text-neutral-950">
                        <Check className="h-3.5 w-3.5 font-extrabold" />
                      </div>
                    )}
                  </div>
 
                  <h4 className="text-lg font-bold text-neutral-800 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">{map.name}</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed min-h-[48px]">{map.description}</p>
                </div>
                
                {/* Feature Icons Row */}
                <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800/80 pt-3">
                  <span className="flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5 text-primary-500" />
                    실시간 가이드
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-secondary-500" />
                    충돌 감지
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
