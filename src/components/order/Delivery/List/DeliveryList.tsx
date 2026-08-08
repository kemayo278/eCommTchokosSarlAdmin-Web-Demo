"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Phone, QrCode, Search, Truck, X } from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { BadgeDeliveryStatus, BadgeOrderStatus } from "@/components/ui/statuts";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import type { Delivery, DeliveryPaginated, DeliveryStatus } from "@/types/delivery";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | DeliveryStatus;
type SortKey = "date_desc" | "date_asc";

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending:    "En attente",
  assigned:   "Assignée",
  in_transit: "En transit",
  delivered:  "Livrée",
  failed:     "Échouée",
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc", label: "Plus récentes"  },
  { value: "date_asc",  label: "Plus anciennes" },
];

// ─── Table columns ────────────────────────────────────────────────────────────

const COLONNES: Column<Delivery>[] = [
  {
    cle: "deliveryCode",
    entete: "Code livraison",
    rendu: (d) => (
      <span className="font-mono text-xs font-semibold text-secondary">
        {d.deliveryCode}
      </span>
    ),
  },
  {
    cle: "orderId",
    entete: "Commande",
    rendu: (d) => (
      <Link
        href={`/orders/${d.orderId}`}
        onClick={(e) => e.stopPropagation()}
        className="font-semibold text-secondary hover:text-primary hover:underline"
      >
        {d.order.orderNumber}
      </Link>
    ),
  },
  {
    cle: "livreur",
    entete: "Livreur",
    masquerMobile: true,
    rendu: (d) =>
      d.livreur ? (
        <span className="flex items-center gap-1.5 text-sm text-secondary">
          <span className="font-medium">{d.livreur.name}</span>
          {d.livreur.phone && (
            <span className="flex items-center gap-0.5 text-xs text-slate-400">
              <Phone className="h-3 w-3" />
              {d.livreur.phone}
            </span>
          )}
        </span>
      ) : (
        <span className="text-sm font-medium text-warn">Non assigné</span>
      ),
  },
  {
    cle: "orderStatus",
    entete: "Statut commande",
    masquerMobile: true,
    rendu: (d) => <BadgeOrderStatus statut={d.order.status} />,
  },
  {
    cle: "createdAt",
    entete: "Créée le",
    masquerMobile: true,
    rendu: (d) =>
      new Date(d.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  },
  {
    cle: "deliveryStatus",
    entete: "Statut livraison",
    aligne: "right",
    rendu: (d) => <BadgeDeliveryStatus statut={d.status} />,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeliveryList() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort,         setSort]         = useState<SortKey>("date_desc");

  const fetchDeliveries = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<DeliveryPaginated>("/v1/deliveries")
      .then(({ data }) => setDeliveries(data.data))
      .catch((err) =>
        setError(handleApiError(err, "Impossible de charger les livraisons"))
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  // ── Client filter + sort ───────────────────────────────────────────────────
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = deliveries.filter((d) => {
      const matchSearch =
        !q ||
        d.deliveryCode.toLowerCase().includes(q) ||
        d.order.orderNumber.toLowerCase().includes(q) ||
        (d.livreur?.name ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
    return [...filtered].sort((a, b) =>
      sort === "date_asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [deliveries, search, statusFilter, sort]);

  const isFiltering = search !== "" || statusFilter !== "all";

  const enTransit    = deliveries.filter((d) => d.status === "in_transit").length;
  const nonAssignees = deliveries.filter((d) => d.livreurId === null).length;

  if (error) return <ErrorAlert message={error} onRetry={fetchDeliveries} />;

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Livraisons"
        sousTitre={
          loading
            ? "Chargement…"
            : isFiltering
            ? `${displayed.length} résultat${displayed.length !== 1 ? "s" : ""} filtrés`
            : `${deliveries.length} livraison${deliveries.length !== 1 ? "s" : ""} au total`
        }
      />

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="En transit"
          valeur={String(enTransit)}
          icon={<Truck className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Non assignées"
          valeur={String(nonAssignees)}
          icon={<Truck className="h-5 w-5" />}
          tone="warn"
        />
        <StatCard
          label="Validation QR"
          valeur="Active"
          icon={<QrCode className="h-5 w-5" />}
          tone="info"
        />
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Code livraison, commande, livreur…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-surface pl-9 pr-9 text-sm text-secondary placeholder:text-slate-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Delivery status — pill toggle */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-surface p-1 gap-1">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              statusFilter === "all"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-secondary"
            }`}
          >
            Tous
          </button>
          {(Object.keys(STATUS_LABELS) as DeliveryStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                statusFilter === s
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-secondary"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3 h-10">
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-full bg-transparent text-sm font-semibold text-secondary outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={COLONNES}
          rows={displayed}
          link={(d) => `/orders/deliveries/${d.id}`}
        />
      )}
    </div>
  );
}
