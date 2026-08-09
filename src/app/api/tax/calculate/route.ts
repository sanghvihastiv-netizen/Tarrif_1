import { NextResponse } from 'next/server';
import {
  calculateTaxBreakdownFromRules,
  ensureDefaultTaxRules,
  getStoredTaxRules,
  MAX_TAX_RULES,
  normalizeCountry,
  normalizeHsCode,
  normalizeRate,
  STORED_WARNING,
  SUPPORTED_TAX_TYPES,
  upsertTaxRules,
  type TaxRuleEntry,
} from '@/lib/tax';

const GEMINI_TIMEOUT_MS = 8_000;
const DEFAULT_WARNING = 'The latest tax rates could not be extracted. Estimated default rates were used. You can enter the latest rates manually and recalculate.';

type InputData = {
  route: Record<string, unknown>;
  product: Record<string, unknown>;
  shipment: Record<string, unknown>;
};

function fieldError(field: string, message: string) {
  return NextResponse.json({ error: message, field, errors: { [field]: message } }, { status: 400 });
}

function validateInput(payload: Record<string, unknown>) {
  const route = payload.route;
  const product = payload.product;
  const shipment = payload.shipment;
  if (!route || typeof route !== 'object') return { response: fieldError('route', 'Route is required.') };
  if (!product || typeof product !== 'object') return { response: fieldError('product', 'Product is required.') };
  if (!shipment || typeof shipment !== 'object') return { response: fieldError('shipment', 'Shipment is required.') };

  const routeData = route as Record<string, unknown>;
  const productData = product as Record<string, unknown>;
  const shipmentData = shipment as Record<string, unknown>;
  if (typeof routeData.destinationCountry !== 'string' || !routeData.destinationCountry.trim()) return { response: fieldError('route.destinationCountry', 'Destination country is required.') };

  const hsCode = normalizeHsCode(typeof productData.hsCode === 'string' ? productData.hsCode : '');
  if (!/^\d{6,10}$/.test(hsCode)) return { response: fieldError('product.hsCode', 'HS code must contain 6–10 digits after normalization.') };

  const productValue = Number(productData.productValue);
  if (!Number.isFinite(productValue) || productValue <= 0) return { response: fieldError('product.productValue', 'Product value must be a number greater than zero.') };
  const quantity = Number(productData.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return { response: fieldError('product.quantity', 'Quantity must be a number greater than zero.') };

  for (const field of ['weightKg', 'numberOfPackages']) {
    const value = Number(shipmentData[field]);
    if (!Number.isFinite(value) || value <= 0) return { response: fieldError(`shipment.${field}`, `${field} must be a valid number greater than zero.`) };
  }

  return {
    data: { route: routeData, product: productData, shipment: shipmentData, hsCode, productValue, quantity } as InputData & { hsCode: string; productValue: number; quantity: number },
  };
}

function validateUserRules(raw: unknown, country: string, hsCode: string) {
  if (raw === undefined || raw === null) return { rules: [] as TaxRuleEntry[] };
  if (!Array.isArray(raw)) return { error: 'userTaxRules must be an array.' };
  if (raw.length === 0) return { rules: [] as TaxRuleEntry[] };
  if (raw.length > MAX_TAX_RULES) return { error: `You can provide at most ${MAX_TAX_RULES} tax rules.` };

  const seen = new Set<string>();
  const rules: TaxRuleEntry[] = [];
  for (const [index, item] of raw.entries()) {
    if (!item || typeof item !== 'object') return { error: `userTaxRules[${index}] must be an object.` };
    const entry = item as Record<string, unknown>;
    const name = typeof entry.name === 'string' ? entry.name.trim() : '';
    const taxType = typeof entry.taxType === 'string' ? entry.taxType.trim().toLowerCase() : '';
    const rate = normalizeRate(entry.rate);
    if (!name) return { error: `userTaxRules[${index}].name is required.` };
    if (!SUPPORTED_TAX_TYPES.includes(taxType as typeof SUPPORTED_TAX_TYPES[number])) return { error: `userTaxRules[${index}].taxType must be duty, tax, or fee.` };
    if (rate === null) return { error: `userTaxRules[${index}].rate must be between 0% and 100%.` };
    const duplicateKey = `${name.toLowerCase()}::${taxType}`;
    if (seen.has(duplicateKey)) return { error: `Duplicate tax rule: ${name} (${taxType}).` };
    seen.add(duplicateKey);
    rules.push({
      country,
      hsCode,
      name,
      taxType,
      rate,
      rule: typeof entry.description === 'string' ? entry.description.trim() : '',
      source: 'user',
      version: 'user-v1',
    });
  }
  return { rules };
}

function normalizeGeminiRules(raw: unknown, country: string, hsCode: string) {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  const version = typeof candidate.version === 'string' ? candidate.version.trim() : '';
  const items = Array.isArray(candidate.taxRules) ? candidate.taxRules : [];
  const rules: TaxRuleEntry[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const entryCountry = typeof entry.country === 'string' ? entry.country.trim() : '';
    const entryHsCode = normalizeHsCode(typeof entry.hsCode === 'string' ? entry.hsCode : '');
    const name = typeof entry.name === 'string' ? entry.name.trim() : '';
    const taxType = typeof entry.taxType === 'string' ? entry.taxType.trim().toLowerCase() : '';
    const rule = typeof entry.rule === 'string' ? entry.rule.trim() : '';
    const rate = normalizeRate(entry.rate);
    const duplicateKey = `${name.toLowerCase()}::${taxType}`;
    if (!version || !entryCountry || normalizeCountry(entryCountry) !== normalizeCountry(country) || entryHsCode !== hsCode || !name || !rule || !SUPPORTED_TAX_TYPES.includes(taxType as typeof SUPPORTED_TAX_TYPES[number]) || rate === null || seen.has(duplicateKey)) continue;
    seen.add(duplicateKey);
    rules.push({ country: entryCountry, hsCode, name, taxType, rate, rule, source: 'gemini', version });
  }
  return rules.length ? { version, rules } : null;
}

async function extractWithGemini(input: InputData, country: string, hsCode: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Tax extraction: missing Gemini key.');
    return null;
  }
  const prompt = `Extract the latest applicable import tax rules for this shipment. Return JSON only, with no markdown, matching this shape: {"version":"string","taxRules":[{"country":"exact destination country","hsCode":"normalized HS code","name":"tax name","taxType":"duty|tax|fee","rate":0.15,"rule":"short rule description"}]}\nShipment: ${JSON.stringify(input)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 800, responseMimeType: 'application/json' } }),
      cache: 'no-store',
      signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403) {
      console.error('Tax extraction: Gemini authentication failure.');
      return null;
    }
    if (!response.ok) {
      console.error('Tax extraction: Gemini request failed.', { status: response.status });
      return null;
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
      console.error('Tax extraction: invalid Gemini JSON response.');
      return null;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('Tax extraction: invalid Gemini JSON.');
      return null;
    }
    const result = normalizeGeminiRules(parsed, country, hsCode);
    if (!result) console.error('Tax extraction: rejected Gemini rules.');
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') console.error('Tax extraction: Gemini timeout.');
    else console.error('Tax extraction: Gemini request error.');
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function rulesFromRows(rows: Array<Record<string, unknown>>, source: 'database' | 'default') {
  return rows
    .map((row) => ({
      country: String(row.country || ''),
      hsCode: normalizeHsCode(String(row.hsCode || '')),
      name: String(row.rule || row.taxType || ''),
      taxType: String(row.taxType || '').toLowerCase(),
      rate: normalizeRate(row.rate),
      rule: String(row.description || row.rule || 'Stored tax rule'),
      source,
      version: String(row.version || 'unknown'),
      isEstimated: Boolean(row.isEstimated),
    }))
    .filter((rule) => Boolean(rule.country && /^\d{6,10}$/.test(rule.hsCode) && rule.name && SUPPORTED_TAX_TYPES.includes(rule.taxType as typeof SUPPORTED_TAX_TYPES[number]) && rule.rate !== null && rule.rate >= 0 && rule.rate <= 1))
    .map((rule) => ({ ...rule, rate: rule.rate as number } as TaxRuleEntry));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const validation = validateInput(payload);
    if ('response' in validation) return validation.response;
    const { route, product, shipment, hsCode, productValue, quantity } = validation.data;
    const country = String(route.destinationCountry).trim();
    const userRules = validateUserRules(payload.userTaxRules, country, hsCode);
    if (userRules.error) return fieldError('userTaxRules', userRules.error);

    if (userRules.rules?.length) {
      const result = calculateTaxBreakdownFromRules(productValue, quantity, userRules.rules, 'user', 'user-v1');
      return NextResponse.json({ ...result, taxSource: 'user', sourceLabel: 'User-provided rates', isEstimated: false, latestRatesExtracted: false, allowManualRates: true, warning: null });
    }

    const geminiResult = await extractWithGemini({ route, product, shipment }, country, hsCode);
    if (geminiResult) {
      try {
        upsertTaxRules(geminiResult.rules);
      } catch {
        console.error('Tax extraction: database update failure for Gemini rules.');
      }
      const result = calculateTaxBreakdownFromRules(productValue, quantity, geminiResult.rules, 'gemini', geminiResult.version);
      return NextResponse.json({ ...result, taxSource: 'gemini', sourceLabel: 'Latest rates extracted by Gemini', isEstimated: false, latestRatesExtracted: true, allowManualRates: true, warning: null });
    }

    let storedRules;
    try {
      storedRules = rulesFromRows(getStoredTaxRules(country, hsCode, 'active') as Array<Record<string, unknown>>, 'database');
    } catch {
      console.error('Tax calculation: database read failure.');
      storedRules = [];
    }
    if (storedRules.length) {
      const result = calculateTaxBreakdownFromRules(productValue, quantity, storedRules, 'database', storedRules[0].version);
      return NextResponse.json({ ...result, taxSource: 'database', sourceLabel: 'Previously stored matching rates', isEstimated: false, latestRatesExtracted: false, allowManualRates: true, warning: STORED_WARNING });
    }

    try {
      ensureDefaultTaxRules(country, hsCode);
      const defaultRules = rulesFromRows(getStoredTaxRules(country, hsCode, 'fallback') as Array<Record<string, unknown>>, 'default');
      if (defaultRules.length) {
        const result = calculateTaxBreakdownFromRules(productValue, quantity, defaultRules, 'default', defaultRules[0].version);
        return NextResponse.json({ ...result, taxSource: 'default', sourceLabel: 'Estimated database fallback', isEstimated: true, latestRatesExtracted: false, allowManualRates: true, warning: DEFAULT_WARNING });
      }
    } catch {
      console.error('Tax calculation: default fallback failure.');
    }

    console.error('Tax calculation: complete calculation failure.');
    return NextResponse.json({ error: 'No valid tax data is available for this route. Please enter rates manually and try again.', taxSource: 'unavailable', sourceLabel: 'Tax data unavailable', latestRatesExtracted: false, allowManualRates: true, warning: 'No valid tax data is available.' }, { status: 422 });
  } catch {
    console.error('Tax calculation: invalid request or unexpected calculation failure.');
    return NextResponse.json({ error: 'Tax calculation request failed. Please try again.', taxSource: 'unavailable' }, { status: 500 });
  }
}
