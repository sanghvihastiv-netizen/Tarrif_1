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
};

export type TaxCalculationResult = {
  source: 'gemini' | 'database' | 'unavailable';
  version: string;
  usedFallback: boolean;
  rules: TaxRuleEntry[];
  subtotal: number;
  taxes: Array<{ name: string; rate: number; amount: number }>; 
  total: number;
};

export function normalizeRate(rate: unknown): number | null {
  if (typeof rate !== 'number' && typeof rate !== 'string') return null;
  const numeric = Number(rate);
  if (!Number.isFinite(numeric)) return null;
  if (numeric < 0) return null;
  return numeric > 1 ? numeric / 100 : numeric;
}

export function getStoredTaxRules(country?: string, hsCode?: string) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (country) {
    clauses.push('country = ?');
    values.push(country);
  }

  if (hsCode) {
    clauses.push('hs_code = ?');
    values.push(hsCode);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const query = `SELECT country, hs_code AS hsCode, tax_type AS taxType, rate, rule_name AS rule, source, version, effective_from AS effectiveFrom
    FROM tax_rules ${whereClause} ORDER BY created_at DESC`;

  return db.prepare(query).all(...values) as Array<{
    country: string;
    hsCode: string;
    taxType: string;
    rate: number;
    rule: string | null;
    source: string;
    version: string;
    effectiveFrom: string;
  }>;
}

export function upsertTaxRules(rules: TaxRuleEntry[]) {
  if (!rules.length) return 0;

  const insert = db.prepare(`
    INSERT INTO tax_rules (country, hs_code, tax_type, rate, rule_name, source, version, effective_from)
    VALUES (@country, @hsCode, @taxType, @rate, @rule, @source, @version, datetime('now'))
    ON CONFLICT(country, hs_code, tax_type, source, version)
    DO UPDATE SET rate = excluded.rate, rule_name = excluded.rule_name, updated_at = CURRENT_TIMESTAMP
  `);

  const transaction = db.transaction(() => {
    let count = 0;
    for (const rule of rules) {
      insert.run({
        country: rule.country,
        hsCode: rule.hsCode,
        taxType: rule.taxType,
        rate: rule.rate,
        rule: rule.rule,
        source: rule.source,
        version: rule.version,
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
  source: 'gemini' | 'database',
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
      rate: Number((rule.rate * 100).toFixed(4)),
      amount: Number(amount.toFixed(2)),
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
