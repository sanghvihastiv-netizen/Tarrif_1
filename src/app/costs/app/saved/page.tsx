"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calculation } from "@/lib/types";
import { getCalculations } from "@/lib/storage";

export default function SavedPage() {
  const [calculations, setCalculations] = useState<Calculation[]>([]);

  useEffect(() => {
    setCalculations(getCalculations());
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-3xl font-bold">Saved Calculations</h1>
      <p className="mb-8 text-base-muted">All calculations you've saved for later reference</p>

      {calculations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-base-border bg-base-panel p-12 text-center text-base-muted">
          Nothing saved yet. Calculations you create appear here automatically.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {calculations.map((c) => (
            <Link
              key={c.id}
              href={`/results/${c.id}`}
              className="rounded-xl border border-base-border bg-base-panel p-5 transition hover:border-white/40"
            >
              <p className="font-semibold">
                {c.route.originPort} → {c.route.destinationPort}
              </p>
              <p className="mt-1 text-sm text-base-muted">{c.product.productName}</p>
              <p className="mt-3 text-lg font-bold">${c.costs.total.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
