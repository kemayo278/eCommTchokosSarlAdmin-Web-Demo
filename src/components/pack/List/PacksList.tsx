"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Layers, Pencil, Plus, Search, X, Zap } from "lucide-react";
import { PageHeader, Card, Button, Badge } from "@/components/ui/primitives";
import { BadgeActif } from "@/components/ui/statuts";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { PackProducts } from "@/app/(admin)/products/packs/PackProducts";
import type { Pack } from "@/types/pack";

type TypeFilter = "all" | "pack" | "flash_sale";
type StatusFilter = "all" | "active" | "inactive";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PacksList() {
  const [fetchKey, setFetchKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<Pack[]>("/v1/packs")
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data as any)?.data ?? [];
        setPacks(list);
      })
      .catch((err) => setError(handleApiError(err, "Impossible de charger les packs")))
      .finally(() => setLoading(false));
  }, [fetchKey]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packs.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || p.type === typeFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.isActive) ||
        (statusFilter === "inactive" && !p.isActive);
      return matchSearch && matchType && matchStatus;
    });
  }, [packs, search, typeFilter, statusFilter]);

  const hasFilters = search || typeFilter !== "all" || statusFilter !== "all";

  if (loading) return <LoadingSpinner />;

  if (error)
    return (
      <ErrorAlert
        message={error}
        onRetry={() => {
          setError(null);
          setFetchKey((k) => k + 1);
        }}
      />
    );

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Packs"
        sousTitre={`${packs.length} pack(s) · regroupez plusieurs produits en une offre`}
        action={
          <Button href="/products/packs/new">
            <Plus className="h-4 w-4" /> Nouveau pack
          </Button>
        }
      />

      {/* ── Toolbar ── */}
      {packs.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un pack…"
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

          {/* Type */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-surface p-1">
            {(["all", "pack", "flash_sale"] as TypeFilter[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  typeFilter === t
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-secondary"
                }`}
              >
                {t === "flash_sale" && <Zap className="h-3.5 w-3.5" />}
                {t === "pack" && <Layers className="h-3.5 w-3.5" />}
                {t === "all" ? "Tous" : t === "pack" ? "Pack" : "Vente flash"}
              </button>
            ))}
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
        </div>
      )}

      {/* ── Grid ── */}
      {packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <Layers className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-500">Aucun pack pour le moment</p>
          <p className="mt-1 text-sm text-slate-400">Créez votre premier pack pour commencer.</p>
          <Button href="/products/packs/new" className="mt-5">
            <Plus className="h-4 w-4" /> Nouveau pack
          </Button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <Layers className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-500">Aucun résultat</p>
          <p className="mt-1 text-sm text-slate-400">
            Aucun pack ne correspond aux filtres sélectionnés.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
              className="mt-4 text-sm font-semibold text-primary hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {displayed.map((pack) => (
            <Card key={pack.id} className="overflow-hidden">
              {pack.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pack.coverImage}
                  alt={pack.name}
                  className="h-32 w-full object-cover"
                />
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
                      {pack.type === "flash_sale" ? (
                        <Zap className="h-5 w-5" />
                      ) : (
                        <Layers className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-secondary">{pack.name}</p>
                      <p className="text-xs text-slate-400">
                        {pack.productsCount} produit(s) · ordre #{pack.sortOrder}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge tone={pack.type === "flash_sale" ? "warn" : "info"}>
                      {pack.type === "flash_sale" ? "Vente flash" : "Pack"}
                    </Badge>
                    <BadgeActif actif={pack.isActive} />
                  </div>
                </div>

                {pack.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-slate-500">{pack.description}</p>
                )}

                {(pack.startsAt || pack.expiresAt) && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarRange className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {pack.startsAt ? formatDate(pack.startsAt) : "—"}
                      {" → "}
                      {pack.expiresAt ? formatDate(pack.expiresAt) : "—"}
                    </span>
                  </div>
                )}

                <PackProducts
                  packName={pack.name}
                  products={pack.products.map((pp) => pp.product.name)}
                />

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    href={`/products/packs/${pack.id}`}
                    className="px-3! py-1.5! text-xs"
                  >
                    Voir
                  </Button>
                  <Button
                    variant="secondary"
                    href={`/products/packs/${pack.id}/edit`}
                    className="px-3! py-1.5! text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
