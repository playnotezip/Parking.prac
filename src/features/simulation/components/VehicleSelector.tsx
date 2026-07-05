'use client';

import React from 'react';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

export interface Vehicle {
  id: string;
  name: string;
  type: 'compact' | 'sedan' | 'suv';
  length: number; // mm
  width: number;  // mm
  wheelbase: number; // mm
  color: string;
  accentClass: string;
  description: string;
}

export const vehicles: Vehicle[] = [
  {
    id: 'compact',
    name: '소형 (Compact)',
    type: 'compact',
    length: 3600,
    width: 1600,
    wheelbase: 2200,
    color: '#00ffc7',
    accentClass: 'border-primary-500 text-primary-500',
    description: '차체가 콤팩트하고 회전반경이 좁아, 가볍고 손쉬운 주차 연습에 최적화되어 있습니다.',
  },
  {
    id: 'sedan',
    name: '중형 (Sedan)',
    type: 'sedan',
    length: 4600,
    width: 1800,
    wheelbase: 2700,
    color: '#ffc700',
    accentClass: 'border-secondary-500 text-secondary-500',
    description: '표준적인 크기와 균형 잡힌 주행 조작감으로, 기본적인 T자 및 후진 주행을 고르게 연습하기 좋습니다.',
  },
  {
    id: 'suv',
    name: '대형 (SUV)',
    type: 'suv',
    length: 4800,
    width: 1900,
    wheelbase: 2800,
    color: '#c700ff',
    accentClass: 'border-accent-500 text-accent-500',
    description: '큰 전폭과 높은 전고를 지녀 회전폭이 넓으므로 미러 및 가이드선을 꼼꼼하게 관찰하는 연습이 권장됩니다.',
  },
];

interface VehicleSelectorProps {
  selectedVehicleId: string;
  onSelect: (id: string) => void;
}

export default function VehicleSelector({ selectedVehicleId, onSelect }: VehicleSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-left">
        <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-500/20 text-primary-500 text-sm">1</span>
          연습할 차종 선택
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 leading-[1.6]">
          차량의 종류에 따라 달라지는 회전 반경과 물리적 조작감을 시뮬레이션에서 생생하게 체감할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vehicles.map((car) => {
          const isSelected = selectedVehicleId === car.id;
          return (
            <div
              key={car.id}
              onClick={() => onSelect(car.id)}
              className={`group cursor-pointer rounded-2xl border-2 bg-white dark:bg-neutral-900/50 backdrop-blur-sm p-4 transition-all duration-300 transform hover:translate-y-[-4px] active:scale-95 flex flex-col justify-between ${
                isSelected
                  ? 'border-primary-500 shadow-[0_0_20px_rgba(0,255,199,0.15)] bg-neutral-50 dark:bg-neutral-900'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-350 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/80'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant="outline"
                    className={isSelected ? 'bg-primary-500/10 text-primary-500 border-primary-500/30' : 'text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'}
                  >
                    {car.type.toUpperCase()}
                  </Badge>
                  {isSelected && (
                    <div className="rounded-full bg-primary-500 p-0.5 text-neutral-950">
                      <Check className="h-3 w-3 font-extrabold" />
                    </div>
                  )}
                </div>

                <h4 className="text-sm font-bold text-neutral-800 dark:text-white group-hover:text-primary-500 transition-colors">
                  {car.name}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 min-h-[48px] leading-[1.6]">
                  {car.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-1 border-t border-neutral-100 dark:border-neutral-800/80 pt-3 text-center mt-3 text-[10px]">
                <div>
                  <p className="text-neutral-400 dark:text-neutral-500 font-medium">전장</p>
                  <p className="font-bold text-neutral-700 dark:text-white mt-0.5">{car.length}mm</p>
                </div>
                <div>
                  <p className="text-neutral-400 dark:text-neutral-500 font-medium">전폭</p>
                  <p className="font-bold text-neutral-700 dark:text-white mt-0.5">{car.width}mm</p>
                </div>
                <div>
                  <p className="text-neutral-400 dark:text-neutral-500 font-medium">축거</p>
                  <p className="font-bold text-neutral-700 dark:text-white mt-0.5">{car.wheelbase}mm</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
