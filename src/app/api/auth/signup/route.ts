import { NextResponse } from 'next/server';

export function POST() {
  return NextResponse.json({ error: 'Use Firebase Authentication to create an account.' }, { status: 410 });
}
