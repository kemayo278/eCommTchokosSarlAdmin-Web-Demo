"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Loader2,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader, StatCard, SectionCard, Card } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AireVentes, CamembertPaiements } from "@/components/ui/Charts";
import { BadgeOrderStatus } from "@/components/ui/statuts";
import type { OrderStatus } from "@/types/order";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { fcfa } from "@/lib/format";
import ErrorAlert from "@/components/ui/ErrorAlert";

interface KpiItem { value: number; variation: number | null }

interface RecentOrder {
  order_number: string;
  client: string;
  total: number;
  status: string;
  date: string;
}

interface TopProduct {
  product: string;
  total_sold: number;
  unit_price: number;
}

interface AnalyticsData {
  period: { start: string; end: string };
  kpis: {
    revenue: KpiItem;
    orders: KpiItem;
    avg_cart: KpiItem;
    new_customers: KpiItem;
  };
  daily_sales: { date: string; total: number }[];
  payment_methods: { method: string; total: number; count: number; percentage: number }[];
  recent_orders: RecentOrder[];
  top_products: TopProduct[];
}

type Period = "today" | "7d" | "30d" | "custom";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "7d",    label: "7 jours" },
  { key: "30d",   label: "30 jours" },
  { key: "custom", label: "Personnalisé" },
];

const METHOD_COLORS: Record<string, string> = {
  momo: "#10b981",
  om:   "#f59e0b",
  wave: "#3b82f6",
  cash: "#64748b",
  card: "#8b5cf6",
};

const METHOD_LABELS: Record<string, string> = {
  momo: "MTN MoMo",
  om:   "Orange Money",
  wave: "Wave",
  cash: "Cash",
  card: "Carte",
};

function formatVariation(v: number | null): string | undefined {
  if (v === null || v === undefined) return undefined;
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1).replace(".", ",")} %`;
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function localDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

const recentOrderColumns: Column<RecentOrder>[] = [
  {
    cle: "order_number",
    entete: "Commande",
    rendu: (o) => <span className="font-semibold text-secondary">{o.order_number}</span>,
  },
  {
    cle: "client",
    entete: "Client",
    masquerMobile: true,
    rendu: (o) => <span className="text-sm text-slate-500">{o.client}</span>,
  },
  {
    cle: "total",
    entete: "Total",
    aligne: "right",
    rendu: (o) => <span className="font-semibold text-secondary">{fcfa(o.total)}</span>,
  },
  {
    cle: "status",
    entete: "Statut",
    aligne: "right",
    rendu: (o) => <BadgeOrderStatus statut={o.status as OrderStatus} />,
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<Period>("7d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAnalytics = useCallback(() => {
    if (period === "custom" && (!startDate || !endDate)) return;
    setLoading(true);
    setError(null);

    const params: Record<string, string> = {};
    if (period === "today") params.period = "today";
    else if (period === "30d") params.period = "30d";
    else if (period === "custom") {
      params.period = "custom";
      params.start_date = startDate;
      params.end_date = endDate;
    }

    axiosClient
      .get<AnalyticsData>("/v1/stats/analytics", { params })
      .then(({ data }) => setData(data))
      .catch((err) => setError(handleApiError(err, "Impossible de charger les statistiques")))
      .finally(() => setLoading(false));
  }, [period, startDate, endDate]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const salesChartData = (data?.daily_sales ?? []).map((d) => ({
    jour: shortDate(d.date),
    montant: d.total,
  }));

  const paymentChartData = (data?.payment_methods ?? []).map((m) => ({
    nom: METHOD_LABELS[m.method] ?? m.method,
    valeur: m.percentage,
    couleur: METHOD_COLORS[m.method] ?? "#94a3b8",
  }));

  const periodLabel = data
    ? `${localDate(data.period.start)} – ${localDate(data.period.end)}`
    : "Chargement…";

  return (
    <div className="space-y-6">
      <PageHeader titre="Tableau de bord" sousTitre={periodLabel} />

      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={`rounded-xl border px-3.5 py-1.5 text-sm font-semibold transition ${
              period === key
                ? "border-primary bg-primary-soft text-primary-dark"
                : "border-slate-200 bg-surface text-slate-500 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}

        {period === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 px-3 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-xs text-slate-400">→</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 px-3 text-sm text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchAnalytics} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires"
          valeur={data ? fcfa(data.kpis.revenue.value) : "—"}
          icon={<TrendingUp className="h-5 w-5" />}
          variation={data ? formatVariation(data.kpis.revenue.variation) : undefined}
          tone="primary"
        />
        <StatCard
          label="Commandes"
          valeur={data ? String(data.kpis.orders.value) : "—"}
          icon={<ShoppingCart className="h-5 w-5" />}
          variation={data ? formatVariation(data.kpis.orders.variation) : undefined}
          tone="info"
        />
        <StatCard
          label="Panier moyen"
          valeur={data ? fcfa(data.kpis.avg_cart.value) : "—"}
          icon={<Package className="h-5 w-5" />}
          variation={data ? formatVariation(data.kpis.avg_cart.variation) : undefined}
          tone="warn"
        />
        <StatCard
          label="Nouveaux clients"
          valeur={data ? String(data.kpis.new_customers.value) : "—"}
          icon={<Users className="h-5 w-5" />}
          variation={data ? formatVariation(data.kpis.new_customers.variation) : undefined}
          tone="neutral"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Ventes journalières" className="lg:col-span-2">
          {loading ? (
            <div className="flex h-[260px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : salesChartData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center">
              <p className="text-sm text-slate-400">Aucune vente sur la période</p>
            </div>
          ) : (
            <AireVentes data={salesChartData} cle="montant" x="jour" />
          )}
        </SectionCard>

        <SectionCard title="Répartition paiements">
          {loading ? (
            <div className="flex h-[260px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : paymentChartData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center">
              <p className="text-sm text-slate-400">Aucune donnée</p>
            </div>
          ) : (
            <CamembertPaiements data={paymentChartData} />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold tracking-tight text-secondary">Commandes récentes</h2>
            <Link href="/orders" className="text-sm font-semibold text-primary-dark hover:underline">
              Voir tout
            </Link>
          </div>
          {loading ? (
            <div className="flex h-24 items-center justify-center rounded-2xl border border-slate-100">
              <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
            </div>
          ) : (data?.recent_orders ?? []).length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-400">Aucune commande sur la période</p>
            </div>
          ) : (
            <DataTable columns={recentOrderColumns} rows={data!.recent_orders} />
          )}
        </div>

        <SectionCard title="Meilleures ventes">
          {loading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
            </div>
          ) : (data?.top_products ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">Aucun produit sur la période</p>
          ) : (
            <ul className="space-y-4">
              {data!.top_products.map((p, i) => (
                <li key={p.product} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-secondary">{p.product}</p>
                    <p className="text-xs text-slate-400">{p.total_sold} vendus</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-primary-dark">{fcfa(p.unit_price)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <Card className="flex items-center justify-between gap-4 bg-secondary p-5 text-white">
        <div>
          <p className="font-bold">Prêt à faire vivre le site&nbsp;?</p>
          <p className="text-sm text-slate-300">Ajoutez un produit ou publiez une vidéo produit.</p>
        </div>
        <Link
          href="/products/new"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
        >
          Nouveau produit <ArrowUpRight className="h-4 w-4" />
        </Link>
      </Card>
    </div>
  );
}
