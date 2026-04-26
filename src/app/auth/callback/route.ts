import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/album';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    const base = process.env.NEXT_PUBLIC_SITE_URL || origin;
    if (!error) {
      return NextResponse.redirect(`${base}${next}`);
    }
    return NextResponse.redirect(`${base}/login?error=auth_callback_failed`);
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || origin}/login?error=auth_callback_failed`);
}
