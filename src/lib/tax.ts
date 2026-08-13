import 'server-only';

import crypto from 'crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from './firebase-admin';

export type TaxRuleEntry = {
  name: string;
  rate: number;
  country: string;
  hsCode: string;
  taxType: string;
  rule: string;
  source: string;
  version: string;
  status?: string;
  isEstimated?: boolean;
  calculationBase?: 'product_value' | 'customs_value' | 'customs_value_plus_duty';
  fixedAmount?: number;
};

export type TaxCalculationResult = {
  source: 'user' | 'gemini' | 'database' | 'default' | 'unavailable';
  version: string;
  usedFallback: boolean;
  rules: TaxRuleEntry[];
  subtotal: number;
  freight: number;
  insurance: number;
  customsValue: number;
  taxes: Array<{ name: string; taxType: string; rate: number; amount: number; calculationBase: string; taxableAmount: number; fixedAmount: number }>;
  total: number;
};

export const SUPPORTED_TAX_TYPES = ['duty', 'tax', 'fee'] as const;
export const MAX_TAX_RULES = 20;
export const STORED_WARNING = 'The latest tax rates could not be extracted. This calculation uses previously stored rates. Please verify them before making financial decisions.';

export function normalizeCountry(country: string) {
  return country.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeHsCode(hsCode: string) {
  return hsCode.replace(/\D/g, '');
}

export function normalizeRate(rate: unknown): number | null {
  if (typeof rate !== 'number' && typeof rate !== 'string') return null;
  if (typeof rate === 'string' && !rate.trim()) return null;
  const text = typeof rate === 'string' ? rate.trim().replace(/%$/, '') : rate;
  const numeric = Number(text);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) return null;
  const normalized = numeric > 1 ? numeric / 100 : numeric;
  return normalized <= 1 ? normalized : null;
}

function lookupKey(country: string, hsCode: string) {
  return `${normalizeCountry(country)}::${normalizeHsCode(hsCode)}`;
}

function documentId(rule: TaxRuleEntry) {
  const identity = [lookupKey(rule.country, rule.hsCode), rule.taxType, rule.source, rule.version]
    .map((value) => value.trim().toLowerCase())
    .join('::');
  return crypto.createHash('sha256').update(identity).digest('hex');
}

function firestoreData(rule: TaxRuleEntry) {
  return {
    country: rule.country,
    countryKey: normalizeCountry(rule.country),
    lookupKey: lookupKey(rule.country, rule.hsCode),
    hsCode: normalizeHsCode(rule.hsCode),
    name: rule.name,
    taxType: rule.taxType,
    rate: rule.rate,
    description: rule.rule,
    source: rule.source,
    version: rule.version,
    status: rule.status || 'active',
    isEstimated: Boolean(rule.isEstimated),
    calculationBase: rule.calculationBase || 'product_value',
    fixedAmount: Number(rule.fixedAmount || 0),
  };
}

export async function ensureDefaultTaxRules(country: string, hsCode: string) {
  const firestore = getAdminFirestore();
  const defaults: TaxRuleEntry[] = [
    { country, hsCode, name: 'Estimated import duty', taxType: 'duty', rate: 0.15, rule: 'Estimated default import duty', source: 'system-estimate', version: 'estimated-v1', status: 'fallback', isEstimated: true, calculationBase: 'customs_value' },
    { country, hsCode, name: 'Estimated import tax', taxType: 'tax', rate: 0.10, rule: 'Estimated default import tax', source: 'system-estimate', version: 'estimated-v1', status: 'fallback', isEstimated: true, calculationBase: 'customs_value_plus_duty' },
  ];

  await firestore.runTransaction(async (transaction) => {
    const references = defaults.map((rule) => firestore.collection('taxRules').doc(documentId(rule)));
    const snapshots = await transaction.getAll(...references);
    snapshots.forEach((snapshot, index) => {
      if (!snapshot.exists) {
        transaction.create(snapshot.ref, {
          ...firestoreData(defaults[index]),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          effectiveFrom: FieldValue.serverTimestamp(),
        });
      }
    });
  });
}

export async function getStoredTaxRules(country: string, hsCode: string, status = 'active') {
  const firestore = getAdminFirestore();
  const snapshot = await firestore.collection('taxRules')
    .where('lookupKey', '==', lookupKey(country, hsCode))
    .get();

  return snapshot.docs
    .map((document) => document.data())
    .filter((rule) => rule.status === status)
    .map((rule) => ({
      country: String(rule.country || ''),
      hsCode: String(rule.hsCode || ''),
      taxType: String(rule.taxType || ''),
      rate: Number(rule.rate),
      rule: String(rule.name || ''),
      description: String(rule.description || ''),
      source: String(rule.source || ''),
      version: String(rule.version || ''),
      status: String(rule.status || ''),
      isEstimated: Boolean(rule.isEstimated),
      calculationBase: rule.calculationBase || (rule.source === 'system-estimate' ? (rule.taxType === 'duty' ? 'customs_value' : 'customs_value_plus_duty') : 'product_value'),
      fixedAmount: Number(rule.fixedAmount || 0),
      effectiveFrom: rule.effectiveFrom instanceof Timestamp ? rule.effectiveFrom.toDate().toISOString() : null,
    }));
}

export async function upsertTaxRules(rules: TaxRuleEntry[]) {
  if (!rules.length) return 0;

  const firestore = getAdminFirestore();
  const collection = firestore.collection('taxRules');
  const references = rules.map((rule) => collection.doc(documentId(rule)));
  const snapshots = await firestore.getAll(...references);
  const batch = firestore.batch();

  rules.forEach((rule, index) => {
    batch.set(references[index], {
      ...firestoreData(rule),
      ...(snapshots[index].exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      updatedAt: FieldValue.serverTimestamp(),
      effectiveFrom: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  await batch.commit();
  return rules.length;
}

export function calculateTaxBreakdownFromRules(
  productValue: number,
  quantity: number,
  rules: TaxRuleEntry[],
  source: 'user' | 'gemini' | 'database' | 'default',
  version: string,
  freightCost = 0,
  insuranceCost = 0,
): TaxCalculationResult {
  const declaredValue = Number(productValue || 0) * Number(quantity || 0);
  const normalizedRules = rules
    .map((rule) => ({ ...rule, rate: normalizeRate(rule.rate) }))
    .filter((rule): rule is TaxRuleEntry & { rate: number } => rule.rate !== null && rule.rate >= 0);

  if (!normalizedRules.length) {
    return { source: 'unavailable', version: version || 'none', usedFallback: true, rules: [], subtotal: declaredValue, freight: Number(freightCost || 0), insurance: Number(insuranceCost || 0), customsValue: declaredValue + Number(freightCost || 0) + Number(insuranceCost || 0), taxes: [], total: declaredValue };
  }

  const customsValue = declaredValue + Number(freightCost || 0) + Number(insuranceCost || 0);
  let accumulatedDuty = 0;
  const taxes = normalizedRules.map((rule) => {
    const calculationBase = rule.calculationBase || 'product_value';
    const taxableAmount = calculationBase === 'customs_value'
      ? customsValue
      : calculationBase === 'customs_value_plus_duty'
        ? customsValue + accumulatedDuty
        : declaredValue;
    const fixedAmount = Number(rule.fixedAmount || 0);
    const amount = Number((taxableAmount * rule.rate + fixedAmount).toFixed(2));
    if (rule.taxType === 'duty') accumulatedDuty += amount;
    return {
      name: rule.name,
      taxType: rule.taxType,
      rate: Number((rule.rate * 100).toFixed(4)),
      amount,
      calculationBase,
      taxableAmount: Number(taxableAmount.toFixed(2)),
      fixedAmount: Number(fixedAmount.toFixed(2)),
    };
  });
  const subtotal = Number(declaredValue.toFixed(2));
  const totalTax = taxes.reduce((sum, tax) => sum + tax.amount, 0);

  return {
    source,
    version,
    usedFallback: source === 'database' || source === 'default',
    rules: normalizedRules,
    subtotal,
    freight: Number(Number(freightCost || 0).toFixed(2)),
    insurance: Number(Number(insuranceCost || 0).toFixed(2)),
    customsValue: Number(customsValue.toFixed(2)),
    taxes,
    total: Number((customsValue + totalTax).toFixed(2)),
  };
}
