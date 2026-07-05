'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Compass, BookOpen, Navigation, Key, ShieldCheck, Flag } from 'lucide-react';

interface Step {
  stepNum: number;
  title: string;
  description: string;
  wheelAngle: 'straight' | 'left' | 'right';
}

const tParkSteps: Step[] = [
  {
    stepNum: 1,
    title: '진입 및 어깨선 맞추기',
    description: '주차선과 약 1m 간격을 유지하며 주행하다가, 주차하려는 칸의 왼쪽 경계선과 내 어깨선이 나란해질 때 정차합니다.',
    wheelAngle: 'straight',
  },
  {
    stepNum: 2,
    title: '핸들 우측 감고 비스듬히 전진',
    description: '핸들을 오른쪽 방향으로 끝까지 돌린 후 서서히 전진합니다. 내 차량의 뒤축이 주차 공간 모서리에 위치할 수 있도록 약 45도 각도를 형성한 뒤 정차합니다.',
    wheelAngle: 'right',
  },
  {
    stepNum: 3,
    title: '기어 R 전환 및 핸들 좌측 끝까지 회전',
    description: '기어를 후진(R)으로 변경하고 핸들을 왼쪽 방향(주차 방향)으로 끝까지 감습니다. 브레이크에서 발을 서서히 떼며 진입합니다.',
    wheelAngle: 'left',
  },
  {
    stepNum: 4,
    title: '차량 평행 정렬 및 P기어 완료',
    description: '차량이 주차선과 수평(평행)이 되는 순간 멈추고, 핸들을 바르게 풀어 타이어를 정렬합니다. 똑바로 후진하여 멈춘 후 기어를 P로 바꿉니다.',
    wheelAngle: 'straight',
  },
];

const parallelSteps: Step[] = [
  {
    stepNum: 1,
    title: '앞차와 나란히 맞추기',
    description: '주차 공간 앞 쪽에 주차된 차량과 약 50cm~1m 간격을 두고 나란히 정차합니다. 두 차량의 뒷범퍼 끝 라인이 대략 수평을 이뤄야 합니다.',
    wheelAngle: 'straight',
  },
  {
    stepNum: 2,
    title: '핸들 우측 끝까지 감고 후진',
    description: '핸들을 오른쪽 끝까지 감고 기어를 R로 두어 후진합니다. 차량 각도가 약 45도가 되었을 때 멈춥니다.',
    wheelAngle: 'right',
  },
  {
    stepNum: 3,
    title: '핸들 왼쪽 감고 끝까지 후진',
    description: '핸들을 왼쪽 끝까지 다 감은 뒤 천천히 후진하며 주차 칸 안으로 진입합니다.',
    wheelAngle: 'left',
  },
  {
    stepNum: 4,
    title: '차량 수평 조절 및 정차',
    description: '차량이 주차 칸 안에 완전히 수평을 맞춘 뒤 정차합니다. 필요 시 기어를 D로 두어 전진 수정을 취하고 정렬을 마칩니다.',
    wheelAngle: 'straight',
  },
];

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<'T-park' | 'parallel'>('T-park');

  const currentSteps = activeTab === 'T-park' ? tParkSteps : parallelSteps;

  return (
    <div className="flex-1 bg-[#F8F9FA] dark:bg-[#121212] text-[#212529] dark:text-[#E9ECEF] py-10 px-4 sm:px-6 lg:px-8 relative transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <Badge className="bg-primary-500 text-neutral-950 font-bold gap-1 px-3 py-1 rounded-full text-xs">
            <BookOpen className="h-3 w-3" />
            주차 시뮬레이션 가이드북
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
            공식 주차 궤적 가이드
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-xl mx-auto leading-[1.6]">
            실감 나는 조작법과 핸들 꺾기 타이밍을 시나리오별 단계적 설명으로 쉽게 알아봅니다.
          </p>
        </div>

        {/* 조작법 및 안전 수칙 (Controls & Rules) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <Card className="p-5 border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/60 backdrop-blur-sm shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
                <Key className="h-4.5 w-4.5 text-primary-500" />
                키보드 기본 조작
              </h3>
              <ul className="text-xs space-y-2 text-neutral-600 dark:text-neutral-300">
                <li className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-1">
                  <span>전진 / 후진</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">W / S</span>
                </li>
                <li className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-1">
                  <span>조향 (핸들 회전)</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">A / D</span>
                </li>
                <li className="flex items-center justify-between pb-0.5">
                  <span>브레이크 (제동)</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Spacebar</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-5 border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/60 backdrop-blur-sm shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4.5 w-4.5 text-accent-500" />
              기어 변속 안전 규칙
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              실제 차량과 동일하게 반드시 <strong>브레이크(Spacebar)를 완전히 밟은 상태</strong>에서만 기어 변속(P ➔ D ➔ R)이 가능합니다. 브레이크 없이 변속 시 화면에 경고 문구가 발생합니다.
            </p>
          </Card>

          <Card className="p-5 border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/60 backdrop-blur-sm shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
              <Flag className="h-4.5 w-4.5 text-secondary-500" />
              미션 성공 조건
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              목표 슬롯(초록색 라인) 내부 영역으로 차량을 정확히 수평 정렬하여 밀착시킨 후, 기어를 <strong>P(주차)</strong>로 변속하고 차가 정지한 채로 <strong>1.5초</strong>간 버티면 주차가 성공 완료됩니다.
            </p>
          </Card>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <div className="flex gap-4 p-1 bg-white dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-800">
            <Button
              onClick={() => setActiveTab('T-park')}
              className={`rounded-full px-6 py-2.5 font-bold transition-all text-sm ${
                activeTab === 'T-park'
                  ? 'bg-primary-500 text-neutral-950 hover:bg-primary-400'
                  : 'bg-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <Navigation className="h-4.5 w-4.5 mr-1.5 rotate-90" />
              T자 주차 (직각 주차)
            </Button>
            <Button
              onClick={() => setActiveTab('parallel')}
              className={`rounded-full px-6 py-2.5 font-bold transition-all text-sm ${
                activeTab === 'parallel'
                  ? 'bg-primary-500 text-neutral-950 hover:bg-primary-400'
                  : 'bg-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <Compass className="h-4.5 w-4.5 mr-1.5" />
              평행 주차 (가로 주차)
            </Button>
          </div>
        </div>

        {/* Steps Grid card list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentSteps.map((step) => (
            <div
              key={step.stepNum}
              className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl backdrop-blur-sm space-y-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-primary-500 font-extrabold uppercase tracking-wide">
                    STEP 0{step.stepNum}
                  </span>
                  
                  {/* Steering wheel visual angle icon indicator */}
                  <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-500">
                    <span className="text-[10px]">핸들 방향:</span>
                    {step.wheelAngle === 'straight' && (
                      <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 text-[10px] font-semibold py-0.5 px-1.5">
                        직진 (1자)
                      </Badge>
                    )}
                    {step.wheelAngle === 'left' && (
                      <Badge variant="secondary" className="bg-primary-500/10 text-primary-400 border border-primary-500/20 text-[10px] font-semibold py-0.5 px-1.5">
                        ◀ 좌측 끝까지
                      </Badge>
                    )}
                    {step.wheelAngle === 'right' && (
                      <Badge variant="secondary" className="bg-secondary-500/10 text-secondary-400 border border-secondary-500/20 text-[10px] font-semibold py-0.5 px-1.5">
                        우측 끝까지 ▶
                      </Badge>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-[1.6] min-h-[48px]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA to start practice */}
        <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl text-center space-y-4">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-neutral-800 dark:text-white">공식을 확인하셨나요?</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-[1.6]">
              학습한 공식을 시뮬레이션 환경에서 키보드와 마우스 기어 스크롤을 이용해 연습해 보세요.
            </p>
          </div>
          <Button
            asChild
            className="rounded-full bg-primary-500 text-neutral-950 hover:bg-primary-400 hover:scale-105 active:scale-95 transition-all font-bold px-8"
          >
            <Link href="/simulation">공식 실전 연습하기</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
