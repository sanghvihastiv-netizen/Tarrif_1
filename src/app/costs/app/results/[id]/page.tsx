"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Calculation } from "@/lib/types";
import { getCalculation } from "@/lib/storage";

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const [calc, setCalc] = useState<Calculation | null | undefined>(undefined);

  useEffect(() => {
    setCalc(getCalculation(params.id) ?? null);
  }, [params.id]);

  if (calc === undefined) return null;

  if (calc === null) {
    return (
      <div className="rounded-xl border border-base-border bg-base-panel p-10 text-center">
        <p className="text-base-muted">We couldn't find that calculation.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { route, product, shipment, costs, estimatedTransitTime, createdAt } = calc;

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-2 text-sm text-base-muted hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shipping Cost Estimate</h1>
          <p className="mt-1 text-sm text-base-muted">Calculated on {createdAt}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border border-base-border bg-base-card px-4 py-2 text-sm hover:bg-base-panel"
        >
          <Download size={16} />
          Export as PDF
        </button>
      </div>

      <div className="mb-6 rounded-xl bg-neutral-100 p-6 text-black">
        <p className="text-sm text-neutral-600">Total Estimated Cost</p>
        <p className="mt-1 text-4xl font-bold">${costs.total.toFixed(2)}</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-base-border bg-base-panel p-6">
          <h2 className="mb-4 font-semibold">Shipping Route</h2>
          <InfoRow label="From" value={`${route.originPort}, ${route.originCountry}`} />
          <InfoRow label="To" value={`${route.destinationPort}, ${route.destinationCountry}`} />
          <InfoRow label="Shipping Date" value={route.shippingDate} />
          <InfoRow label="Estimated Transit Time" value={estimatedTransitTime} />
        </div>
        <div className="rounded-xl border border-base-border bg-base-panel p-6">
          <h2 className="mb-4 font-semibold">Product Details</h2>
          <InfoRow label="Product" value={product.productName} />
          <InfoRow label="HS Code" value={product.hsCode} />
          <InfoRow label="Quantity" value={`${product.quantity} units`} />
          <InfoRow label="Product Value" value={`$${product.productValue.toFixed(2)}`} />
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-base-border bg-base-panel p-6">
        <h2 className="mb-4 font-semibold">Shipment Specifications</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoRow label="Shipping Mode" value={shipment.shippingMode} />
          <InfoRow label="Weight" value={`${shipment.weightKg.toFixed(2)} kg`} />
          <InfoRow label="Number of Packages" value={`${shipment.numberOfPackages}`} />
          <InfoRow label="Container Type" value={shipment.containerType} />
        </div>
      </div>

      <div className="rounded-xl border border-base-border bg-base-panel p-6">
        <h2 className="mb-4 font-semibold">Cost Breakdown</h2>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CostCard label="Freight Cost" value={costs.freight} />
          <CostCard label="Insurance" value={costs.insurance} />
          <CostCard label="Import Duty" value={costs.importDuty} />
          <CostCard label="Taxes" value={costs.taxes} />
          <CostCard label="Port Charges" value={costs.portCharges} />
          <CostCard label="Total Cost" value={costs.total} emphasized />
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-base-border text-base-muted">
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Freight" value={costs.freight} />
            <Row label="Insurance" value={costs.insurance} />
            <Row label="Import Duty" value={costs.importDuty} />
            <Row label="Taxes (10%)" value={costs.taxes} />
            <Row label="Port Charges" value={costs.portCharges} />
            <tr>
              <td className="pt-3 font-semibold">Total Estimated Cost</td>
              <td className="pt-3 text-right font-semibold">${costs.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs text-base-muted">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function CostCard({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        emphasized ? "border-white" : "border-base-border"
      } bg-base-bg`}
    >
      <p className="text-sm text-base-muted">{label}</p>
      <p className="mt-1 text-xl font-bold">${value.toFixed(2)}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <tr className="border-b border-base-border/60">
      <td className="py-2 text-base-muted">{label}</td>
      <td className="py-2 text-right">${value.toFixed(2)}</td>
    </tr>
  );
}
