import { NextResponse } from 'next/server';
import { calculateTaxBreakdownFromRules, getStoredTaxRules, normalizeRate, upsertTaxRules, type TaxRuleEntry } from '@/lib/tax';

function normalizeTaxExtraction(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Record<string, unknown>;
  const rules = Array.isArray(candidate.taxRules) ? candidate.taxRules : [];
  const cleaned: TaxRuleEntry[] = [];

  for (const item of rules) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const rate = normalizeRate(entry.rate);
    const country = typeof entry.country === 'string' ? entry.country.trim() : '';
    const hsCode = typeof entry.hsCode === 'string' ? entry.hsCode.trim() : '';
    const name = typeof entry.name === 'string' ? entry.name.trim() : 'Tax';
    const taxType = typeof entry.taxType === 'string' ? entry.taxType.trim() : 'tax';
    const rule = typeof entry.rule === 'string' ? entry.rule.trim() : 'Gemini extraction';

    if (!country || !hsCode || rate === null || !Number.isFinite(rate) || rate < 0) continue;

    cleaned.push({
      country,
      hsCode,
      name,
      taxType,
      rule,
      rate,
      source: 'gemini',
      version: typeof candidate.version === 'string' ? candidate.version : 'gemini-v1',
    });
  }

  if (!cleaned.length) return null;

  return {
    version: typeof candidate.version === 'string' ? candidate.version : 'gemini-v1',
    rules: cleaned,
  };
}

async function extractWithGemini(payload: Record<string, unknown>) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.warn('Tax extraction requested without GEMINI_API_KEY; using stored tax table only.');
    return null;
  }

  const prompt = `You are a trade tax extraction engine. Extract the latest applicable import taxes, duties, and related tax rules for the provided shipment information. Return valid JSON only with this exact shape:
{
  "version": "string",
  "taxRules": [
    {
      "country": "string",
      "hsCode": "string",
      "name": "string",
      "taxType": "duty|tax|fee",
      "rate": 0.15,
      "rule": "short description of the rule"
    }
  ]
}

Shipment input:
${JSON.stringify(payload, null, 2)}`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800,
        },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Gemini tax extraction failed:', { status: response.status });
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      console.warn('Gemini tax extraction returned no JSON payload.');
      return null;
    }

    const parsed = JSON.parse(match[0]);
    return normalizeTaxExtraction(parsed);
  } catch (error) {
    console.error('Tax extraction error:', error instanceof Error ? error.message : 'Unknown extraction failure');
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {};

    const route = payload.route as Record<string, unknown> | undefined;
    const product = payload.product as Record<string, unknown> | undefined;
    const shipment = payload.shipment as Record<string, unknown> | undefined;

    if (!route || !product || !shipment) {
      return NextResponse.json({
        error: 'Missing route, product, or shipment data for tax extraction.',
      }, { status: 400 });
    }

    const geminiResult = await extractWithGemini(payload);

    if (geminiResult) {
      try {
        upsertTaxRules(geminiResult.rules.map((rule) => ({ ...rule, source: 'gemini', version: geminiResult.version })));
      } catch (error) {
        console.error('Failed to persist Gemini tax rules:', error instanceof Error ? error.message : 'unknown');
      }

      const routeCountry = typeof route.destinationCountry === 'string' ? route.destinationCountry : '';
      const hsCode = typeof product.hsCode === 'string' ? product.hsCode : '';
      const productValue = Number(product.productValue || 0);
      const quantity = Number(product.quantity || 0);

      const result = calculateTaxBreakdownFromRules(productValue, quantity, geminiResult.rules, 'gemini', geminiResult.version);
      return NextResponse.json({
        ...result,
        taxSource: 'gemini',
        sourceLabel: 'Gemini tax extraction',
        country: routeCountry,
        hsCode,
      });
    }

    const fallbackRules = getStoredTaxRules(
      typeof route.destinationCountry === 'string' ? route.destinationCountry : undefined,
      typeof product.hsCode === 'string' ? product.hsCode : undefined,
    );

    const fallbackEntries: TaxRuleEntry[] = fallbackRules.map((rule) => ({
      country: rule.country,
      hsCode: rule.hsCode,
      name: rule.taxType,
      taxType: rule.taxType,
      rate: Number(rule.rate),
      rule: rule.rule || 'Stored tax rule',
      source: 'database',
      version: rule.version,
    }));

    if (!fallbackEntries.length) {
      console.error('Tax extraction and stored tax data unavailable for calculation.');
      return NextResponse.json({
        error: 'No valid tax data is available for this route. Please add tax rules or try again.',
        taxSource: 'unavailable',
      }, { status: 422 });
    }

    const result = calculateTaxBreakdownFromRules(
      Number(product.productValue || 0),
      Number(product.quantity || 0),
      fallbackEntries,
      'database',
      fallbackEntries[0].version,
    );

    return NextResponse.json({
      ...result,
      taxSource: 'database',
      sourceLabel: 'Stored tax table fallback',
    });
  } catch (error) {
    console.error('Tax calculation request error:', error instanceof Error ? error.message : 'Unknown server error');
    return NextResponse.json({
      error: 'Tax calculation request failed. Please try again.',
      taxSource: 'unavailable',
    }, { status: 500 });
  }
}
