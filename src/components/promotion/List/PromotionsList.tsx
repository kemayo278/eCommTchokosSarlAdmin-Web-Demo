"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Percent,
  Plus,
  Search,
  Ticket,
  X,
} from "lucide-react";
import { PageHeader, Button, Badge } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { BadgeActif } from "@/components/ui/statuts";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { fcfa } from "@/lib/format";
import type { Coupon, CouponMeta, CouponsResponse } from "@/types/coupon";
import { formatDate } from "@/lib/utils";

const PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

type StatusFilter = "all" | "active" | "inactive";

const columns: Column<Coupon>[] = [
  {
    cle: "code",
    entete: "Code",
    rendu: (c) => (
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warn-soft text-warn">
          <Ticket className="h-4 w-4" />
        </span>
        <span className="font-mono font-bold text-secondary">{c.code}</span>
      </div>
    ),
  },
  {
    cle: "valeur",
    entete: "Réduction",
    rendu: (c) =>
      c.type === "percentage" ? (
        <span className="inline-flex items-center gap-1 font-semibold text-secondary">
          <Percent className="h-3.5 w-3.5 text-slate-400" />
          {c.value} %
        </span>
      ) : (
        <span className="font-semibold text-secondary">{fcfa(c.value)}</span>
      ),
  },
  {
    cle: "min",
    entete: "Min. commande",
    masquerMobile: true,
    rendu: (c) => <span className="text-slate-500">{fcfa(c.minOrderAmount)}</span>,
  },
  {
    cle: "usage",
    entete: "Utilisations",
    aligne: "center",
    masquerMobile: true,
    rendu: (c) => (
      <Badge tone={c.usedCount >= c.maxUses ? "danger" : "neutral"}>
        {c.usedCount} / {c.maxUses}
      </Badge>
    ),
  },
  {
    cle: "expire",
    entete: "Expire le",
    masquerMobile: true,
    rendu: (c) => (
      <span className="text-slate-500">
        {c.expiresAt ? formatDate(c.expiresAt) : "—"}
      </span>
    ),
  },
  {
    cle: "statut",
    entete: "Statut",
    aligne: "right",
    rendu: (c) => <BadgeActif actif={c.isActive} />,
  },
];

export default function PromotionsList() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [meta, setMeta] = useState<CouponMeta>({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchCoupons = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<CouponsResponse>("/v1/coupons", { params: { page, per_page: perPage } })
      .then(({ data }) => {
        setCoupons(data.data);
        setMeta(data.meta);
      })
      .catch((err) => setError(handleApiError(err, "Impossible de charger les promotions")))
      .finally(() => setLoading(false));
  }, [page, perPage]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coupons.filter((c) => {
      const matchSearch = !q || c.code.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.isActive) ||
        (statusFilter === "inactive" && !c.isActive);
      return matchSearch && matchStatus;
    });
  }, [coupons, search, statusFilter]);

  const actifs = coupons.filter((c) => c.isActive).length;

  if (error) return <ErrorAlert message={error} onRetry={fetchCoupons} />;

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Promotions"
        sousTitre={
          loading
            ? "Chargement…"
            : `${actifs} coupon(s) actif(s) sur ${meta.total}`
        }
        action={
          <Button href="/products/promotions/new">
            <Plus className="h-4 w-4" /> Nouvelle promotion
          </Button>
        }
      />

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code…"
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

        {/* Status */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-surface p-1">
          {(["all", "active", "inactive"] as StatusFilter[]).map((s) => (
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
              {s === "all" ? "Tous" : s === "active" ? "Actif" : "Inactif"}
            </button>
          ))}
        </div>

        {/* Per page */}
        <div className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3">
          <span className="shrink-0 text-sm text-slate-400">Afficher</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="h-full cursor-pointer bg-transparent text-sm font-semibold text-secondary outline-none"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <LoadingSpinner />
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <Ticket className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-500">
            {search || statusFilter !== "all" ? "Aucun résultat" : "Aucun coupon pour le moment"}
          </p>
          {!search && statusFilter === "all" && (
            <>
              <p className="mt-1 text-sm text-slate-400">Créez votre première promotion.</p>
              <Button href="/products/promotions/new" className="mt-5">
                <Plus className="h-4 w-4" /> Nouvelle promotion
              </Button>
            </>
          )}
        </div>
      ) : (
        <DataTable columns={columns} rows={displayed} link={(c) => `/products/promotions/${c.id}`} />
      )}

      {/* ── Pagination ── */}
      {!loading && meta.total > 0 && meta.lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page{" "}
            <span className="font-semibold text-secondary">{meta.currentPage}</span>
            {" "}sur{" "}
            <span className="font-semibold text-secondary">{meta.lastPage}</span>
            {" · "}{meta.total} coupon(s)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-surface text-slate-500 transition hover:bg-slate-50 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: meta.lastPage }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold transition ${
                    p === page
                      ? "bg-primary text-white shadow-sm"
                      : "border border-slate-200 bg-surface text-slate-500 hover:bg-slate-50 hover:text-secondary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.lastPage}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-surface text-slate-500 transition hover:bg-slate-50 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
