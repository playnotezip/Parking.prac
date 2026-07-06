'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  RotateCcw,
  Play,
  History,
  AlertTriangle,
  Clock,
  Gauge,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ResultModalProps {
  isOpen: boolean;
  score: number;
  elapsedTimeSeconds: number;
  collisionCount: number;
  lineViolationDurationSeconds: number;
  finalAngleOffsetDegree: number;
  carType: string;
  mapId: string;
  modeId: string;
  isSuccess: boolean;
  onClose: () => void;
  onReplay: () => void;
  onRetry: () => void;
}

export default function ResultModal({
  isOpen,
  score,
  elapsedTimeSeconds,
  collisionCount,
  lineViolationDurationSeconds,
  finalAngleOffsetDegree,
  carType,
  mapId,
  modeId,
  isSuccess,
  onClose,
  onReplay,
  onRetry,
}: ResultModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [loadingFeedback, setLoadingFeedback] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Check auth user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    fetchUser();
  }, [supabase]);

  // Fetch feedback and save record when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchFeedbackAndSave = async () => {
      setLoadingFeedback(true);
      setAiFeedback('');
      setIsSaved(false);

      // 1. Handle Tutorial Mode (skip DB/Local storage logging)
      if (modeId === 'tutorial') {
        setAiFeedback('축하합니다! 튜토리얼 3단계(크리프 주행 제동, 전/후진 가감속, 최종 주차 공식) 과정을 성공적으로 완료하셨습니다. 이제 주차 마스터로서 본 게임 모드에 도전해 보세요!');
        setIsSaved(true);
        setLoadingFeedback(false);
        return;
      }

      try {
        let feedbackText = '';

        if (!isSuccess) {
          // 2. Handle Game Over (Skip OpenAI, set failure message)
          feedbackText = '충돌 횟수가 초과되었거나 제한 시간이 만료되어 실격(게임오버)되었습니다. 속도를 낮추고 사이드미러 및 후방 카메라 화면을 상시 대조하며 차량의 전폭/축거 궤적을 잡는 연습이 요구됩니다.';
          setAiFeedback(feedbackText);
        } else {
          // 3. Normal Success - Fetch AI Feedback from OpenAI
          const res = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              carType,
              mapId,
              elapsedTimeSeconds,
              collisionCount,
              lineViolationDurationSeconds,
              finalAngleOffsetDegree,
            }),
          });

          if (!res.ok) throw new Error('AI 피드백 요청 실패');
          const data = await res.json();
          feedbackText = data.feedback || '안전하게 주차 연습을 마무리하였습니다.';
          setAiFeedback(feedbackText);
        }

        // Prepare record to save (always record game clears & failures)
        const record = {
          car_type: carType,
          map_id: mapId,
          elapsed_time_seconds: elapsedTimeSeconds,
          collision_count: collisionCount,
          line_violation_seconds: lineViolationDurationSeconds,
          final_angle_offset: finalAngleOffsetDegree,
          score: isSuccess ? score : 0, // Failed attempts score 0
          ai_feedback: feedbackText,
        };

        // Determine current session user
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        if (currentUser) {
          // Save to Supabase DB
          const { error } = await supabase
            .from('parking_histories')
            .insert({ ...record, user_id: currentUser.id });

          if (error) {
            console.error('Supabase DB save error:', error);
            saveToLocalStorage(record);
          } else {
            setIsSaved(true);
          }
        } else {
          saveToLocalStorage(record);
        }
      } catch (err) {
        console.error('Error fetching feedback or saving:', err);
        setAiFeedback('AI 피드백을 불러오는 데 실패했습니다. 통계 리포트를 참고하세요.');
      } finally {
        setLoadingFeedback(false);
      }
    };

    fetchFeedbackAndSave();
  }, [
    isOpen,
    carType,
    mapId,
    modeId,
    isSuccess,
    elapsedTimeSeconds,
    collisionCount,
    lineViolationDurationSeconds,
    finalAngleOffsetDegree,
    score,
    supabase,
  ]);

  const saveToLocalStorage = (record: any) => {
    try {
      const history = JSON.parse(localStorage.getItem('parking_history') || '[]');
      history.unshift({ ...record, created_at: new Date().toISOString(), id: crypto.randomUUID() });
      localStorage.setItem('parking_history', JSON.stringify(history));
      setIsSaved(true);
    } catch (e) {
      console.error('Local storage save failed:', e);
    }
  };

  const getScoreGrade = (s: number) => {
    if (s >= 90) return { label: 'S등급', color: 'text-primary-500 border-primary-500 bg-primary-500/10' };
    if (s >= 75) return { label: 'A등급', color: 'text-secondary-500 border-secondary-500 bg-secondary-500/10' };
    if (s >= 60) return { label: 'B등급', color: 'text-sky-400 border-sky-400 bg-sky-400/10' };
    return { label: 'F등급 (재시험)', color: 'text-red-400 border-red-405 bg-red-400/10' };
  };

  const grade = getScoreGrade(score);
  const isTimeOut = elapsedTimeSeconds >= 300; // 5 mins

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-6 rounded-3xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left relative">
        {/* Close button X */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          ✕
        </button>

        <div className="flex flex-col items-center border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {modeId === 'tutorial' ? (
              <>
                <Sparkles className="h-6 w-6 text-primary-500 animate-bounce" />
                <span>튜토리얼 수료 성공!</span>
              </>
            ) : !isSuccess ? (
              <>
                <XCircle className="h-6 w-6 text-red-500 animate-pulse" />
                <span>실격! 주차 실패</span>
              </>
            ) : score >= 60 ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-primary-500" />
                <span>주차 성공!</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <span>점수 미달! 주차 실패</span>
              </>
            )}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs text-center mt-1.5">
            {modeId === 'tutorial'
              ? '주차 기초 가이드 단계를 모두 통과하셨습니다.'
              : !isSuccess
              ? '생명력이 소진되었거나 제한 시간(5분)이 경과되었습니다.'
              : '차량을 정렬하고 기어를 P로 정상 변경하여 마쳤습니다.'}
          </p>
        </div>

        {/* Score and Grade */}
        <div className="flex flex-col items-center py-4 bg-neutral-50 dark:bg-neutral-950/40 rounded-2xl border border-neutral-200 dark:border-neutral-850 mt-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider uppercase">획득 점수</span>
          <span className="text-5xl font-black mt-1 text-neutral-900 dark:text-white tracking-tight">{score}<span className="text-sm text-neutral-500"> / 100</span></span>
          <Badge variant="outline" className={`mt-2 font-bold px-3 py-1 text-sm rounded-full ${grade.color}`}>
            {grade.label}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center my-4">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-950/30 border border-neutral-200 dark:border-neutral-850 rounded-xl">
            <Clock className="h-4 w-4 mx-auto text-neutral-500 dark:text-neutral-400 mb-1" />
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">소요 시간</span>
            <p className="text-sm font-bold text-neutral-800 dark:text-white mt-0.5">{elapsedTimeSeconds}초</p>
          </div>
          <div className="p-3 bg-neutral-50 dark:bg-neutral-950/30 border border-neutral-200 dark:border-neutral-850 rounded-xl">
            <AlertTriangle className="h-4 w-4 mx-auto text-red-500 mb-1" />
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">충돌 횟수</span>
            <p className="text-sm font-bold text-neutral-850 dark:text-white mt-0.5">{collisionCount}회</p>
          </div>
          <div className="p-3 bg-neutral-50 dark:bg-neutral-950/30 border border-neutral-200 dark:border-neutral-850 rounded-xl">
            <Gauge className="h-4 w-4 mx-auto text-yellow-600 dark:text-yellow-500 mb-1" />
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">선 침범</span>
            <p className="text-sm font-bold text-neutral-850 dark:text-white mt-0.5">{lineViolationDurationSeconds.toFixed(1)}초</p>
          </div>
          <div className="p-3 bg-neutral-50 dark:bg-neutral-950/30 border border-neutral-200 dark:border-neutral-850 rounded-xl">
            <Sparkles className="h-4 w-4 mx-auto text-primary-500 mb-1" />
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">정렬 오차</span>
            <p className="text-sm font-bold text-neutral-850 dark:text-white mt-0.5">{finalAngleOffsetDegree.toFixed(1)}°</p>
          </div>
        </div>

        {/* AI Feedback Box */}
        <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-850 pt-4">
          <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary-500" />
            AI 오토스쿨 코칭 분석
          </h4>
          <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl min-h-[72px] flex items-center justify-center border border-neutral-200 dark:border-neutral-850 text-left">
            {loadingFeedback ? (
              <div className="flex flex-col items-center gap-2 py-2 w-full">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent" />
                <span className="text-xs text-neutral-500">주차 데이터 및 궤적 분석 중...</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                {aiFeedback}
              </p>
            )}
          </div>
        </div>

        {/* Guest Save / Sync Callout */}
        {!user && isSaved && (
          <div className="p-3 bg-primary-500/10 dark:bg-primary-500/5 border border-primary-500/30 dark:border-primary-500/20 rounded-xl text-center">
            <span className="text-xs text-primary-700 dark:text-primary-400">
              💡 게스트 기록이 브라우저에 임시 저장되었습니다.{' '}
              <Link href="/auth/signup" className="underline font-bold text-primary-600 dark:text-primary-500 hover:text-primary-500 dark:hover:text-primary-400">
                회원가입
              </Link>하여 계정에 연동해 보세요!
            </span>
          </div>
        )}

        {/* Modal Footer / Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 border-t border-neutral-200 dark:border-neutral-850 pt-4 mt-2">
          <div className="flex gap-2 flex-1">
            <Button
              onClick={onReplay}
              variant="outline"
              className="flex-1 gap-2 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-950 text-neutral-800 dark:text-white"
            >
              <Play className="h-4 w-4 fill-neutral-800 dark:fill-white" />
              리플레이 보기
            </Button>
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex-1 gap-2 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-950 text-neutral-800 dark:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              다시 시도
            </Button>
          </div>

          <Button
            onClick={() => {
              onClose();
              router.push('/mypage');
            }}
            className="w-full sm:w-auto bg-primary-500 text-neutral-950 font-bold hover:bg-primary-400"
          >
            <History className="h-4 w-4 mr-1.5" />
            마이페이지 이력 확인
          </Button>
        </div>
      </div>
    </div>
  );
}
