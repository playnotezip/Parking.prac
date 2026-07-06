'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, Sparkles, Shield, Compass, User, Globe, Clock, History } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const supabase = createClient();
  const [sessionUser, setSessionUser] = useState<any>(null);
  
  // Stats states
  const [personalStats, setPersonalStats] = useState({ totalPlays: 0, totalTimeSeconds: 0 });
  const [globalStats, setGlobalStats] = useState({ totalPlays: 0, avgTimeSeconds: 0 });
  const [loading, setLoading] = useState(true);

  // Load user session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionUser(session?.user ?? null);
    };
    checkUser();
  }, [supabase]);

  // Main fetch function for statistics
  const fetchStats = async () => {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;

      // 1. Fetch Global Stats from Supabase
      const { data: globalData, error: globalErr } = await supabase
        .from('parking_histories')
        .select('elapsed_time_seconds, user_id');

      let dbGlobalCount = 0;
      let dbGlobalAvg = 0;

      if (globalData && globalData.length > 0) {
        // Filter out current user's data from global stats
        const otherUsersData = currentUser
          ? globalData.filter((h) => h.user_id !== currentUser.id)
          : globalData;

        dbGlobalCount = otherUsersData.length;
        if (dbGlobalCount > 0) {
          const totalSec = otherUsersData.reduce((acc, h) => acc + (h.elapsed_time_seconds || 0), 0);
          dbGlobalAvg = Math.round(totalSec / dbGlobalCount);
        }
      }

      setGlobalStats({
        totalPlays: dbGlobalCount, // actual DB entries
        avgTimeSeconds: dbGlobalAvg
      });

      // 2. Fetch Personal Stats
      if (currentUser) {
        // Fetch personal stats from DB
        const { data: personalData } = await supabase
          .from('parking_histories')
          .select('elapsed_time_seconds')
          .eq('user_id', currentUser.id);

        if (personalData) {
          const count = personalData.length;
          const sumTime = personalData.reduce((acc, h) => acc + (h.elapsed_time_seconds || 0), 0);
          setPersonalStats({ totalPlays: count, totalTimeSeconds: sumTime });
        }
      } else {
        // Fetch personal stats from Guest local storage
        const guestHistory = JSON.parse(localStorage.getItem('parking_history') || '[]');
        const count = guestHistory.length;
        const sumTime = guestHistory.reduce((acc: number, h: any) => acc + (h.elapsed_time_seconds || 0), 0);
        setPersonalStats({ totalPlays: count, totalTimeSeconds: sumTime });
      }
    } catch (e) {
      console.error('Error loading real-time stats:', e);
    } finally {
      setLoading(false);
    }
  };

  // Run statistics fetch and subscribe to realtime Postgres changes
  useEffect(() => {
    fetchStats();

    // Subscribe to insert changes on parking_histories table
    const channel = supabase
      .channel('realtime-statistics-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'parking_histories'
        },
        () => {
          // Re-fetch stats in real-time when a new play record is saved
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, sessionUser]);

  const features = [
    {
      icon: Shield,
      iconColor: 'text-primary-500 bg-primary-500/10',
      title: '실감 나는 2D 주차 물리 엔진',
      description: 'Ackermann 조향 모델 기반 차량 제어와 마찰력, 충돌 밀림 처리를 실시간 2D 캔버스로 제공합니다.',
    },
    {
      icon: Sparkles,
      iconColor: 'text-accent-500 bg-accent-500/10',
      title: 'AI 맞춤형 분석 코치',
      description: '주차가 완료되면 소요 시간, 충돌 횟수, 최종 정렬 오차 각도를 즉각 종합 분석하여 주차 성공 팁을 코칭 피드백으로 생성합니다.',
    },
    {
      icon: Compass,
      iconColor: 'text-secondary-500 bg-secondary-500/10',
      title: '다양한 맵 공간 레이아웃',
      description: '가장 기본적인 후면 T자 코스부터 난이도가 높은 수평 평행 코스 및 전면 코스까지 다양한 시뮬레이션을 즐길 수 있습니다.',
    },
  ];

  // Helper formatting for personal time
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) {
      return `${mins}분 ${secs}초`;
    }
    return `${secs}초`;
  };

  return (
    <div className="flex-1 bg-[#F8F9FA] dark:bg-[#121212] text-[#212529] dark:text-[#E9ECEF] flex flex-col relative overflow-hidden transition-colors duration-200">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent-500/5 blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 flex-1">
        {/* Left 6 Columns: Copy & CTA */}
        <div className="lg:col-span-6 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-primary-500 font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            주차 실력을 가볍고 재밌게 키우는 가상 연습장
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.2] text-neutral-900 dark:text-white">
              누구나 쉽게 즐기는
              <br />
              <span className="text-primary-500">가상 주차 연습</span>
              <br />
              시뮬레이터
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 font-medium leading-[1.6] max-w-xl">
              설치 없이 브라우저에서 차량 조작법을 익히고 자유롭게 차량을 주차해 보세요. 기어 변속과 미세한 핸들 정렬 감각을 손쉽게 쌓을 수 있습니다.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/simulation" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full bg-primary-500 text-neutral-950 font-extrabold hover:bg-primary-400 hover:scale-105 active:scale-95 transition-all text-base px-8 py-6 gap-2"
              >
                <Play className="h-5 w-5 fill-neutral-950" />
                시뮬레이션 시작하기
              </Button>
            </Link>

            <Link href="/guide" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto rounded-full border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 dark:hover:text-white hover:scale-105 active:scale-95 transition-all text-base px-8 py-6"
              >
                주차 가이드북 보기
              </Button>
            </Link>
          </div>

          {/* Real-time Statistics Section (Personal & Global) */}
          <div className="space-y-6 pt-6 border-t border-neutral-200 dark:border-neutral-900 max-w-xl">
            {/* Personal Area */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-primary-500 flex items-center gap-1.5 uppercase tracking-wider">
                <User className="h-3.5 w-3.5" />
                나의 연습 데이터 {sessionUser ? '(로그인)' : '(게스트 모드)'}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-850 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-semibold text-neutral-500 uppercase">누적 연습 세션</p>
                  <p className="text-xl font-black mt-0.5 text-neutral-900 dark:text-white">
                    {personalStats.totalPlays.toLocaleString()}회
                  </p>
                </div>
                <div className="bg-white/40 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-850 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-semibold text-neutral-500 uppercase">나의 총 연습 시간</p>
                  <p className="text-xl font-black mt-0.5 text-neutral-900 dark:text-white">
                    {formatTime(personalStats.totalTimeSeconds)}
                  </p>
                </div>
              </div>
            </div>

            {/* Global Area */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-secondary-500 flex items-center gap-1.5 uppercase tracking-wider">
                <Globe className="h-3.5 w-3.5" />
                글로벌 누적 연습 데이터 (전체 유저 실시간 연동)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-850 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-semibold text-neutral-500 uppercase">전체 연습 횟수</p>
                  <p className="text-xl font-black mt-0.5 text-neutral-900 dark:text-white">
                    {globalStats.totalPlays.toLocaleString()}회
                  </p>
                </div>
                <div className="bg-white/40 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-850 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-semibold text-neutral-500 uppercase">글로벌 평균 연습 시간</p>
                  <p className="text-xl font-black mt-0.5 text-neutral-900 dark:text-white">
                    {globalStats.avgTimeSeconds}초
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Interactive visual block */}
        <div className="lg:col-span-6 flex justify-center relative">
          <div className="relative w-full max-w-[500px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl group">
            {/* Custom generated parking simulation image */}
            <Image
              src="/hero_simulation.png"
              alt="Parking Simulation Graphic"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-90 dark:opacity-75 group-hover:scale-102 transition-transform duration-700"
              priority
            />

            {/* Neon Accent Overlay box */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-200/50 dark:from-neutral-950 via-transparent to-transparent" />
          </div>

          {/* Floating badge (Perfect visibility in light & dark mode) */}
          <div className="absolute -top-4 -right-4 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 rounded-2xl p-4 shadow-xl border border-neutral-800 dark:border-neutral-200 rotate-6 hidden sm:block animate-bounce max-w-[150px]">
            <p className="text-xs font-bold text-center">OpenAI 기반 피드백 탑재! ⚡</p>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="bg-neutral-100/50 dark:bg-neutral-900/30 border-t border-neutral-200 dark:border-neutral-900 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white">어디서든 쾌적한 웹 주차 연습 시뮬레이터</h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              설치 없이 브라우저에서 바로 다양한 차종 조작법을 익히고, 나에게 최적화된 맞춤형 피드백을 만나보세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <Card
                  key={index}
                  className="border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/50 backdrop-blur-sm text-left hover:border-neutral-350 dark:hover:border-neutral-800 transition-colors"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${feat.iconColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{feat.title}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-[1.6]">{feat.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
