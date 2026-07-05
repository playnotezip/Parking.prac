'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Car,
  History,
  ShieldAlert,
  Clock,
  Sparkles,
  Trophy,
  Trash2,
  Lock,
  ArrowRightLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ParkingHistoryItem {
  id: string;
  car_type: string;
  map_id: string;
  elapsed_time_seconds: number;
  collision_count: number;
  line_violation_seconds: number;
  final_angle_offset: number;
  score: number;
  ai_feedback: string;
  created_at: string;
}

export default function MyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<ParkingHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Translate keys to Korean
  const carNames: Record<string, string> = {
    compact: '소형차',
    sedan: '준중형 세단',
    suv: '대형 SUV',
  };
  
  const mapNames: Record<string, string> = {
    rear: '후면 주차 코스 (T자)',
    front: '전면 주차 코스 (전방)',
    parallel: '평행 주차 코스 (수평)',
    apartment: '아파트 지하 주차장',
    mart: '대형마트 야외 주차장',
    alleyway: '비좁은 골목길 주차',
  };

  const getScoreGradeColor = (s: number) => {
    if (s >= 90) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (s >= 75) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    if (s >= 60) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  };

  // Sync Guest Data from localStorage to Supabase DB when user logs in
  const syncGuestDataToDB = async (userId: string) => {
    try {
      const guestHistory = JSON.parse(localStorage.getItem('parking_history') || '[]');
      if (guestHistory.length === 0) return;

      setSyncing(true);
      
      const recordsToInsert = guestHistory.map((item: any) => ({
        user_id: userId,
        car_type: item.car_type,
        map_id: item.map_id,
        elapsed_time_seconds: item.elapsed_time_seconds,
        collision_count: item.collision_count,
        line_violation_seconds: item.line_violation_seconds,
        final_angle_offset: item.final_angle_offset,
        score: item.score,
        ai_feedback: item.ai_feedback,
        created_at: item.created_at || new Date().toISOString(),
      }));

      const { error } = await supabase.from('parking_histories').insert(recordsToInsert);

      if (!error) {
        localStorage.removeItem('parking_history');
        toast({
          title: '동기화 완료 ⚡',
          description: `게스트 모드에서 연습한 ${recordsToInsert.length}개의 주차 기록이 클라우드 계정에 저장되었습니다.`,
        });
      } else {
        console.error('Failed to sync guest histories:', error);
      }
    } catch (e) {
      console.error('Guest sync failed:', e);
    } finally {
      setSyncing(false);
    }
  };

  // Load user and histories
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Sync offline local storage records first
          await syncGuestDataToDB(currentUser.id);

          // Fetch from Supabase RDB
          const { data, error } = await supabase
            .from('parking_histories')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          setHistory(data || []);
        } else {
          // Read guest records from local storage
          const guestHistory = JSON.parse(localStorage.getItem('parking_history') || '[]');
          setHistory(guestHistory);
        }
      } catch (err) {
        console.error('Dashboard load failed:', err);
        toast({
          variant: 'destructive',
          description: '기록 데이터를 가져오는 데 실패했습니다.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [supabase]);

  // Handle Clearing history
  const handleClearHistory = async () => {
    if (!window.confirm('모든 주차 연습 이력을 초기화하시겠습니까? 복구할 수 없습니다.')) return;

    setLoading(true);
    try {
      if (user) {
        const { error } = await supabase
          .from('parking_histories')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        localStorage.removeItem('parking_history');
      }
      setHistory([]);
      toast({
        description: '연습 기록이 성공적으로 비워졌습니다.',
      });
    } catch (err) {
      console.error('Clear failed:', err);
      toast({
        variant: 'destructive',
        description: '이력을 지우는 도중 에러가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Stats derivations
  const totalPlays = history.length;
  const bestScore = totalPlays > 0 ? Math.max(...history.map((h) => h.score)) : 0;
  const avgCollisions =
    totalPlays > 0
      ? (history.reduce((acc, h) => acc + h.collision_count, 0) / totalPlays).toFixed(1)
      : '0.0';
  const avgTime =
    totalPlays > 0
      ? Math.round(history.reduce((acc, h) => acc + h.elapsed_time_seconds, 0) / totalPlays)
      : 0;

  return (
    <div className="flex-1 bg-[#F8F9FA] dark:bg-[#121212] text-[#212529] dark:text-[#E9ECEF] py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Background decoration */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[300px] rounded-full bg-primary-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <History className="h-8 w-8 text-primary-500" />
              주차 연습 대시보드
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              {user ? (
                <>
                  <strong className="text-neutral-800 dark:text-white">
                    {user.email?.endsWith('@parking.prac') ? user.email.split('@')[0] : user.email}
                  </strong> 계정으로 누적된 공식 주차 기록입니다.
                </>
              ) : (
                '게스트 모드로 저장된 임시 기록입니다. 브라우저 쿠키 삭제 시 소멸할 수 있습니다.'
              )}
            </p>
          </div>

          <div className="flex gap-2">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-red-500/20"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                전체 기록 초기화
              </Button>
            )}
          </div>
        </div>

        {/* Guest Warning / Call to Action Sign Up */}
        {!user && (
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 backdrop-blur-sm p-4 text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-neutral-900 dark:text-white font-bold flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-secondary-500" />
                기록을 영구히 저장하고 싶으신가요?
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-[1.6]">
                회원가입 후 로그인하시면, 현재 브라우저에 남은 게스트 이력이 자동으로 안전하게 영구 클라우드 DB에 동기화됩니다.
              </p>
            </div>
            <Link href="/auth/signup">
              <Button className="bg-primary-500 text-neutral-950 font-bold hover:bg-primary-400 transition-all hover:scale-105 rounded-full px-6">
                회원가입 후 동기화
              </Button>
            </Link>
          </Card>
        )}

        {/* Statistics Tiles Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold text-neutral-500 tracking-wider">누적 연습량</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex items-baseline justify-between">
              <span className="text-3xl font-black text-neutral-800 dark:text-white">{totalPlays}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">세션 완료</span>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold text-neutral-500 tracking-wider">최고 점수</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex items-baseline justify-between">
              <span className="text-3xl font-black text-primary-500">{bestScore}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">점</span>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold text-neutral-500 tracking-wider">평균 충돌 횟수</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex items-baseline justify-between">
              <span className="text-3xl font-black text-red-500 dark:text-red-400">{avgCollisions}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">회 / 게임</span>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold text-neutral-500 tracking-wider">평균 주차 시간</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex items-baseline justify-between">
              <span className="text-3xl font-black text-yellow-600 dark:text-yellow-500">{avgTime}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">초</span>
            </CardContent>
          </Card>
        </div>

        {/* History Log list */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white text-left flex items-center gap-2">
            <History className="h-5 w-5 text-primary-500" />
            최근 주차 연습 이력
          </h2>

          {loading || syncing ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
              <span className="text-sm text-neutral-500">연습 기록을 처리하는 중...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-850 rounded-2xl bg-white dark:bg-neutral-900/10">
              <Car className="h-12 w-12 mx-auto text-neutral-400 dark:text-neutral-600 mb-3" />
              <h3 className="text-lg font-bold text-neutral-850 dark:text-white">완료된 이력이 없습니다</h3>
              <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-1 max-w-sm mx-auto leading-[1.6]">
                시뮬레이션을 구동하여 주차 연습을 마무리하고 등급 판정과 AI 교정 코칭 피드백을 받아보세요!
              </p>
              <Button
                asChild
                className="mt-5 rounded-full bg-primary-500 text-neutral-950 font-bold hover:bg-primary-400 hover:scale-105 active:scale-95 transition-all"
              >
                <Link href="/simulation">첫 시뮬레이션 연습하기</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const gradeInfo =
                  item.score >= 90 ? 'S등급' : item.score >= 75 ? 'A등급' : item.score >= 60 ? 'B등급' : 'F등급';
                const formattedDate = format(parseISO(item.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });

                return (
                  <Card
                    key={item.id}
                    className="border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900/45 text-neutral-900 dark:text-white backdrop-blur-sm text-left hover:border-neutral-350 dark:hover:border-neutral-700 transition-colors"
                  >
                    <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between flex-wrap gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-neutral-900 dark:text-white">
                            {mapNames[item.map_id] || item.map_id}
                          </span>
                          <Badge variant="outline" className="text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                            {carNames[item.car_type] || item.car_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-500">{formattedDate}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs text-neutral-500">점수</span>
                          <p className="text-lg font-black text-neutral-900 dark:text-white">{item.score}점</p>
                        </div>
                        <Badge variant="outline" className={`font-extrabold rounded-full text-xs px-2 py-0.5 ${getScoreGradeColor(item.score)}`}>
                          {gradeInfo}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-4">
                      {/* Technical Specs row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs border-y border-neutral-100 dark:border-neutral-850/50 py-3 text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                          소요 시간: <strong className="text-neutral-800 dark:text-white">{item.elapsed_time_seconds}초</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                          충돌: <strong className="text-red-500 dark:text-red-400">{item.collision_count}회</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                          각도 오차: <strong className="text-neutral-800 dark:text-white">{Number(item.final_angle_offset).toFixed(1)}°</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowRightLeft className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
                          선 침범: <strong className="text-yellow-600 dark:text-yellow-400">{Number(item.line_violation_seconds).toFixed(1)}초</strong>
                        </span>
                      </div>

                      {/* AI Feedback quote */}
                      <div className="bg-neutral-50 dark:bg-neutral-950/70 p-3.5 border border-neutral-200 dark:border-neutral-850 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-primary-500 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI 종합 피드백 코칭
                        </span>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-[1.6]">
                          {item.ai_feedback}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
