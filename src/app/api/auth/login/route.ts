import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = verifyUser(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to sign in' }, { status: 400 });
  }
}
