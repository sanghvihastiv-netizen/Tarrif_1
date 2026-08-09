import { db } from './database';

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
  calculationBase?: 'subtotal';
};

export type TaxCalculationResult = {
  source: 'user' | 'gemini' | 'database' | 'default' | 'unavailable';
  version: string;
  usedFallback: boolean;
  rules: TaxRuleEntry[];
  subtotal: number;
  taxes: Array<{ name: string; taxType: string; rate: number; amount: number; calculationBase: 'subtotal' }>;
  total: number;
};

export const SUPPORTED_TAX_TYPES = ['duty', 'tax', 'fee'] as const;
export const MAX_TAX_RULES = 20;
export const DEFAULT_WARNING = 'The latest tax rates could not be extracted. Estimated default rates were used. You can enter the latest rates manually and recalculate.';
export const STORED_WARNING = 'The latest tax rates could not be extracted. This calculation uses previously stored rates. Please verify them before making financial decisions.';

export function normalizeCountry(country: string) {
  return country.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeHsCode(hsCode: string) {
  return hsCode.replace(/\D/g, '');
}

export function normalizeRate(rate: unknown): number | null {
  if (typeof rate !== 'number' && typeof rate !== 'string') return null;
  const text = typeof rate === 'string' ? rate.trim().replace(/%$/, '') : rate;
  const numeric = Number(text);
  if (!Number.isFinite(numeric)) return null;
  if (numeric < 0 || numeric > 100) return null;
  const normalized = numeric > 1 ? numeric / 100 : numeric;
  return normalized <= 1 ? normalized : null;
}

export function ensureDefaultTaxRules(country: string, hsCode: string) {
  const normalizedCountry = normalizeCountry(country);
  const normalizedHsCode = normalizeHsCode(hsCode);
  const defaults: TaxRuleEntry[] = [
    { country, hsCode: normalizedHsCode, name: 'Estimated import duty', taxType: 'duty', rate: 0.15, rule: 'Estimated default import duty', source: 'system-estimate', version: 'estimated-v1', status: 'fallback', isEstimated: true },
    { country, hsCode: normalizedHsCode, name: 'Estimated import tax', taxType: 'tax', rate: 0.10, rule: 'Estimated default import tax', source: 'system-estimate', version: 'estimated-v1', status: 'fallback', isEstimated: true },
  ];
  const insert = db.prepare(`
    INSERT INTO tax_rules (country, normalized_country_key, hs_code, tax_type, rate, rule_name, description, source, version, status, is_estimated, effective_from)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  const transaction = db.transaction(() => {
    let created = 0;
    for (const rule of defaults) {
      const existing = db.prepare('SELECT id FROM tax_rules WHERE country = ? AND hs_code = ? AND tax_type = ? AND source = ? AND version = ?').get(rule.country, rule.hsCode, rule.taxType, rule.source, rule.version);
      if (!existing) {
        insert.run(rule.country, normalizedCountry, rule.hsCode, rule.taxType, rule.rate, rule.name, rule.rule, rule.source, rule.version, rule.status, 1);
        created += 1;
      }
    }
    return created;
  });
  transaction();
}

export function getStoredTaxRules(country?: string, hsCode?: string, status = 'active') {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (country) {
    clauses.push('normalized_country_key = ?');
    values.push(normalizeCountry(country));
  }

  if (hsCode) {
    clauses.push('hs_code = ?');
    values.push(normalizeHsCode(hsCode));
  }

  clauses.push('status = ?');
  values.push(status);

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const query = `SELECT country, hs_code AS hsCode, tax_type AS taxType, rate, rule_name AS rule, description, source, version, status, is_estimated AS isEstimated, effective_from AS effectiveFrom
    FROM tax_rules ${whereClause} ORDER BY updated_at DESC`;

  return db.prepare(query).all(...values) as Array<{
    country: string;
    hsCode: string;
    taxType: string;
    rate: number;
    rule: string | null;
    description: string | null;
    source: string;
    version: string;
    status: string;
    isEstimated: number;
    effectiveFrom: string;
  }>;
}

export function upsertTaxRules(rules: TaxRuleEntry[]) {
  if (!rules.length) return 0;

  const insert = db.prepare(`
    INSERT INTO tax_rules (country, normalized_country_key, hs_code, tax_type, rate, rule_name, description, source, version, status, is_estimated, effective_from)
    VALUES (@country, @normalizedCountryKey, @hsCode, @taxType, @rate, @rule, @description, @source, @version, @status, @isEstimated, datetime('now'))
    ON CONFLICT(country, hs_code, tax_type, source, version)
    DO UPDATE SET normalized_country_key = excluded.normalized_country_key, rate = excluded.rate, rule_name = excluded.rule_name, description = excluded.description, status = excluded.status, is_estimated = excluded.is_estimated, updated_at = CURRENT_TIMESTAMP
  `);

  const transaction = db.transaction(() => {
    let count = 0;
    for (const rule of rules) {
      insert.run({
        country: rule.country,
        normalizedCountryKey: normalizeCountry(rule.country),
        hsCode: rule.hsCode,
        taxType: rule.taxType,
        rate: rule.rate,
        rule: rule.rule,
        description: rule.rule,
        source: rule.source,
        version: rule.version,
        status: rule.status || 'active',
        isEstimated: rule.isEstimated ? 1 : 0,
      });
      count += 1;
    }
    return count;
  });

  return transaction();
}

export function calculateTaxBreakdownFromRules(
  productValue: number,
  quantity: number,
  rules: TaxRuleEntry[],
  source: 'user' | 'gemini' | 'database' | 'default',
  version: string,
): TaxCalculationResult {
  const declaredValue = Number(productValue || 0) * Number(quantity || 0);
  const normalizedRules = rules
    .map((rule) => ({
      ...rule,
      rate: normalizeRate(rule.rate),
    }))
    .filter((rule): rule is TaxRuleEntry & { rate: number } => rule.rate !== null && rule.rate >= 0);

  if (!normalizedRules.length) {
    return {
      source: 'unavailable',
      version: version || 'none',
      usedFallback: true,
      rules: [],
      subtotal: declaredValue,
      taxes: [],
      total: declaredValue,
    };
  }

  const taxes = normalizedRules.map((rule) => {
    const amount = declaredValue * rule.rate;
    return {
      name: rule.name,
      taxType: rule.taxType,
      rate: Number((rule.rate * 100).toFixed(4)),
      amount: Number(amount.toFixed(2)),
      calculationBase: 'subtotal' as const,
    };
  });

  const totalTax = taxes.reduce((sum, tax) => sum + tax.amount, 0);
  const subtotal = Number(declaredValue.toFixed(2));
  const total = Number((subtotal + totalTax).toFixed(2));

  return {
    source,
    version,
    usedFallback: source === 'database',
    rules: normalizedRules,
    subtotal,
    taxes,
    total,
  };
}
