"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  CornerDownRight,
  FolderTree,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader, Button, Card } from "@/components/ui/primitives";
import { BadgeActif } from "@/components/ui/statuts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axiosClient from "@/lib/api/axiosClient";
import type { Category } from "@/types/category";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { handleApiError } from "@/lib/api/handleApiError";

type TreeNode = Category & { children: TreeNode[] };
type StatusFilter = "all" | "active" | "inactive";

function CategoryThumbnail({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <FolderTree className="h-4 w-4" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="h-9 w-9 shrink-0 rounded-lg object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    axiosClient
      .get<Category[]>("/v1/categories")
      .then(({ data }) => {
        setCategories(data);
        const rootIds = data
          .filter((c) => c.parentId === null)
          .map((c) => c.id);
        setCollapsedIds(new Set(rootIds.slice(0, 2)));
      })
      .catch((err) => {
        const message = handleApiError(err, "Erreur lors du chargement des catégories");
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  const categoryTree = useMemo(() => {
    const nodesByParent = new Map<number | null, Category[]>();

    for (const category of categories) {
      const siblings = nodesByParent.get(category.parentId) ?? [];
      siblings.push(category);
      nodesByParent.set(category.parentId, siblings);
    }

    for (const siblings of nodesByParent.values()) {
      siblings.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    }

    const buildTree = (parentId: number | null): TreeNode[] => {
      const children = nodesByParent.get(parentId) ?? [];
      return children.map((child) => ({
        ...child,
        children: buildTree(child.id),
      }));
    };

    return buildTree(null);
  }, [categories]);

  const categoryPathMap = useMemo(() => {
    const idMap = new Map<number, Category>();
    for (const c of categories) idMap.set(c.id, c);

    const getPath = (c: Category): string => {
      if (c.parentId === null) return c.name;
      const parent = idMap.get(c.parentId);
      return parent ? `${getPath(parent)} / ${c.name}` : c.name;
    };

    const map = new Map<number, string>();
    for (const c of categories) map.set(c.id, getPath(c));
    return map;
  }, [categories]);

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  const filteredCategories = useMemo(() => {
    if (!isFiltering) return [];
    const q = search.trim().toLowerCase();
    return categories.filter((c) => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.isActive) ||
        (statusFilter === "inactive" && !c.isActive);
      return matchSearch && matchStatus;
    });
  }, [categories, search, statusFilter, isFiltering]);

  function toggleCollapse(id: number) {
    setCollapsedIds((prev: Set<number>) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setCollapsedIds(new Set());
  }

  function collapseAll() {
    setCollapsedIds(new Set(categories.map((c) => c.id)));
  }

  const collectDescendantIds = (id: number) => {
    const childMap = new Map<number | null, Category[]>();

    for (const category of categories) {
      const siblings = childMap.get(category.parentId) ?? [];
      siblings.push(category);
      childMap.set(category.parentId, siblings);
    }

    const ids = new Set<number>([id]);
    const stack = [id];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (currentId === undefined) continue;
      const children = childMap.get(currentId) ?? [];
      for (const child of children) {
        if (ids.has(child.id)) continue;
        ids.add(child.id);
        stack.push(child.id);
      }
    }

    return ids;
  };

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/v1/categories/${deleteTarget.id}`);
      const idsToRemove = collectDescendantIds(deleteTarget.id);
      setCategories((prev) => prev.filter((category) => !idsToRemove.has(category.id)));
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        idsToRemove.forEach((id) => next.delete(id));
        return next;
      });
      setDeleteTarget(null);
    } catch (err: any) {
      const message = handleApiError(err);
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  const CategoryRow = ({ category, depth }: { category: TreeNode; depth: number }) => {
    const expanded = !collapsedIds.has(category.id);

    return (
      <div className={depth > 0 ? "ml-6" : ""}>
        <Card className="overflow-hidden">
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ paddingLeft: `${20 + depth * 10}px` }}
          >
            <button
              type="button"
              onClick={() => category.children.length > 0 && toggleCollapse(category.id)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark"
            >
              {category.children.length > 0 ? (
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              ) : (
                <CornerDownRight className="h-5 w-5" />
              )}
            </button>

            <CategoryThumbnail src={category.imageUrl ?? null} name={category.name} />

            <div className="min-w-0 flex-1">
              <p className="font-bold text-secondary">{category.name}</p>
              <p className="text-xs text-slate-400">
                /{category.slug}
                {category.children.length > 0 &&
                  ` · ${category.children.length} sous-catégorie${category.children.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <BadgeActif actif={category.isActive} />
              <Link
                href={`/products/categories/${category.id}/edit`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-secondary"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setDeleteTarget(category)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>

        {category.children.length > 0 && expanded && (
          <div className="mt-2 space-y-2">
            {category.children.map((child) => (
              <CategoryRow key={child.id} category={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const FlatRow = ({ category }: { category: Category }) => {
    const path = categoryPathMap.get(category.id) ?? category.name;
    const parts = path.split(" / ");
    return (
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4">
          <CategoryThumbnail src={category.imageUrl ?? null} name={category.name} />

          <div className="min-w-0 flex-1">
            <p className="font-bold text-secondary">{category.name}</p>
            <p className="text-xs text-slate-400">
              {parts.length > 1 && (
                <span className="mr-1.5 text-slate-300">{parts.slice(0, -1).join(" / ")} /</span>
              )}
              /{category.slug}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <BadgeActif actif={category.isActive} />
            <Link
              href={`/products/categories/${category.id}/edit`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-secondary"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setDeleteTarget(category as unknown as TreeNode)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={() => { fetchCategories(); }} />;
  }

  const displayCount = isFiltering ? filteredCategories.length : categories.length;
  const sousTitre = isFiltering
    ? `${displayCount} résultat${displayCount !== 1 ? "s" : ""} sur ${categories.length}`
    : `${categories.length} catégorie${categories.length !== 1 ? "s" : ""}`;

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          titre="Catégories"
          sousTitre={sousTitre}
          action={
            <Button href="/products/categories/new">
              <Plus className="h-4 w-4" /> Nouvelle catégorie
            </Button>
          }
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-50">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou slug…"
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

          {/* Status filter */}
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

          {/* Expand / collapse — tree mode only */}
          {!isFiltering && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={expandAll}
                title="Développer tout"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-surface text-slate-500 transition hover:bg-slate-50 hover:text-secondary"
              >
                <ChevronsUpDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={collapseAll}
                title="Réduire tout"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-surface text-slate-500 transition hover:bg-slate-50 hover:text-secondary"
              >
                <ChevronsDownUp className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* List */}
        <div className="space-y-3">
          {isFiltering ? (
            filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => <FlatRow key={cat.id} category={cat} />)
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">
                Aucune catégorie ne correspond à votre recherche.
              </p>
            )
          ) : categoryTree.length > 0 ? (
            categoryTree.map((cat) => <CategoryRow key={cat.id} category={cat} depth={0} />)
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">
              Aucune catégorie pour le moment.
            </p>
          )}
        </div>
      </div>

      {/* Delete dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la catégorie</DialogTitle>
            <DialogDescription>
              Cette action est irréversible.{" "}
              <strong>{deleteTarget?.name}</strong>
              {deleteTarget?.parentId === null &&
                " et toutes ses sous-catégories"}{" "}
              seront définitivement supprimées.
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
              Confirmer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
