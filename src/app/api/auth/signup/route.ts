import { NextResponse } from 'next/server';
import { createUserAccount } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, displayName } = body as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = createUserAccount(email, password, displayName);
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Signup API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create account' }, { status: 400 });
  }
}
