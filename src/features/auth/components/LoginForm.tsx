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

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        variant: 'destructive',
        title: '입력 정보가 유효하지 않습니다.',
        description: '아이디와 비밀번호를 모두 입력해주세요.',
      });
      return;
    }

    setLoading(true);
    try {
      const formattedEmail = username.includes('@') ? username : `${username}@parking.prac`;
      const res = await signIn('credentials', {
        redirect: false,
        email: formattedEmail,
        password,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      // Synchronize client-side Supabase session
      await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password,
      });

      toast({
        title: '로그인 완료!',
        description: '성공적으로 로그인되었습니다.',
      });
      
      router.push('/simulation');
      router.refresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: '로그인 실패',
        description: err.message || '아이디 또는 비밀번호가 올바르지 않습니다.',
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
        <CardTitle className="text-2xl font-bold tracking-tight">로그인</CardTitle>
        <CardDescription className="text-neutral-400 text-center">
          주차 시뮬레이션을 즐기고 연습 이력을 기록해보세요.
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
                placeholder="••••••••"
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary-500 text-neutral-950 font-bold hover:bg-primary-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
          <div className="text-sm text-neutral-400 text-center">
            계정이 없으신가요?{' '}
            <Link href="/auth/signup" className="text-primary-500 hover:underline">
              회원가입
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
