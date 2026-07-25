"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Eye, Copy, Trash2 } from "lucide-react";
import { Calculation } from "@/lib/types";
import { getCalculations, deleteCalculation, duplicateCalculation } from "@/lib/storage";

export default function DashboardPage() {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCalculations(getCalculations());
    setLoaded(true);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return calculations;
    return calculations.filter((c) =>
      [
        c.route.originCountry,
        c.route.destinationCountry,
        c.product.productName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [calculations, query]);

  const stats = useMemo(() => {
    const total = calculations.length;
    const totalShipments = calculations.reduce((sum, c) => sum + c.costs.total, 0);
    const average = total ? totalShipments / total : 0;
    return { total, average, totalShipments };
  }, [calculations]);

  function handleDelete(id: string) {
    deleteCalculation(id);
    setCalculations(getCalculations());
  }

  function handleDuplicate(id: string) {
    duplicateCalculation(id);
    setCalculations(getCalculations());
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-base-muted">Manage your shipping calculations</p>
        </div>
        <Link
          href="/calculator"
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200"
        >
          <Plus size={16} />
          New Calculation
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Calculations" value={stats.total.toString()} />
        <StatCard label="Average Cost" value={`$${stats.average.toFixed(2)}`} />
        <StatCard label="Total Shipments" value={`$${stats.totalShipments.toFixed(2)}`} />
      </div>

      <div className="rounded-xl border border-base-border bg-base-panel p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Calculations</h2>
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-base-border bg-base-bg px-3 py-2">
          <Search size={16} className="text-base-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search calculations..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-base-muted"
          />
        </div>

        {loaded && filtered.length === 0 ? (
          <EmptyState hasQuery={query.length > 0} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-base-border text-base-muted">
                  <th className="pb-3 font-medium">From</th>
                  <th className="pb-3 font-medium">To</th>
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Cost</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-base-border/60">
                    <td className="py-4">
                      {c.route.originPort}, {c.route.originCountry}
                    </td>
                    <td className="py-4">
                      {c.route.destinationPort}, {c.route.destinationCountry}
                    </td>
                    <td className="py-4">{c.product.productName}</td>
                    <td className="py-4 font-semibold">${c.costs.total.toFixed(2)}</td>
                    <td className="py-4 text-base-muted">{c.createdAt}</td>
                    <td className="py-4">
                      <div className="flex justify-end gap-3">
                        <Link href={`/results/${c.id}`} title="View">
                          <Eye size={16} className="text-base-muted hover:text-white" />
                        </Link>
                        <button title="Duplicate" onClick={() => handleDuplicate(c.id)}>
                          <Copy size={16} className="text-base-muted hover:text-white" />
                        </button>
                        <button title="Delete" onClick={() => handleDelete(c.id)}>
                          <Trash2 size={16} className="text-red-500 hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-base-border bg-base-panel p-6">
      <p className="text-sm text-base-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-base-border py-12 text-center text-base-muted">
      {hasQuery
        ? "No calculations match your search."
        : "No calculations yet. Start a new one to see it here."}
    </div>
  );
}
