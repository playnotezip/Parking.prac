'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Car, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: '입력 정보 부족',
        description: '모든 필드를 입력해 주세요.',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: '비밀번호 제한 오류',
        description: '비밀번호는 최소 6자 이상이어야 합니다.',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: '비밀번호 불일치',
        description: '입력하신 비밀번호가 일치하지 않습니다.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
 
      const resData = await response.json();
 
      if (!response.ok) {
        throw new Error(resData.error || '회원가입 도중 에러가 발생했습니다.');
      }
 
      // Try logging in using NextAuth
      const formattedEmail = username.includes('@') ? username : `${username}@parking.prac`;
      const signInRes = await signIn('credentials', {
        redirect: false,
        email: formattedEmail,
        password,
      });
 
      if (signInRes?.error) {
        toast({
          title: '회원가입 완료',
          description: '회원가입은 완료되었으나 자동 로그인을 진행할 수 없습니다. 로그인 페이지로 이동합니다.',
        });
        router.push('/auth/login');
      } else {
        // Also log in to Supabase client-side for immediate session syncing
        try {
          await supabase.auth.signInWithPassword({
            email: formattedEmail,
            password,
          });
        } catch (e) {
          console.warn('Supabase client sign-in failed during signup:', e);
        }
        
        toast({
          title: '회원가입 성공',
          description: '성공적으로 가입되었으며 자동 로그인되었습니다!',
        });
        router.push('/simulation');
      }
      router.refresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: '회원가입 실패',
        description: err.message || '가입 도중 에러가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-neutral-800 bg-neutral-900 text-white shadow-2xl">
      <CardHeader className="space-y-1 flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 text-neutral-950 mb-2">
          <Car className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">회원가입</CardTitle>
        <CardDescription className="text-neutral-400 text-center">
          새 계정을 만들고 주차 연습 기록 관리를 시작하세요.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-neutral-200">아이디</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4.5 w-4.5 text-neutral-400" />
              <Input
                id="username"
                type="text"
                placeholder="아이디 입력"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 border-neutral-800 bg-neutral-950 text-white placeholder-neutral-500 focus-visible:ring-primary-500"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-neutral-200">비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-neutral-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="최소 6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 border-neutral-800 bg-neutral-950 text-white placeholder-neutral-500 focus-visible:ring-primary-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-neutral-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-neutral-200">비밀번호 확인</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-neutral-400" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호 재입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 border-neutral-800 bg-neutral-950 text-white placeholder-neutral-500 focus-visible:ring-primary-500"
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary-500 text-neutral-950 font-bold hover:bg-primary-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? '가입 중...' : '회원가입'}
          </Button>
          <div className="text-sm text-neutral-400 text-center">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-primary-500 hover:underline">
              로그인
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
