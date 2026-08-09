'use client';


import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  AlertTriangle,
  Calculator,
  CheckCircle,
  Clock,
  Copy,
  Download,
  Eye,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Trash2,
  User,
} from 'lucide-react';


type ShippingMode = 'Sea' | 'Air' | 'Road';
type View = 'dashboard' | 'calculator' | 'saved' | 'result';


interface RouteInfo {
  originCountry: string;
  originPort: string;
  destinationCountry: string;
  destinationPort: string;
  shippingDate: string;
}


interface ProductInfo {
  productName: string;
  hsCode: string;
  countryOfOrigin: string;
  quantity: number;
  productValue: number;
}


interface ShipmentInfo {
  shippingMode: ShippingMode;
  weightKg: number;
  numberOfPackages: number;
  containerType: string;
}

type ManualTaxRule = {
  name: string;
  taxType: 'duty' | 'tax' | 'fee';
  rate: string;
  description: string;
};


interface CostBreakdown {
  freight: number;
  insurance: number;
  importDuty: number;
  taxes: number;
  portCharges: number;
  total: number;
}


interface Calculation {
  id: string;
  createdAt: string;
  route: RouteInfo;
  product: ProductInfo;
  shipment: ShipmentInfo;
  costs: CostBreakdown;
  estimatedTransitTime: string;
  taxSource?: string;
  taxVersion?: string;
  ruleSourceLabel?: string;
  isEstimated?: boolean;
  warning?: string | null;
  taxBreakdown?: {
    subtotal?: number;
    total?: number;
    taxes?: Array<{ name: string; taxType?: string; rate: number; amount: number; calculationBase?: string }>;
    source?: string;
    version?: string;
    rules?: Array<{ name: string; rate: number; country: string; hsCode: string; rule?: string }>;
  };
}


const STORAGE_KEY = 'shipping-cost-calculations';
const COUNTRIES = [
  'United States', 'Canada', 'China', 'India', 'Germany', 'United Kingdom',
  'France', 'Japan', 'Mexico', 'Brazil', 'Australia', 'Singapore',
  'Hong Kong', 'Netherlands', 'South Korea',
];
const PORTS: Record<string, string[]> = {
  'United States': ['Los Angeles', 'New York', 'Houston', 'Seattle', 'Miami'],
  Canada: ['Vancouver', 'Montreal'],
  China: ['Shanghai', 'Shenzhen', 'Ningbo', 'Qingdao'],
  India: ['Mumbai', 'Chennai', 'Nhava Sheva', 'Kolkata'],
  Germany: ['Hamburg', 'Bremerhaven'],
  'United Kingdom': ['Felixstowe', 'Southampton', 'London Gateway'],
  France: ['Le Havre', 'Marseille'],
  Japan: ['Yokohama', 'Tokyo', 'Osaka'],
  Mexico: ['Manzanillo', 'Veracruz'],
  Brazil: ['Santos', 'Rio de Janeiro'],
  Australia: ['Sydney', 'Melbourne'],
  Singapore: ['Singapore'],
  'Hong Kong': ['Hong Kong'],
  Netherlands: ['Rotterdam'],
  'South Korea': ['Busan', 'Incheon'],
};
const CONTAINER_TYPES = ['20ft Container', '40ft Container', '40ft High Cube', 'Loose Cargo'];
const emptyRoute: RouteInfo = {
  originCountry: '', originPort: '', destinationCountry: '', destinationPort: '', shippingDate: '',
};
const emptyProduct: ProductInfo = {
  productName: '', hsCode: '', countryOfOrigin: '', quantity: 1, productValue: 0,
};
const emptyShipment: ShipmentInfo = {
  shippingMode: 'Sea', weightKg: 0, numberOfPackages: 1, containerType: CONTAINER_TYPES[0],
};
const inputClass =
  'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/60 disabled:opacity-40';


export default function CostsPage() {
  const [view, setView] = useState<View>('dashboard');
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [selected, setSelected] = useState<Calculation | null>(null);
  const [calculatorDraft, setCalculatorDraft] = useState({ route: emptyRoute, product: emptyProduct, shipment: emptyShipment });
  const [reopenManualRates, setReopenManualRates] = useState(false);
  const { user, signOut } = useAuth();


  useEffect(() => {
    const timer = window.setTimeout(() => setCalculations(readCalculations()), 0);
    return () => window.clearTimeout(timer);
  }, []);


  function refresh() {
    setCalculations(readCalculations());
  }


  function navigate(next: View, calculation?: Calculation) {
    setSelected(calculation ?? null);
    setView(next);
  }


  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }


  return (
    <main className="min-h-screen bg-[#05080d] text-white">
      <header className="border-b border-white/10 bg-[#05080d]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-8">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Tariff<span className="text-amber-400">Wars</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavButton active={view === 'dashboard'} onClick={() => navigate('dashboard')} icon={<LayoutDashboard size={15} />}>Dashboard</NavButton>
            <NavButton active={view === 'saved'} onClick={() => navigate('saved')} icon={<Clock size={15} />}>Saved</NavButton>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/profile" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10">
                  <User size={15} className="text-amber-400" />
                  Profile
                </Link>
                <button onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20">
                  <LogOut size={15} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-slate-300 transition hover:text-white">Login</Link>
                <Link href="/signup" className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-black transition hover:bg-amber-400">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>


      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        {view === 'dashboard' && (
          <Dashboard
            calculations={calculations}
            onNew={() => navigate('calculator')}
            onView={(calculation) => navigate('result', calculation)}
            onChange={refresh}
          />
        )}
        {view === 'calculator' && (
          <CalculatorView
            onCancel={() => navigate('dashboard')}
            initialDraft={calculatorDraft}
            reopenManualRates={reopenManualRates}
            onDraftChange={setCalculatorDraft}
            onComplete={(calculation) => {
              setReopenManualRates(false);
              refresh();
              navigate('result', calculation);
            }}
          />
        )}
        {view === 'saved' && (
          <Saved calculations={calculations} onView={(calculation) => navigate('result', calculation)} />
        )}
        {view === 'result' && selected && (
          <Result calculation={selected} onBack={() => navigate('dashboard')} onEnterManualRates={() => {
            setReopenManualRates(true);
            navigate('calculator');
          }} />
        )}
      </div>
    </main>
  );
}


function Dashboard({
  calculations,
  onNew,
  onView,
  onChange,
}: {
  calculations: Calculation[];
  onNew: () => void;
  onView: (calculation: Calculation) => void;
  onChange: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return calculations.filter((calculation) =>
      !term || [
        calculation.route.originCountry,
        calculation.route.destinationCountry,
        calculation.product.productName,
      ].join(' ').toLowerCase().includes(term),
    );
  }, [calculations, query]);
  const total = calculations.reduce((sum, calculation) => sum + calculation.costs.total, 0);


  function remove(id: string) {
    writeCalculations(readCalculations().filter((calculation) => calculation.id !== id));
    onChange();
  }


  function duplicate(calculation: Calculation) {
    const copy = { ...calculation, id: crypto.randomUUID(), createdAt: today() };
    writeCalculations([copy, ...readCalculations()]);
    onChange();
  }


  return (
    <>
      <PageHeading title="Cost dashboard" subtitle="Manage your shipping calculations">
        <PrimaryButton onClick={onNew}><Plus size={16} /> New calculation</PrimaryButton>
      </PageHeading>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Total calculations" value={calculations.length.toString()} />
        <Stat label="Average cost" value={money(calculations.length ? total / calculations.length : 0)} />
        <Stat label="Total shipments" value={money(total)} />
      </div>
      <Panel>
        <h2 className="mb-4 text-lg font-semibold">Recent calculations</h2>
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
          <Search size={16} className="text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search calculations..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
        </div>
        {filtered.length === 0 ? (
          <Empty>{query ? 'No calculations match your search.' : 'No calculations yet. Start a new one to see it here.'}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 text-slate-500"><tr><th className="pb-3 font-medium">From</th><th className="pb-3 font-medium">To</th><th className="pb-3 font-medium">Product</th><th className="pb-3 font-medium">Cost</th><th className="pb-3 font-medium">Date</th><th className="pb-3 text-right font-medium">Actions</th></tr></thead>
              <tbody>{filtered.map((calculation) => (
                <tr key={calculation.id} className="border-b border-white/5">
                  <td className="py-4">{calculation.route.originPort}, {calculation.route.originCountry}</td>
                  <td className="py-4">{calculation.route.destinationPort}, {calculation.route.destinationCountry}</td>
                  <td className="py-4">{calculation.product.productName}</td>
                  <td className="py-4 font-semibold">{money(calculation.costs.total)}</td>
                  <td className="py-4 text-slate-500">{calculation.createdAt}</td>
                  <td className="py-4"><div className="flex justify-end gap-3">
                    <button title="View" onClick={() => onView(calculation)}><Eye size={16} /></button>
                    <button title="Duplicate" onClick={() => duplicate(calculation)}><Copy size={16} /></button>
                    <button title="Delete" onClick={() => remove(calculation.id)} className="text-red-400"><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}


function CalculatorView({ onCancel, onComplete, initialDraft, onDraftChange, reopenManualRates }: { onCancel: () => void; onComplete: (calculation: Calculation) => void; initialDraft: { route: RouteInfo; product: ProductInfo; shipment: ShipmentInfo }; onDraftChange: (draft: { route: RouteInfo; product: ProductInfo; shipment: ShipmentInfo }) => void; reopenManualRates: boolean }) {
  const [step, setStep] = useState(1);
  const [route, setRoute] = useState<RouteInfo>(initialDraft.route);
  const [product, setProduct] = useState<ProductInfo>(initialDraft.product);
  const [shipment, setShipment] = useState<ShipmentInfo>(initialDraft.shipment);
  const [manualRates, setManualRates] = useState<ManualTaxRule[]>([]);
  const [manualRatesOpen, setManualRatesOpen] = useState(reopenManualRates);
  const [submitting, setSubmitting] = useState(false);
  const [taxError, setTaxError] = useState<string | null>(null);
  const labels = ['Route', 'Product', 'Shipment', 'Review'];

  useEffect(() => {
    onDraftChange({ route, product, shipment });
  }, [onDraftChange, product, route, shipment]);


  async function calculate() {
    setSubmitting(true);
    setTaxError(null);

    try {
      const userTaxRules = manualRatesOpen ? manualRates.map((rule) => ({
        name: rule.name,
        taxType: rule.taxType,
        rate: Number(rule.rate) / 100,
        description: rule.description,
      })) : [];
      const response = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route, product, shipment, userTaxRules }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Tax extraction failed.');
      }

      const taxBreakdown = {
        subtotal: Number(payload.subtotal || 0),
        total: Number(payload.total || 0),
        taxes: Array.isArray(payload.taxes) ? payload.taxes : [],
        source: payload.taxSource || 'database',
        version: payload.version || 'unknown',
        rules: Array.isArray(payload.rules) ? payload.rules : [],
      };

      const calculation: Calculation = {
        id: crypto.randomUUID(),
        createdAt: today(),
        route,
        product,
        shipment,
        costs: {
          freight: Number(payload.freight || 0),
          insurance: Number(payload.insurance || 0),
          importDuty: Number(payload.importDuty || 0),
          taxes: Number(payload.taxes?.reduce?.((sum: number, tax: { amount: number }) => sum + Number(tax.amount || 0), 0) || 0),
          portCharges: Number(payload.portCharges || 0),
          total: Number(payload.total || 0),
        },
        estimatedTransitTime: { Sea: '15-30 days', Air: '2-5 days', Road: '5-10 days' }[shipment.shippingMode],
      };

      const finalCalculation = {
        ...calculation,
        taxSource: payload.taxSource || 'database',
        taxVersion: payload.version || 'unknown',
        ruleSourceLabel: payload.sourceLabel || 'Stored tax table fallback',
        isEstimated: Boolean(payload.isEstimated),
        warning: typeof payload.warning === 'string' ? payload.warning : null,
        taxBreakdown,
      };

      onComplete(finalCalculation as Calculation & {
        taxSource: string;
        taxVersion: string;
        ruleSourceLabel: string;
        taxBreakdown: typeof taxBreakdown;
      });
    } catch (error) {
      console.error('Error calculating shipment tax:', error);
      setTaxError(error instanceof Error ? error.message : 'Tax calculation failed.');
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <>
      <PageHeading title="New cost calculation" subtitle="Build a landed-cost estimate in four steps" />
      <div className="mb-6 grid grid-cols-4 gap-2">
        {labels.map((label, index) => <div key={label} className={`rounded-lg border px-3 py-2 text-center text-xs ${step === index + 1 ? 'border-amber-400 bg-amber-400/10 text-amber-300' : step > index + 1 ? 'border-emerald-400/30 text-emerald-300' : 'border-white/10 text-slate-500'}`}>{index + 1}. {label}</div>)}
      </div>
      <Panel>
        {step === 1 && <RouteStep route={route} setRoute={setRoute} />}
        {step === 2 && <ProductStep product={product} setProduct={setProduct} />}
        {step === 3 && <ShipmentStep shipment={shipment} setShipment={setShipment} />}
        {step === 4 && <>
          <Review route={route} product={product} shipment={shipment} />
          <ManualRatesSection open={manualRatesOpen} rules={manualRates} onToggle={() => setManualRatesOpen((open) => !open)} onChange={setManualRates} />
        </>}
        {taxError && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertTriangle size={16} className="mt-0.5" />
            <span>{taxError}</span>
          </div>
        )}
        <div className="mt-8 flex justify-between border-t border-white/10 pt-6">
          <button onClick={step === 1 ? onCancel : () => setStep(step - 1)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">{step === 1 ? 'Cancel' : 'Previous'}</button>
          {step < 4 ? <PrimaryButton disabled={!canContinue(step, route, product, shipment)} onClick={() => setStep(step + 1)}>Next</PrimaryButton> : <PrimaryButton onClick={calculate} disabled={submitting}>{submitting ? 'Calculating...' : <><Calculator size={16} /> Calculate cost</>}</PrimaryButton>}
        </div>
      </Panel>
    </>
  );
}

function ManualRatesSection({ open, rules, onToggle, onChange }: { open: boolean; rules: ManualTaxRule[]; onToggle: () => void; onChange: (rules: ManualTaxRule[]) => void }) {
  function update(index: number, patch: Partial<ManualTaxRule>) {
    onChange(rules.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, ...patch } : rule));
  }

  return <div className="mt-8 border-t border-white/10 pt-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-lg font-semibold">Do you know the latest applicable tax rates?</h2><p className="mt-1 text-sm text-slate-500">Enter 15 for 15%. Rates are converted to decimals before calculation: 15 → 0.15, 10 → 0.10, 7.5 → 0.075.</p></div>
      <button type="button" onClick={onToggle} className="rounded-lg border border-amber-400/50 px-4 py-2 text-sm text-amber-300 hover:bg-amber-400/10">{open ? 'Use automatic rates' : 'Enter rates manually'}</button>
    </div>
    {open && <div className="mt-5 space-y-4">
      {rules.map((rule, index) => <div key={index} className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:grid-cols-[1.4fr_1fr_0.8fr_1.5fr_auto] sm:items-end">
        <Field label="Tax name"><input value={rule.name} onChange={(event) => update(index, { name: event.target.value })} placeholder="Import duty" className={inputClass} /></Field>
        <Field label="Tax type"><select value={rule.taxType} onChange={(event) => update(index, { taxType: event.target.value as ManualTaxRule['taxType'] })} className={inputClass}><option value="duty">Duty</option><option value="tax">Tax</option><option value="fee">Fee</option></select></Field>
        <Field label="Rate (%)"><input type="number" min="0" max="100" step="0.01" value={rule.rate} onChange={(event) => update(index, { rate: event.target.value })} placeholder="15" className={inputClass} /></Field>
        <Field label="Description (optional)"><input value={rule.description} onChange={(event) => update(index, { description: event.target.value })} placeholder="Short rule description" className={inputClass} /></Field>
        <button type="button" title="Remove tax rule" onClick={() => onChange(rules.filter((_, ruleIndex) => ruleIndex !== index))} className="p-2 text-red-300 hover:text-red-200"><Trash2 size={16} /></button>
      </div>)}
      <button type="button" onClick={() => onChange([...rules, { name: '', taxType: 'tax', rate: '', description: '' }])} className="inline-flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"><Plus size={15} /> Add tax rule</button>
      {rules.length === 0 && <p className="text-sm text-slate-500">Add at least one rule to calculate from your rates.</p>}
    </div>}
  </div>;
}


function RouteStep({ route, setRoute }: { route: RouteInfo; setRoute: (route: RouteInfo) => void }) {
  return <FormSection title="Shipment route"><div className="grid gap-5 sm:grid-cols-2">
    <SelectField label="Origin country" value={route.originCountry} onChange={(value) => setRoute({ ...route, originCountry: value, originPort: '' })} options={COUNTRIES} placeholder="Select country" />
    <SelectField label="Origin port/city" value={route.originPort} onChange={(value) => setRoute({ ...route, originPort: value })} options={PORTS[route.originCountry] || []} placeholder="Select port" disabled={!route.originCountry} />
    <SelectField label="Destination country" value={route.destinationCountry} onChange={(value) => setRoute({ ...route, destinationCountry: value, destinationPort: '' })} options={COUNTRIES} placeholder="Select country" />
    <SelectField label="Destination port/city" value={route.destinationPort} onChange={(value) => setRoute({ ...route, destinationPort: value })} options={PORTS[route.destinationCountry] || []} placeholder="Select port" disabled={!route.destinationCountry} />
    <Field label="Shipping date"><input type="date" value={route.shippingDate} onChange={(event) => setRoute({ ...route, shippingDate: event.target.value })} className={inputClass} /></Field>
  </div></FormSection>;
}


function ProductStep({ product, setProduct }: { product: ProductInfo; setProduct: (product: ProductInfo) => void }) {
  return <FormSection title="Product details"><div className="grid gap-5 sm:grid-cols-2">
    <div className="sm:col-span-2"><Field label="Product name"><input value={product.productName} onChange={(event) => setProduct({ ...product, productName: event.target.value })} placeholder="e.g. Textiles" className={inputClass} /></Field></div>
    <Field label="HS code"><input value={product.hsCode} onChange={(event) => setProduct({ ...product, hsCode: event.target.value })} placeholder="e.g. 8471.30" className={inputClass} /></Field>
    <SelectField label="Country of origin" value={product.countryOfOrigin} onChange={(value) => setProduct({ ...product, countryOfOrigin: value })} options={COUNTRIES} placeholder="Select country" />
    <Field label="Quantity"><input type="number" min="1" value={product.quantity} onChange={(event) => setProduct({ ...product, quantity: Number(event.target.value) })} className={inputClass} /></Field>
    <Field label="Product value (USD)"><input type="number" min="0" value={product.productValue} onChange={(event) => setProduct({ ...product, productValue: Number(event.target.value) })} className={inputClass} /></Field>
  </div></FormSection>;
}


function ShipmentStep({ shipment, setShipment }: { shipment: ShipmentInfo; setShipment: (shipment: ShipmentInfo) => void }) {
  return <FormSection title="Shipment details">
    <Field label="Shipping mode"><div className="mb-5 grid grid-cols-3 gap-3">{(['Sea', 'Air', 'Road'] as ShippingMode[]).map((mode) => <button key={mode} onClick={() => setShipment({ ...shipment, shippingMode: mode })} className={`rounded-lg border py-2.5 text-sm ${shipment.shippingMode === mode ? 'border-amber-400 bg-amber-400 text-black' : 'border-white/10 text-slate-400'}`}>{mode}</button>)}</div></Field>
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Weight (kg)"><input type="number" min="0" value={shipment.weightKg} onChange={(event) => setShipment({ ...shipment, weightKg: Number(event.target.value) })} className={inputClass} /></Field>
      <Field label="Number of packages"><input type="number" min="1" value={shipment.numberOfPackages} onChange={(event) => setShipment({ ...shipment, numberOfPackages: Number(event.target.value) })} className={inputClass} /></Field>
      <div className="sm:col-span-2"><SelectField label="Container type" value={shipment.containerType} onChange={(value) => setShipment({ ...shipment, containerType: value })} options={CONTAINER_TYPES} /></div>
    </div>
  </FormSection>;
}


function Review({ route, product, shipment }: { route: RouteInfo; product: ProductInfo; shipment: ShipmentInfo }) {
  return <FormSection title="Review your shipment"><div className="grid gap-4 sm:grid-cols-2">
    <ReviewCard label="Route">{route.originPort}, {route.originCountry}<br /><span className="text-slate-500">to</span><br />{route.destinationPort}, {route.destinationCountry}</ReviewCard>
    <ReviewCard label="Shipping date">{route.shippingDate}</ReviewCard>
    <ReviewCard label="Product">{product.productName}<p className="text-sm text-slate-500">HS code: {product.hsCode}</p></ReviewCard>
    <ReviewCard label="Shipment">{shipment.shippingMode}<p className="text-sm text-slate-500">{shipment.weightKg}kg, {shipment.numberOfPackages} packages</p></ReviewCard>
  </div></FormSection>;
}


function Result({ calculation, onBack, onEnterManualRates }: { calculation: Calculation; onBack: () => void; onEnterManualRates: () => void }) {
  const { route, product, shipment, costs } = calculation;
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  async function saveCalculation() {
    setSaving(true);
    setSaveState('idle');
    setMessage('');

    try {
      const body = {
        userId: user?.id ?? null,
        input: { route, product, shipment },
        taxBreakdown: calculation.taxBreakdown || {
          subtotal: costs.total,
          total: costs.total,
          taxes: [{ name: 'Taxes', rate: 0, amount: costs.taxes }],
        },
        subtotal: calculation.taxBreakdown?.subtotal ?? costs.total,
        totalAmount: calculation.taxBreakdown?.total ?? costs.total,
        taxRuleVersion: calculation.taxVersion || 'unknown',
        taxSource: calculation.taxSource || 'database',
        warning: calculation.warning || null,
        isEstimated: Boolean(calculation.isEstimated),
      };

      const response = await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Unable to save calculation.');

      setSaveState('success');
      setMessage(payload.duplicate ? 'This calculation was already saved.' : 'Calculation saved successfully.');
    } catch (error) {
      console.error('Failed to save calculation:', error);
      setSaveState('error');
      setMessage(error instanceof Error ? error.message : 'Failed to save calculation.');
    } finally {
      setSaving(false);
    }
  }

  return <>
    <button onClick={onBack} className="mb-6 text-sm text-slate-400 hover:text-white">← Back to dashboard</button>
    <PageHeading title="Shipping cost estimate" subtitle={`Calculated on ${calculation.createdAt}`}>
      <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm"><Download size={16} /> Export as PDF</button>
    </PageHeading>

    <div className="mb-6 rounded-2xl bg-amber-400 p-6 text-black">
      <p className="text-sm">Total estimated cost</p>
      <p className="mt-1 text-4xl font-bold">{money(costs.total)}</p>
    </div>

    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">
        <CheckCircle size={14} />
        {calculation.taxSource === 'gemini' ? 'Used Gemini extraction' : calculation.taxSource === 'database' ? 'Used saved tax table' : 'Tax source unavailable'}
      </div>
      <span className="text-slate-400">Version: {calculation.taxVersion || 'unknown'}</span>
      <span className="text-slate-400">{calculation.ruleSourceLabel || 'Tax source'}</span>
    </div>
    {calculation.warning && <div className={`mb-6 flex flex-col gap-3 rounded-xl border p-4 text-sm ${calculation.isEstimated ? 'border-amber-400/60 bg-amber-400/10 text-amber-100' : 'border-yellow-400/40 bg-yellow-400/10 text-yellow-100'}`}>
      <div className="flex items-start gap-3"><AlertTriangle size={18} className="mt-0.5 shrink-0" /><p>{calculation.warning}</p></div>
      {calculation.isEstimated && <button type="button" onClick={onEnterManualRates} className="self-start rounded-lg border border-amber-300/60 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-amber-300/10">Enter rates and recalculate</button>}
    </div>}

    <div className="mb-6 grid gap-4 sm:grid-cols-2">
      <Panel><h2 className="mb-4 font-semibold">Shipping route</h2><Info label="From" value={`${route.originPort}, ${route.originCountry}`} /><Info label="To" value={`${route.destinationPort}, ${route.destinationCountry}`} /><Info label="Shipping date" value={route.shippingDate} /><Info label="Estimated transit time" value={calculation.estimatedTransitTime} /></Panel>
      <Panel><h2 className="mb-4 font-semibold">Product details</h2><Info label="Product" value={product.productName} /><Info label="HS code" value={product.hsCode} /><Info label="Quantity" value={`${product.quantity} units`} /><Info label="Product value" value={money(product.productValue)} /></Panel>
    </div>
    <Panel><h2 className="mb-4 font-semibold">Shipment specifications</h2><div className="grid grid-cols-2 gap-4 sm:grid-cols-4"><Info label="Shipping mode" value={shipment.shippingMode} /><Info label="Weight" value={`${shipment.weightKg} kg`} /><Info label="Packages" value={`${shipment.numberOfPackages}`} /><Info label="Container" value={shipment.containerType} /></div></Panel>
    <div className="mt-6"><Panel><h2 className="mb-4 font-semibold">Tax breakdown</h2>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(calculation.taxBreakdown?.taxes && calculation.taxBreakdown.taxes.length > 0 ? calculation.taxBreakdown.taxes : [{ name: 'Taxes', rate: 0, amount: costs.taxes }]).map((tax, index) => (
          <div key={`${tax.name}-${index}`} className="rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-slate-500">{tax.name}</p>
            <p className="mt-1 text-xl font-bold">{money(tax.amount)}</p>
            <p className="mt-1 text-xs text-slate-400">Rate: {tax.rate}%</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Cost label="Subtotal" value={Number(calculation.taxBreakdown?.subtotal ?? costs.total - costs.taxes)} />
        <Cost label="Taxes" value={costs.taxes} />
        <Cost label="Final total" value={Number(calculation.taxBreakdown?.total ?? costs.total)} emphasized />
      </div>
      <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
        <p className="font-medium text-white">Tax data source</p>
        <p className="mt-2">{calculation.ruleSourceLabel || 'Unknown source'} · version {calculation.taxVersion || 'unknown'}</p>
      </div>
    </Panel></div>

    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button onClick={saveCalculation} disabled={saving} className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? 'Saving...' : 'Save Calculation'}
      </button>
      {saveState !== 'idle' && (
        <div className={`flex items-center gap-2 text-sm ${saveState === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
          {saveState === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {message}
        </div>
      )}
    </div>
  </>;
}


function Saved({ calculations, onView }: { calculations: Calculation[]; onView: (calculation: Calculation) => void }) {
  return <><PageHeading title="Saved calculations" subtitle="All calculations saved in this browser" />{calculations.length === 0 ? <Empty>Nothing saved yet. Calculations you create appear here automatically.</Empty> : <div className="grid gap-4 sm:grid-cols-2">{calculations.map((calculation) => <button key={calculation.id} onClick={() => onView(calculation)} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-amber-400/40"><p className="font-semibold">{calculation.route.originPort} → {calculation.route.destinationPort}</p><p className="mt-1 text-sm text-slate-500">{calculation.product.productName}</p><p className="mt-3 text-lg font-bold">{money(calculation.costs.total)}</p></button>)}</div>}</>;
}


function NavButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
  return <button onClick={onClick} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>{icon}{children}</button>;
}
function PageHeading({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-3xl font-bold">{title}</h1><p className="mt-1 text-slate-500">{subtitle}</p></div>{children}</div>;
}
function PrimaryButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button onClick={onClick} disabled={disabled} className="flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40">{children}</button>;
}
function Panel({ children }: { children: React.ReactNode }) { return <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">{children}</section>; }
function Stat({ label, value }: { label: string; value: string }) { return <Panel><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Panel>; }
function Empty({ children }: { children: React.ReactNode }) { return <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-slate-500">{children}</div>; }
function FormSection({ title, children }: { title: string; children: React.ReactNode }) { return <div><h2 className="mb-6 text-xl font-semibold">{title}</h2>{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-sm text-slate-400">{label}</span>{children}</label>; }
function SelectField({ label, value, onChange, options, placeholder, disabled }: { label: string; value: string; onChange: (value: string) => void; options: string[]; placeholder?: string; disabled?: boolean }) {
  return <Field label={label}><select className={inputClass} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>{placeholder && <option value="">{placeholder}</option>}{options.map((option) => <option key={option}>{option}</option>)}</select></Field>;
}
function ReviewCard({ label, children }: { label: string; children: React.ReactNode }) { return <div className="rounded-lg border border-white/10 bg-black/20 p-4"><p className="mb-2 text-xs uppercase tracking-wide text-slate-500">{label}</p><div className="font-medium">{children}</div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="mb-3 last:mb-0"><p className="text-xs text-slate-500">{label}</p><p className="font-medium">{value}</p></div>; }
function Cost({ label, value, emphasized }: { label: string; value: number; emphasized?: boolean }) { return <div className={`rounded-lg border p-4 ${emphasized ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-black/20'}`}><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-xl font-bold">{money(value)}</p></div>; }


function canContinue(step: number, route: RouteInfo, product: ProductInfo, shipment: ShipmentInfo) {
  if (step === 1) return Boolean(route.originCountry && route.originPort && route.destinationCountry && route.destinationPort && route.shippingDate);
  if (step === 2) return Boolean(product.productName && product.hsCode && product.countryOfOrigin && product.quantity > 0 && product.productValue > 0);
  return shipment.weightKg > 0 && shipment.numberOfPackages > 0;
}
function calculateCosts(product: ProductInfo, shipment: ShipmentInfo): CostBreakdown {
  const freightRates = { Sea: 15, Air: 40, Road: 10 };
  const minimums = { Sea: 250, Air: 150, Road: 100 };
  const charges = { Sea: 500, Air: 150, Road: 75 };
  const declaredValue = product.productValue * product.quantity;
  const freight = Math.max(shipment.weightKg * freightRates[shipment.shippingMode], minimums[shipment.shippingMode]);
  const insurance = round2(declaredValue * 0.01);
  const importDuty = round2(declaredValue * 0.15);
  const taxes = round2((declaredValue + importDuty) * 0.1);
  const portCharges = charges[shipment.shippingMode];
  return { freight: round2(freight), insurance, importDuty, taxes, portCharges, total: round2(freight + insurance + importDuty + taxes + portCharges) };
}
function readCalculations(): Calculation[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as Calculation[]; } catch { return []; }
}
function writeCalculations(calculations: Calculation[]) { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(calculations)); }
function money(value: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value); }
function today() { return new Date().toISOString().slice(0, 10); }
function round2(value: number) { return Math.round(value * 100) / 100; }



