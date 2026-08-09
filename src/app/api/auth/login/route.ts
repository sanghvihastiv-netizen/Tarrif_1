import { NextResponse } from 'next/server';

export function POST() {
  return NextResponse.json({ error: 'Use Firebase Authentication to sign in.' }, { status: 410 });
}
