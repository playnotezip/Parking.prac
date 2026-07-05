'use client';

import React from 'react';
import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] bg-neutral-950 relative overflow-hidden px-4">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-accent-500/10 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full flex justify-center">
        <LoginForm />
      </div>
    </div>
  );
}
