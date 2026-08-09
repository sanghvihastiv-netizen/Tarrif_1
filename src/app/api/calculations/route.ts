import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

function hashValue(value: string) {
  return value;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      input,
      taxBreakdown,
      subtotal,
      totalAmount,
      taxRuleVersion,
      taxSource,
      warning,
      isEstimated,
    } = body as {
      userId?: string | number | null;
      input?: unknown;
      taxBreakdown?: unknown;
      subtotal?: number;
      totalAmount?: number;
      taxRuleVersion?: string;
      taxSource?: string;
      warning?: string | null;
      isEstimated?: boolean;
    };

    if (!input || !taxBreakdown || typeof totalAmount !== 'number') {
      return NextResponse.json({ error: 'Calculation data is incomplete.' }, { status: 400 });
    }

    const normalizedInput = JSON.stringify(input);
    const normalizedBreakdown = JSON.stringify(taxBreakdown);
    const dedupeKey = hashValue(`${userId ?? 'anonymous'}:${normalizedInput}:${normalizedBreakdown}:${totalAmount}:${taxRuleVersion ?? 'none'}:${taxSource ?? 'unknown'}`);

    const existing = db.prepare('SELECT id FROM saved_calculations WHERE dedupe_key = ?').get(dedupeKey) as { id: number } | undefined;
    if (existing) {
      return NextResponse.json({
        saved: true,
        duplicate: true,
        id: existing.id,
        message: 'Calculation already saved.',
      });
    }

    const result = db.prepare(`
      INSERT INTO saved_calculations (
        user_id,
        input_json,
        tax_breakdown_json,
        subtotal,
        total_amount,
        tax_rule_version,
        tax_source,
        warning,
        is_estimated,
        dedupe_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId ?? null,
      normalizedInput,
      normalizedBreakdown,
      Number(subtotal || 0),
      Number(totalAmount || 0),
      taxRuleVersion ?? 'unknown',
      taxSource ?? 'unknown',
      warning ?? null,
      isEstimated ? 1 : 0,
      dedupeKey,
    );

    return NextResponse.json({
      saved: true,
      duplicate: false,
      id: Number(result.lastInsertRowid),
      message: 'Calculation saved successfully.',
    });
  } catch (error) {
    console.error('Calculation save failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Could not save calculation.' }, { status: 500 });
  }
}
