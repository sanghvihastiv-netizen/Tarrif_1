import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { adminAuth, firestore } from '@/lib/firebase-admin';

const ALLOWED_SOURCES = new Set(['user', 'gemini', 'database', 'default']);

async function authenticatedUserId(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  try {
    const token = await adminAuth.verifyIdToken(authorization.slice('Bearer '.length).trim());
    return token.uid;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export async function POST(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    if (!userId) return NextResponse.json({ error: 'Please sign in before saving a calculation.' }, { status: 401 });

    const body: unknown = await request.json();
    if (!isRecord(body)) return NextResponse.json({ error: 'Calculation data is invalid.' }, { status: 400 });

    const { input, taxBreakdown, subtotal, totalAmount, taxRuleVersion, taxSource, warning, isEstimated } = body;
    if (
      !isRecord(input) || !isRecord(taxBreakdown) ||
      typeof subtotal !== 'number' || !Number.isFinite(subtotal) || subtotal < 0 ||
      typeof totalAmount !== 'number' || !Number.isFinite(totalAmount) || totalAmount < 0 ||
      typeof taxRuleVersion !== 'string' || !taxRuleVersion.trim() ||
      typeof taxSource !== 'string' || !ALLOWED_SOURCES.has(taxSource)
    ) {
      return NextResponse.json({ error: 'Calculation data is incomplete or invalid.' }, { status: 400 });
    }

    const identity = JSON.stringify({ userId, input, taxBreakdown, totalAmount, taxRuleVersion, taxSource });
    const dedupeKey = crypto.createHash('sha256').update(identity).digest('hex');
    const reference = firestore.collection('savedCalculations').doc(dedupeKey);
    const existing = await reference.get();
    if (existing.exists) {
      return NextResponse.json({ saved: true, duplicate: true, id: reference.id, message: 'Calculation already saved.' });
    }

    await reference.create({
      userId,
      input,
      taxBreakdown,
      subtotal,
      totalAmount,
      taxRuleVersion: taxRuleVersion.trim(),
      taxSource,
      warning: typeof warning === 'string' ? warning.slice(0, 1000) : null,
      isEstimated: isEstimated === true,
      dedupeKey,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ saved: true, duplicate: false, id: reference.id, message: 'Calculation saved successfully.' });
  } catch (error) {
    console.error('Calculation save failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Could not save calculation.' }, { status: 500 });
  }
}
