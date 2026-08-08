"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Link2,
  Loader2,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Power,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { ProductThumbnail } from "@/components/product/Thumbnail/ProductThumbnail";
import { PageHeader, StatCard, Button, Badge } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { BadgeActif } from "@/components/ui/statuts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fcfa } from "@/lib/format";
import { STORE_URL } from "@/lib/utils";
import axiosClient from "@/lib/api/axiosClient";
import type { Product } from "@/types/product";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { SelectOption, selectStyles } from "@/lib/selectStyles";
import ReactSelect from "react-select";

const PER_PAGE_OPTIONS = [50, 100, 200, 300, 500] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function stockBadge(stock: number) {
  if (stock === 0) return <Badge tone="danger">Rupture</Badge>;
  if (stock < 10) return <Badge tone="warn">{stock} en stock</Badge>;
  return <Badge tone="neutral">{stock} en stock</Badge>;
}

// ─── Action dropdown ──────────────────────────────────────────────────────────

interface ActionMenuProps {
  product: Product;
  toggling: boolean;
  onToggle: () => void;
  onShare: () => void;
  onDelete: () => void;
}

function ActionMenu({ product, toggling, onToggle, onShare, onDelete }: ActionMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openMenu = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 4, right: window.innerWidth - r.right });
    }
    setOpen(true);
  };

  const close = () => setOpen(false);
  const run = (fn: () => void) => { fn(); close(); };

  const items = [
    {
      icon: Eye,
      label: "Voir",
      fn: () => router.push(`/products/${product.id}`),
      cls: "text-secondary hover:bg-slate-50",
    },
    {
      icon: Pencil,
      label: "Modifier",
      fn: () => router.push(`/products/${product.id}/edit`),
      cls: "text-secondary hover:bg-slate-50",
    },
    {
      icon: Power,
      label: product.isActive ? "Désactiver" : "Activer",
      fn: onToggle,
      cls: product.isActive
        ? "text-warn hover:bg-warn-soft"
        : "text-primary-dark hover:bg-primary-soft",
    },
    {
      icon: Link2,
      label: "Partager",
      fn: onShare,
      cls: "text-secondary hover:bg-slate-50",
    },
    {
      icon: Trash2,
      label: "Supprimer",
      fn: onDelete,
      cls: "text-danger hover:bg-danger-soft",
    },
  ];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        disabled={toggling}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-secondary disabled:opacity-50"
      >
        {toggling
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <MoreHorizontal className="h-4 w-4" />}
      </button>

      {open && typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={close} />
            <div
              className="fixed z-50 w-44 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg"
              style={{ top: pos.top, right: pos.right }}
            >
              {items.map(({ icon: Icon, label, fn, cls }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => run(fn)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium transition ${cls}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "id_desc" | "id_asc" | "name_asc" | "name_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "id_desc", label: "Récemment créés" },
  { value: "id_asc", label: "Plus anciens" },
  { value: "name_asc", label: "A → Z" },
  { value: "name_desc", label: "Z → A" },
];

interface ApiMeta {
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
  total: number;
  per_page: number;
}

interface ProductsResponse {
  data: Product[];
  meta: ApiMeta;
}

export default function ProductsList() {
  // ── Server state ──────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ApiMeta>({
    current_page: 1, last_page: 1, from: null, to: null, total: 0, per_page: 100,
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(100);

  // ── Actions state ─────────────────────────────────────────────────────────
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  // ── Client filters ────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("id_desc");

  // ── Fetch page ────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<ProductsResponse>("/v1/products", { params: { page, per_page: perPage } })
      .then(({ data }) => { setProducts(data.data); setMeta(data.meta); })
      .catch(() => setError("Impossible de charger les produits."))
      .finally(() => setLoading(false));
  }, [page, perPage]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleToggleActive = async (product: Product) => {
    setTogglingId(product.id);
    try {
      await axiosClient.patch(`/v1/products/${product.id}`, {
        is_active: !product.isActive,
      });
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, isActive: !p.isActive } : p)
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/v1/products/${deleteTarget.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = (product: Product) => {
    const url = `${STORE_URL}/products/${product.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  };

  // ── Client filter + sort ──────────────────────────────────────────────────
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = products.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchCat = catFilter === null || p.categoryId === catFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.isActive) ||
        (statusFilter === "inactive" && !p.isActive);
      return matchSearch && matchCat && matchStatus;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      if (sort === "id_asc") return a.id - b.id;
      return b.id - a.id;
    });
  }, [products, search, catFilter, statusFilter, sort]);

  // ── Columns (depend on action handlers → inside component) ────────────────
  const tableColumns = useMemo<Column<Product>[]>(() => [
    {
      cle: "nom",
      entete: "Produit",
      rendu: (p) => (
        <div className="flex items-center gap-3">
          <ProductThumbnail src={p.primaryImage} name={p.name} size="h-9 w-9" />
          <div>
            <p className="flex items-center gap-1.5 font-semibold text-secondary">
              {p.name}
              {p.isFeatured && <Star className="h-3.5 w-3.5 fill-warn text-warn" />}
            </p>
            <p className="text-xs text-slate-400">{p.sku}</p>
          </div>
        </div>
      ),
    },
    {
      cle: "cat",
      entete: "Catégorie",
      masquerMobile: true,
      rendu: (p) => p.category.name,
    },
    {
      cle: "prix",
      entete: "Prix",
      aligne: "right",
      rendu: (p) => (
        <div className="text-right">
          <p className="font-semibold text-secondary">{fcfa(p.price)}</p>
          {p.comparePrice && (
            <p className="text-xs text-slate-400 line-through">{fcfa(p.comparePrice)}</p>
          )}
        </div>
      ),
    },
    {
      cle: "stock",
      entete: "Stock",
      aligne: "center",
      masquerMobile: true,
      rendu: (p) => stockBadge(p.stockQuantity),
    },
    { cle: "statut", entete: "Statut", aligne: "right", rendu: (p) => <BadgeActif actif={p.isActive} /> },
    {
      cle: "actions",
      entete: "",
      aligne: "right",
      rendu: (p) => (
        <ActionMenu
          product={p}
          toggling={togglingId === p.id}
          onToggle={() => handleToggleActive(p)}
          onShare={() => handleShare(p)}
          onDelete={() => setDeleteTarget(p)}
        />
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [togglingId]);

  // ── Category options ──────────────────────────────────────────────────────
  const categoryOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of products) map.set(p.categoryId, p.category.name);
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [products]);

  if (error) return <ErrorAlert message={error} onRetry={fetchProducts} />;

  const isFiltering = search !== "" || catFilter !== null || statusFilter !== "all";

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          titre="Produits"
          sousTitre={
            loading ? "Chargement…"
            : isFiltering ? `${displayed.length} résultat${displayed.length !== 1 ? "s" : ""} sur la page`
            : `${meta.total} produit${meta.total !== 1 ? "s" : ""} au catalogue`
          }
          action={
            <Button href="/products/new">
              <Plus className="h-4 w-4" /> Ajouter un produit
            </Button>
          }
        />

        {/* ── Stat cards ────────────────────────────────────────────────── */}
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Produits actifs"
            valeur={String(products.filter((p) => p.isActive).length)}
            icon={<Package className="h-5 w-5" />}
            tone="primary"
          />
          <StatCard
            label="En rupture"
            valeur={String(products.filter((p) => p.stockQuantity === 0).length)}
            icon={<Package className="h-5 w-5" />}
            tone="danger"
          />
          <StatCard
            label="Catégories"
            valeur={String(categoryOptions.length)}
            icon={<Package className="h-5 w-5" />}
            tone="info"
          />
        </div>

        {/* ── Toolbar ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou SKU…"
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

          {/* Category */}
          <div className="w-56">
            <ReactSelect<SelectOption, false>
              value={categoryOptions.find((o) => o.value === catFilter) ?? null}
              onChange={(opt) => setCatFilter(opt?.value ?? null)}
              options={categoryOptions}
              placeholder="Toutes les catégories"
              isClearable
              noOptionsMessage={() => "Aucune catégorie"}
              styles={selectStyles}
            />
          </div>

          {/* Status */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-surface p-1 gap-1">
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

          {/* Per page */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3 h-10">
            <span className="text-sm text-slate-400 shrink-0">Afficher</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="h-full bg-transparent text-sm font-semibold text-secondary outline-none cursor-pointer"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <DataTable
            columns={tableColumns}
            rows={displayed}
          />
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {!loading && meta.total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {meta.from ?? "–"}–{meta.to ?? "–"} sur{" "}
              <span className="font-semibold text-secondary">{meta.total}</span>{" "}
              produit{meta.total !== 1 ? "s" : ""}
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
                {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
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
                disabled={page >= meta.last_page}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-surface text-slate-500 transition hover:bg-slate-50 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le produit</DialogTitle>
            <DialogDescription>
              Cette action est irréversible.{" "}
              <strong>{deleteTarget?.name}</strong> sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-bold text-white transition hover:opacity-80 disabled:opacity-60"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Supprimer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Copy toast ─────────────────────────────────────────────────────── */}
      {copyToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
          <Link2 className="h-4 w-4" />
          Lien copié dans le presse-papiers
        </div>
      )}
    </>
  );
}
