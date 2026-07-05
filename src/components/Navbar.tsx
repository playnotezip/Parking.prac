'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Car, Menu, LogOut, User, BookOpen, Play, Home, Sun, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const loading = status === 'loading';

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }
    await nextAuthSignOut({ redirect: false });
    toast({
      description: '성공적으로 로그아웃되었습니다.',
    });
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { href: '/simulation', label: '시뮬레이션', icon: Play },
    { href: '/guide', label: '주차 가이드', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 dark:border-neutral-850 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md text-neutral-900 dark:text-white transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="rounded-xl bg-primary-500 p-2 text-neutral-950 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
              <Car className="h-6 w-6 font-bold" />
            </div>
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white group-hover:text-primary-500 transition-colors">
              Parking<span className="text-primary-500 group-hover:text-neutral-950 dark:group-hover:text-white">.Prac</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 text-sm font-medium transition-all hover:text-primary-500 hover:translate-y-[-1px] ${
                  isActive ? 'text-primary-500 border-b-2 border-primary-500 pb-1 mt-1' : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth & Theme Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Theme Toggle Button */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full h-9 w-9 transition-all active:scale-90"
              title="테마 전환"
            >
              {theme === 'dark' ? (
                <Sun className="h-4.5 w-4.5 text-amber-500" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-blue-500" />
              )}
            </Button>
          )}

          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/mypage">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-neutral-600 dark:text-neutral-300 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-transform active:scale-95"
                    >
                      <User className="h-4 w-4" />
                      마이페이지
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-2 text-red-500 hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-transform active:scale-95"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </Button>
                </>
              ) : (
                <Link href="/auth/login">
                  <Button
                    size="sm"
                    className="rounded-full bg-primary-500 text-neutral-950 font-bold hover:bg-primary-400 transition-all hover:scale-105 active:scale-95"
                  >
                    로그인 / 회원가입
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile Navigation & Theme Toggle */}
        <div className="flex lg:hidden items-center gap-3">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 rounded-full h-8 w-8"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-blue-500" />}
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">메뉴 열기</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] border-l border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-950 p-6 text-neutral-900 dark:text-white"
            >
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <Car className="h-6 w-6 text-primary-500" />
                    <span className="text-lg font-bold">Parking.Prac</span>
                  </div>

                  <nav className="flex flex-col gap-4">
                    <Link
                      href="/"
                      className={`flex items-center gap-3 py-2 px-3 rounded-lg text-base font-medium transition-colors ${
                        pathname === '/' 
                          ? 'bg-neutral-100 dark:bg-neutral-900 text-primary-500' 
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <Home className="h-5 w-5" />
                      홈으로
                    </Link>
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive = pathname.startsWith(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center gap-3 py-2 px-3 rounded-lg text-base font-medium transition-colors ${
                            isActive 
                              ? 'bg-neutral-100 dark:bg-neutral-900 text-primary-500' 
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6 space-y-3">
                  {user ? (
                    <>
                       <div className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                        <User className="h-4 w-4 text-primary-500" />
                        <span className="truncate">
                          {user.email?.endsWith('@parking.prac') ? user.email.split('@')[0] : user.email}
                        </span>
                      </div>
                      <Link href="/mypage" className="block w-full">
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 border-neutral-200 dark:border-neutral-850 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                        >
                          <User className="h-4 w-4" />
                          마이페이지
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="w-full justify-start gap-2 border-neutral-200 dark:border-neutral-850 text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                      >
                        <LogOut className="h-4 w-4" />
                        로그아웃
                      </Button>
                    </>
                  ) : (
                    <Link href="/auth/login" className="block w-full">
                      <Button className="w-full bg-primary-500 text-neutral-950 font-bold hover:bg-primary-400">
                        로그인 / 회원가입
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
