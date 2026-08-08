"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Search, ShoppingBag, X } from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import {
  BadgeOrderStatus,
  BadgePaymentStatus,
  BadgePaymentMethod,
} from "@/components/ui/statuts";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { fcfa } from "@/lib/format";
import type { Order, OrderStatus, PaymentStatus, PaymentMethod } from "@/types/order";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter  = "all" | OrderStatus;
type PayFilter     = "all" | PaymentStatus;
type MethodFilter  = "all" | PaymentMethod;
type SortKey       = "date_desc" | "date_asc" | "total_desc" | "total_asc";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    "En attente",
  confirmed:  "Confirmée",
  processing: "En traitement",
  shipped:    "Expédiée",
  delivered:  "Livrée",
  cancelled:  "Annulée",
};

const PAY_STATUS_OPTIONS: { value: PayFilter; label: string }[] = [
  { value: "all",      label: "Tout paiement"  },
  { value: "pending",  label: "En attente"      },
  { value: "paid",     label: "Payé"            },
  { value: "failed",   label: "Échoué"          },
  { value: "refunded", label: "Remboursé"       },
];

const METHOD_OPTIONS: { value: MethodFilter; label: string }[] = [
  { value: "all",  label: "Toute méthode" },
  { value: "momo", label: "MTN MoMo"      },
  { value: "om",   label: "Orange Money"  },
  { value: "card", label: "Carte"         },
  { value: "cash", label: "Espèces"       },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc",  label: "Plus récentes"  },
  { value: "date_asc",   label: "Plus anciennes" },
  { value: "total_desc", label: "Total ↓"        },
  { value: "total_asc",  label: "Total ↑"        },
];

// ─── Table columns ────────────────────────────────────────────────────────────

const COLONNES: Column<Order>[] = [
  {
    cle: "orderNumber",
    entete: "Commande",
    rendu: (o) => (
      <span className="font-semibold text-secondary">{o.orderNumber}</span>
    ),
  },
  {
    cle: "createdAt",
    entete: "Date",
    masquerMobile: true,
    rendu: (o) =>
      new Date(o.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  },
  {
    cle: "paymentMethod",
    entete: "Méthode",
    aligne: "center",
    masquerMobile: true,
    rendu: (o) => <BadgePaymentMethod method={o.paymentMethod} />,
  },
  {
    cle: "total",
    entete: "Total",
    aligne: "right",
    rendu: (o) => <span className="font-semibold">{fcfa(o.total)}</span>,
  },
  {
    cle: "paymentStatus",
    entete: "Paiement",
    aligne: "center",
    masquerMobile: true,
    rendu: (o) => <BadgePaymentStatus statut={o.paymentStatus} />,
  },
  {
    cle: "status",
    entete: "Statut",
    aligne: "right",
    rendu: (o) => <BadgeOrderStatus statut={o.status} />,
  },
];

// ─── Native select helper ─────────────────────────────────────────────────────

function FilterSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3 h-10">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-full bg-transparent text-sm font-semibold text-secondary outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [payFilter,    setPayFilter]    = useState<PayFilter>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [sort,         setSort]         = useState<SortKey>("date_desc");

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<Order[] | { data: Order[] }>("/v1/admin/orders", { params: { per_page: 100 } })
      .then(({ data }) => setOrders(Array.isArray(data) ? data : (data.data ?? [])))
      .catch((err) => setError(handleApiError(err, "Impossible de charger les commandes")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Client filter + sort ───────────────────────────────────────────────────
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = orders.filter((o) => {
      const matchSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        String(o.userId).includes(q) ||
        String(o.total).includes(q);
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchPay    = payFilter    === "all" || o.paymentStatus === payFilter;
      const matchMethod = methodFilter === "all" || o.paymentMethod === methodFilter;
      return matchSearch && matchStatus && matchPay && matchMethod;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "date_asc")   return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "total_desc") return b.total - a.total;
      if (sort === "total_asc")  return a.total - b.total;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders, search, statusFilter, payFilter, methodFilter, sort]);

  const isFiltering =
    search !== "" || statusFilter !== "all" || payFilter !== "all" || methodFilter !== "all";

  const caTotal = useMemo(
    () => orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0),
    [orders]
  );

  if (error) return <ErrorAlert message={error} onRetry={fetchOrders} />;

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Commandes"
        sousTitre={
          loading
            ? "Chargement…"
            : isFiltering
            ? `${displayed.length} résultat${displayed.length !== 1 ? "s" : ""} filtrés`
            : `${orders.length} commande${orders.length !== 1 ? "s" : ""} au total`
        }
      />

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          label="Total commandes"
          valeur={String(orders.length)}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="En attente"
          valeur={String(orders.filter((o) => o.status === "pending").length)}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="warn"
        />
        <StatCard
          label="Livrées"
          valeur={String(orders.filter((o) => o.status === "delivered").length)}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="CA encaissé"
          valeur={fcfa(caTotal)}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="primary"
        />
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="N° commande, client…"
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

        {/* Order status — pill toggle */}
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
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
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

        {/* Payment status */}
        <FilterSelect
          value={payFilter}
          onChange={setPayFilter}
          options={PAY_STATUS_OPTIONS}
        />

        {/* Payment method */}
        <FilterSelect
          value={methodFilter}
          onChange={setMethodFilter}
          options={METHOD_OPTIONS}
        />

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

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={COLONNES}
          rows={displayed}
          link={(o) => `/orders/${o.id}`}
        />
      )}
    </div>
  );
}
