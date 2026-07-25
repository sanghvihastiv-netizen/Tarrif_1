"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/components/StepIndicator";
import { calculateCosts, estimateTransitTime } from "@/lib/calculations";
import { saveCalculation } from "@/lib/storage";
import { ProductInfo, RouteInfo, ShipmentInfo, ShippingMode } from "@/lib/types";

const COUNTRIES = [
  "United States",
  "Canada",
  "China",
  "India",
  "Germany",
  "United Kingdom",
  "France",
  "Japan",
  "Mexico",
  "Brazil",
  "Australia",
  "Singapore",
  "Hong Kong",
  "Netherlands",
  "South Korea",
];

const PORTS: Record<string, string[]> = {
  "United States": ["Los Angeles", "New York", "Houston", "Seattle", "Miami"],
  India: ["Mumbai", "Chennai", "Nhava Sheva", "Kolkata"],
  China: ["Shanghai", "Shenzhen", "Ningbo", "Qingdao"],
  Germany: ["Hamburg", "Bremerhaven"],
  "United Kingdom": ["Felixstowe", "Southampton", "London Gateway"],
  France: ["Le Havre", "Marseille"],
  Japan: ["Yokohama", "Tokyo", "Osaka"],
  Mexico: ["Manzanillo", "Veracruz"],
  Brazil: ["Santos", "Rio de Janeiro"],
  Australia: ["Sydney", "Melbourne"],
  Singapore: ["Singapore"],
  "Hong Kong": ["Hong Kong"],
  Netherlands: ["Rotterdam"],
  "South Korea": ["Busan", "Incheon"],
  Canada: ["Vancouver", "Montreal"],
};

const CONTAINER_TYPES = ["20ft Container", "40ft Container", "40ft High Cube", "Loose Cargo"];

const emptyRoute: RouteInfo = {
  originCountry: "",
  originPort: "",
  destinationCountry: "",
  destinationPort: "",
  shippingDate: "",
};

const emptyProduct: ProductInfo = {
  productName: "",
  hsCode: "",
  countryOfOrigin: "",
  quantity: 1,
  productValue: 0,
};

const emptyShipment: ShipmentInfo = {
  shippingMode: "Sea",
  weightKg: 0,
  numberOfPackages: 1,
  containerType: CONTAINER_TYPES[0],
};

export default function CalculatorPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [route, setRoute] = useState<RouteInfo>(emptyRoute);
  const [product, setProduct] = useState<ProductInfo>(emptyProduct);
  const [shipment, setShipment] = useState<ShipmentInfo>(emptyShipment);
  const [submitting, setSubmitting] = useState(false);

  function next() {
    setStep((s) => Math.min(s + 1, 4));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleCalculate() {
    setSubmitting(true);
    const costs = calculateCosts(product, shipment);
    const id = crypto.randomUUID();
    saveCalculation({
      id,
      createdAt: new Date().toISOString().slice(0, 10),
      route,
      product,
      shipment,
      costs,
      estimatedTransitTime: estimateTransitTime(shipment.shippingMode),
    });
    router.push(`/results/${id}`);
  }

  return (
    <div>
      <StepIndicator current={step} />

      <div className="rounded-xl border border-base-border bg-base-panel p-8">
        {step === 1 && (
          <RouteStep route={route} setRoute={setRoute} onNext={next} />
        )}
        {step === 2 && (
          <ProductStep
            product={product}
            setProduct={setProduct}
            onNext={next}
            onPrev={prev}
          />
        )}
        {step === 3 && (
          <ShipmentStep
            shipment={shipment}
            setShipment={setShipment}
            onNext={next}
            onPrev={prev}
          />
        )}
        {step === 4 && (
          <ReviewStep
            route={route}
            product={product}
            shipment={shipment}
            onPrev={prev}
            onCalculate={handleCalculate}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm text-base-muted">{children}</label>;
}

const inputClass =
  "w-full rounded-lg border border-base-border bg-base-bg px-3 py-2.5 text-sm text-white outline-none focus:border-white/40";

function RouteStep({
  route,
  setRoute,
  onNext,
}: {
  route: RouteInfo;
  setRoute: (r: RouteInfo) => void;
  onNext: () => void;
}) {
  const canProceed =
    route.originCountry &&
    route.originPort &&
    route.destinationCountry &&
    route.destinationPort &&
    route.shippingDate;

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Shipment Route</h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div>
          <FieldLabel>Origin Country</FieldLabel>
          <select
            className={inputClass}
            value={route.originCountry}
            onChange={(e) =>
              setRoute({ ...route, originCountry: e.target.value, originPort: "" })
            }
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Origin Port/City</FieldLabel>
          <select
            className={inputClass}
            value={route.originPort}
            onChange={(e) => setRoute({ ...route, originPort: e.target.value })}
            disabled={!route.originCountry}
          >
            <option value="">Select port</option>
            {(PORTS[route.originCountry] || []).map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Destination Country</FieldLabel>
          <select
            className={inputClass}
            value={route.destinationCountry}
            onChange={(e) =>
              setRoute({ ...route, destinationCountry: e.target.value, destinationPort: "" })
            }
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Destination Port/City</FieldLabel>
          <select
            className={inputClass}
            value={route.destinationPort}
            onChange={(e) => setRoute({ ...route, destinationPort: e.target.value })}
            disabled={!route.destinationCountry}
          >
            <option value="">Select port</option>
            {(PORTS[route.destinationCountry] || []).map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Shipping Date</FieldLabel>
          <input
            type="date"
            className={inputClass}
            value={route.shippingDate}
            onChange={(e) => setRoute({ ...route, shippingDate: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-between border-t border-base-border pt-6">
        <span />
        <button
          disabled={!canProceed}
          onClick={onNext}
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ProductStep({
  product,
  setProduct,
  onNext,
  onPrev,
}: {
  product: ProductInfo;
  setProduct: (p: ProductInfo) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const canProceed =
    product.productName && product.hsCode && product.countryOfOrigin && product.quantity > 0 && product.productValue > 0;

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Product Details</h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel>Product Name</FieldLabel>
          <input
            className={inputClass}
            value={product.productName}
            onChange={(e) => setProduct({ ...product, productName: e.target.value })}
            placeholder="e.g. Textiles"
          />
        </div>
        <div>
          <FieldLabel>HS Code</FieldLabel>
          <input
            className={inputClass}
            value={product.hsCode}
            onChange={(e) => setProduct({ ...product, hsCode: e.target.value })}
            placeholder="e.g. 8471.30"
          />
        </div>
        <div>
          <FieldLabel>Country of Origin</FieldLabel>
          <select
            className={inputClass}
            value={product.countryOfOrigin}
            onChange={(e) => setProduct({ ...product, countryOfOrigin: e.target.value })}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Quantity</FieldLabel>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={product.quantity}
            onChange={(e) => setProduct({ ...product, quantity: Number(e.target.value) })}
          />
        </div>
        <div>
          <FieldLabel>Product Value (USD)</FieldLabel>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={product.productValue}
            onChange={(e) => setProduct({ ...product, productValue: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-between border-t border-base-border pt-6">
        <button onClick={onPrev} className="rounded-lg px-5 py-2.5 text-sm text-base-muted hover:text-white">
          Previous
        </button>
        <button
          disabled={!canProceed}
          onClick={onNext}
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ShipmentStep({
  shipment,
  setShipment,
  onNext,
  onPrev,
}: {
  shipment: ShipmentInfo;
  setShipment: (s: ShipmentInfo) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const canProceed = shipment.weightKg > 0 && shipment.numberOfPackages > 0;
  const modes: ShippingMode[] = ["Sea", "Air", "Road"];

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Shipment Details</h2>

      <FieldLabel>Shipping Mode</FieldLabel>
      <div className="mb-5 grid grid-cols-3 gap-3">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setShipment({ ...shipment, shippingMode: m })}
            className={`rounded-lg border py-2.5 text-sm font-medium transition ${
              shipment.shippingMode === m
                ? "border-white bg-white text-black"
                : "border-base-border bg-base-bg text-base-muted hover:text-white"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div>
          <FieldLabel>Weight (kg)</FieldLabel>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={shipment.weightKg}
            onChange={(e) => setShipment({ ...shipment, weightKg: Number(e.target.value) })}
          />
        </div>
        <div>
          <FieldLabel>Number of Packages</FieldLabel>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={shipment.numberOfPackages}
            onChange={(e) => setShipment({ ...shipment, numberOfPackages: Number(e.target.value) })}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Container Type</FieldLabel>
          <select
            className={inputClass}
            value={shipment.containerType}
            onChange={(e) => setShipment({ ...shipment, containerType: e.target.value })}
          >
            {CONTAINER_TYPES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 flex justify-between border-t border-base-border pt-6">
        <button onClick={onPrev} className="rounded-lg px-5 py-2.5 text-sm text-base-muted hover:text-white">
          Previous
        </button>
        <button
          disabled={!canProceed}
          onClick={onNext}
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ReviewStep({
  route,
  product,
  shipment,
  onPrev,
  onCalculate,
  submitting,
}: {
  route: RouteInfo;
  product: ProductInfo;
  shipment: ShipmentInfo;
  onPrev: () => void;
  onCalculate: () => void;
  submitting: boolean;
}) {
  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Review Your Shipment</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReviewCard label="Route">
          <p className="font-semibold">
            {route.originPort}, {route.originCountry}
          </p>
          <p className="text-base-muted">↓</p>
          <p className="font-semibold">
            {route.destinationPort}, {route.destinationCountry}
          </p>
        </ReviewCard>
        <ReviewCard label="Shipping Date">
          <p className="font-semibold">{route.shippingDate}</p>
        </ReviewCard>
        <ReviewCard label="Product">
          <p className="font-semibold">{product.productName}</p>
          <p className="text-sm text-base-muted">HS Code: {product.hsCode}</p>
        </ReviewCard>
        <ReviewCard label="Shipment">
          <p className="font-semibold">{shipment.shippingMode}</p>
          <p className="text-sm text-base-muted">
            {shipment.weightKg}kg, {shipment.numberOfPackages} packages
          </p>
        </ReviewCard>
      </div>

      <div className="mt-4 rounded-lg border border-base-border bg-base-bg p-4 text-sm text-base-muted">
        Ready to calculate? Click the button below to see estimated costs and charges.
      </div>

      <div className="mt-8 flex justify-between border-t border-base-border pt-6">
        <button onClick={onPrev} className="rounded-lg px-5 py-2.5 text-sm text-base-muted hover:text-white">
          Previous
        </button>
        <button
          onClick={onCalculate}
          disabled={submitting}
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-60"
        >
          {submitting ? "Calculating..." : "Calculate Cost"}
        </button>
      </div>
    </div>
  );
}

function ReviewCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-base-border bg-base-bg p-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-base-muted">{label}</p>
      {children}
    </div>
  );
}
