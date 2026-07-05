import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase 서버 환경변수가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // Initialize Supabase admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const formattedEmail = username.includes('@') ? username : `${username}@parking.prac`;

    // Create user using admin API (bypasses email validation limits and auto-confirms email)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: formattedEmail,
      password: password,
      email_confirm: true,
    });

    if (error) {
      // Check if user already exists
      if (error.message.includes('already registered') || error.message.includes('unique constraint')) {
        return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
