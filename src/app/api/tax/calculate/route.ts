import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
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

export const runtime = 'nodejs';

const GEMINI_TIMEOUT_MS = 8_000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const DEFAULT_WARNING = "We couldn't extract the latest tax rates, and no matching verified rates were found. This result uses estimated default rates of 15% import duty and 10% import tax. You can enter the latest rates manually and recalculate.";
const PARTIAL_ESTIMATE_WARNING = 'Some current rates could not be verified. Missing customs duty or import-tax components were estimated using 15% duty and 10% import tax. Replace them with confirmed rates before relying on this result.';

type InputData = {
  route: Record<string, unknown>;
  product: Record<string, unknown>;
  shipment: Record<string, unknown>;
};

function fieldError(field: string, message: string) {
  return NextResponse.json({ error: message, field, errors: { [field]: message } }, { status: 400 });
}

async function isAuthenticated(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return false;
  try {
    await getAdminAuth().verifyIdToken(authorization.slice('Bearer '.length).trim());
    return true;
  } catch {
    return false;
  }
}

function normalizeTaxRuleClassification(name: string, taxType: string) {
  const normalizedName = name.trim();
  const normalizedType = taxType.trim().toLowerCase();
  const lowerName = normalizedName.toLowerCase();

  if (/(gst|vat|sales tax|value added tax)/.test(lowerName) || /(gst|vat|sales tax|value added tax)/.test(normalizedType)) {
    return { taxType: 'tax' as const, skip: false };
  }

  if (/(customs duty|import duty|duty|tariff)/.test(lowerName) && normalizedType === 'tax') {
    return { taxType: 'duty', skip: false };
  }

  if (normalizedType && SUPPORTED_TAX_TYPES.includes(normalizedType as typeof SUPPORTED_TAX_TYPES[number])) {
    return { taxType: normalizedType as typeof SUPPORTED_TAX_TYPES[number], skip: false };
  }

  return { taxType: null, skip: false };
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
  for (const field of ['freightCost', 'insuranceCost']) {
    const value = Number(shipmentData[field] ?? 0);
    if (!Number.isFinite(value) || value < 0) return { response: fieldError(`shipment.${field}`, `${field} must be zero or a positive number.`) };
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
    const normalizedClassification = normalizeTaxRuleClassification(name, taxType);
    if (normalizedClassification.skip) continue;
    const resolvedTaxType = normalizedClassification.taxType;
    const rate = normalizeRate(entry.rate);
    const calculationBase = typeof entry.calculationBase === 'string' ? entry.calculationBase : 'product_value';
    const fixedAmount = Number(entry.fixedAmount ?? 0);
    if (!name) return { error: `userTaxRules[${index}].name is required.` };
    if (!resolvedTaxType) return { error: `userTaxRules[${index}].taxType must be duty, tax, or fee.` };
    if (rate === null) return { error: `userTaxRules[${index}].rate must be between 0% and 100%.` };
    if (!['product_value', 'customs_value', 'customs_value_plus_duty'].includes(calculationBase)) return { error: `userTaxRules[${index}].calculationBase is invalid.` };
    if (!Number.isFinite(fixedAmount) || fixedAmount < 0) return { error: `userTaxRules[${index}].fixedAmount must be zero or greater.` };
    const duplicateKey = `${name.toLowerCase()}::${resolvedTaxType}`;
    if (seen.has(duplicateKey)) return { error: `Duplicate tax rule: ${name} (${resolvedTaxType}).` };
    seen.add(duplicateKey);
    rules.push({
      country,
      hsCode,
      name,
      taxType: resolvedTaxType,
      rate,
      rule: typeof entry.description === 'string' ? entry.description.trim() : '',
      source: 'user',
      version: 'user-v1',
      calculationBase: calculationBase as TaxRuleEntry['calculationBase'],
      fixedAmount,
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
    const normalizedClassification = normalizeTaxRuleClassification(name, taxType);
    if (normalizedClassification.skip) continue;
    const resolvedTaxType = normalizedClassification.taxType;
    const rule = typeof entry.rule === 'string' ? entry.rule.trim() : '';
    const rate = normalizeRate(entry.rate);
    const calculationBase = typeof entry.calculationBase === 'string' ? entry.calculationBase : 'product_value';
    const fixedAmount = Number(entry.fixedAmount ?? 0);
    const duplicateKey = `${name.toLowerCase()}::${resolvedTaxType ?? 'unknown'}`;
    const zeroRateIsExplained = rate !== 0 || /(duty[- ]?free|exempt|exemption|free trade|preferential|zero[- ]rated|0%)/i.test(rule);
    if (!version || !entryCountry || normalizeCountry(entryCountry) !== normalizeCountry(country) || entryHsCode !== hsCode || !name || !rule || !resolvedTaxType || !SUPPORTED_TAX_TYPES.includes(resolvedTaxType as typeof SUPPORTED_TAX_TYPES[number]) || rate === null || !zeroRateIsExplained || !['product_value', 'customs_value', 'customs_value_plus_duty'].includes(calculationBase) || !Number.isFinite(fixedAmount) || fixedAmount < 0 || seen.has(duplicateKey)) continue;
    seen.add(duplicateKey);
    rules.push({ country: entryCountry, hsCode, name, taxType: resolvedTaxType, rate, rule, source: 'gemini', version, calculationBase: calculationBase as TaxRuleEntry['calculationBase'], fixedAmount });
  }
  return rules.length ? { version, rules } : null;
}

async function extractWithGemini(input: InputData, country: string, hsCode: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Tax extraction: missing Gemini key.');
    return null;
  }
  const prompt = `Estimate the latest applicable import charges for this shipment using the destination country, origin country, product description and HS code. Return JSON only, with no markdown, matching this shape: {"version":"date or source version","taxRules":[{"country":"exact destination country","hsCode":"normalized HS code","name":"tax name","taxType":"duty|tax|fee","rate":0.15,"fixedAmount":0,"calculationBase":"product_value|customs_value|customs_value_plus_duty","rule":"short basis or eligibility explanation"}]}. Include customs duty and destination import VAT/GST/sales tax when applicable. Use customs_value for duty and customs_value_plus_duty for VAT/GST. Never return a 0% rate unless the rule explains the specific duty-free, exemption, preferential-origin, or zero-rated basis. Do not invent an exemption.\nShipment: ${JSON.stringify(input)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
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
    .map((row) => {
      const name = String(row.rule || row.taxType || '');
      const taxType = String(row.taxType || '').toLowerCase();
      const classification = normalizeTaxRuleClassification(name, taxType);
      if (classification.skip || !classification.taxType) return null;

      return {
        country: String(row.country || ''),
        hsCode: normalizeHsCode(String(row.hsCode || '')),
        name,
        taxType: classification.taxType,
        rate: normalizeRate(row.rate),
        rule: String(row.description || row.rule || 'Stored tax rule'),
        source,
        version: String(row.version || 'unknown'),
        isEstimated: Boolean(row.isEstimated),
        calculationBase: typeof row.calculationBase === 'string' ? row.calculationBase : 'product_value',
        fixedAmount: Number(row.fixedAmount || 0),
      } as TaxRuleEntry | null;
    })
    .filter((rule): rule is TaxRuleEntry => Boolean(rule && rule.country && /^\d{6,10}$/.test(rule.hsCode) && rule.name && SUPPORTED_TAX_TYPES.includes(rule.taxType as typeof SUPPORTED_TAX_TYPES[number]) && rule.rate !== null && rule.rate >= 0 && rule.rate <= 1))
    .map((rule) => ({ ...rule, rate: rule.rate as number }));
}

function completeSimulationRules(rules: TaxRuleEntry[], country: string, hsCode: string) {
  const completed = [...rules];
  let usedEstimate = false;
  if (!completed.some((rule) => rule.taxType === 'duty')) {
    completed.unshift({ country, hsCode, name: 'Estimated customs duty', taxType: 'duty', rate: 0.15, rule: 'Simulation estimate because a current duty rate could not be verified', source: 'system-estimate', version: 'estimated-v1', isEstimated: true, calculationBase: 'customs_value' });
    usedEstimate = true;
  }
  if (!completed.some((rule) => rule.taxType === 'tax')) {
    completed.push({ country, hsCode, name: 'Estimated import tax', taxType: 'tax', rate: 0.10, rule: 'Simulation estimate because a current import-tax rate could not be verified', source: 'system-estimate', version: 'estimated-v1', isEstimated: true, calculationBase: 'customs_value_plus_duty' });
    usedEstimate = true;
  }
  return { rules: completed, usedEstimate };
}

export async function POST(request: Request) {
  try {
    if (!await isAuthenticated(request)) {
      return NextResponse.json({ error: 'Please sign in before calculating taxes.' }, { status: 401 });
    }

    const body = await request.json();
    const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const validation = validateInput(payload);
    if ('response' in validation) return validation.response;
    const { route, product, shipment, hsCode, productValue, quantity } = validation.data;
    const country = String(route.destinationCountry).trim();
    const userRules = validateUserRules(payload.userTaxRules, country, hsCode);
    if (userRules.error) return fieldError('userTaxRules', userRules.error);

    if (userRules.rules?.length) {
      const result = calculateTaxBreakdownFromRules(productValue, quantity, userRules.rules, 'user', 'user-v1', Number(shipment.freightCost || 0), Number(shipment.insuranceCost || 0));
      return NextResponse.json({ ...result, taxSource: 'user', sourceLabel: 'Calculation based on rates entered by the user', isEstimated: false, latestRatesExtracted: false, allowManualRates: true, warning: null });
    }

    const geminiResult = await extractWithGemini({ route, product, shipment }, country, hsCode);
    if (geminiResult) {
      try {
        await upsertTaxRules(geminiResult.rules);
      } catch {
        console.error('Tax extraction: database update failure for Gemini rules.');
      }
      const completed = completeSimulationRules(geminiResult.rules, country, hsCode);
      const result = calculateTaxBreakdownFromRules(productValue, quantity, completed.rules, completed.usedEstimate ? 'default' : 'gemini', geminiResult.version, Number(shipment.freightCost || 0), Number(shipment.insuranceCost || 0));
      return NextResponse.json({ ...result, taxSource: completed.usedEstimate ? 'default' : 'gemini', sourceLabel: completed.usedEstimate ? 'Automatically retrieved rates with estimated missing components' : 'Calculation based on automatically retrieved current rates', isEstimated: completed.usedEstimate, latestRatesExtracted: true, allowManualRates: true, warning: completed.usedEstimate ? PARTIAL_ESTIMATE_WARNING : null });
    }

    let storedRules: TaxRuleEntry[];
    try {
      storedRules = rulesFromRows(await getStoredTaxRules(country, hsCode, 'active') as Array<Record<string, unknown>>, 'database');
    } catch {
      console.error('Tax calculation: database read failure.');
      storedRules = [];
    }
    if (storedRules.length) {
      const completed = completeSimulationRules(storedRules, country, hsCode);
      const result = calculateTaxBreakdownFromRules(productValue, quantity, completed.rules, completed.usedEstimate ? 'default' : 'database', storedRules[0].version, Number(shipment.freightCost || 0), Number(shipment.insuranceCost || 0));
      return NextResponse.json({ ...result, taxSource: completed.usedEstimate ? 'default' : 'database', sourceLabel: completed.usedEstimate ? 'Stored rates with estimated missing components' : 'Previously stored matching rates', isEstimated: completed.usedEstimate, latestRatesExtracted: false, allowManualRates: true, warning: completed.usedEstimate ? PARTIAL_ESTIMATE_WARNING : STORED_WARNING });
    }

    try {
      await ensureDefaultTaxRules(country, hsCode);
      const defaultRules = rulesFromRows(await getStoredTaxRules(country, hsCode, 'fallback') as Array<Record<string, unknown>>, 'default');
      if (defaultRules.length) {
        const result = calculateTaxBreakdownFromRules(productValue, quantity, defaultRules, 'default', defaultRules[0].version, Number(shipment.freightCost || 0), Number(shipment.insuranceCost || 0));
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
