"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader, Badge, Button } from "@/components/ui/primitives";
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
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { HeroImage } from "@/types/heroimage";

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

interface ActionMenuProps {
  hero: HeroImage;
  toggling: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

function ActionMenu({ hero, toggling, onToggle, onDelete }: ActionMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openMenu = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen(true);
  };

  const close = () => setOpen(false);
  const run = (fn: () => void) => { fn(); close(); };

  const items = [
    {
      icon: Pencil,
      label: "Modifier",
      fn: () => router.push(`/settings/hero-images/${hero.id}/edit`),
      cls: "text-secondary hover:bg-slate-50",
    },
    {
      icon: hero.isActive ? EyeOff : Eye,
      label: hero.isActive ? "Désactiver" : "Activer",
      fn: onToggle,
      cls: hero.isActive
        ? "text-warn hover:bg-warn-soft"
        : "text-primary-dark hover:bg-primary-soft",
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
              className="fixed z-50 w-40 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg"
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function HeroImagesList() {
  const [heroes, setHeroes] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHeroes = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<HeroImage[]>("/v1/hero-images")
      .then(({ data }) => setHeroes(data))
      .catch((err) => setError(handleApiError(err, "Impossible de charger les héros images.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchHeroes(); }, [fetchHeroes]);

  const handleToggle = async (hero: HeroImage) => {
    setTogglingId(hero.id);
    try {
      await axiosClient.patch(`/v1/hero-images/${hero.id}`, { is_active: !hero.isActive });
      setHeroes((prev) =>
        prev.map((h) => h.id === hero.id ? { ...h, isActive: !h.isActive } : h)
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/v1/hero-images/${deleteTarget.id}`);
      setHeroes((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<Column<HeroImage>[]>(() => [
    {
      cle: "image",
      entete: "Image",
      rendu: (h) => (
        <div className="h-14 w-24 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center">
          {h.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={h.imageUrl}
              alt={h.title ?? "Hero"}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-slate-300" />
          )}
        </div>
      ),
    },
    {
      cle: "content",
      entete: "Titre / Sous-titre",
      rendu: (h) => (
        <div>
          <p className="font-semibold text-secondary">{h.title ?? <span className="text-slate-400 italic">Sans titre</span>}</p>
          {h.subtitle && <p className="text-xs text-slate-400 mt-0.5">{h.subtitle}</p>}
        </div>
      ),
    },
    {
      cle: "link",
      entete: "Lien",
      masquerMobile: true,
      rendu: (h) =>
        h.link ? (
          <span className="max-w-[180px] truncate block text-sm text-primary">{h.link}</span>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        ),
    },
    {
      cle: "periode",
      entete: "Période",
      masquerMobile: true,
      rendu: (h) => {
        const start = formatDate(h.startsAt);
        const end = formatDate(h.expiresAt);
        if (!start && !end) return <Badge tone="neutral">Toujours</Badge>;
        return (
          <span className="text-xs text-slate-500">
            {start ?? "∞"} → {end ?? "∞"}
          </span>
        );
      },
    },
    {
      cle: "order",
      entete: "Ordre",
      aligne: "center",
      masquerMobile: true,
      rendu: (h) => (
        <div className="flex items-center justify-center gap-1.5 text-slate-500">
          <GripVertical className="h-3.5 w-3.5 text-slate-300" />
          <span className="text-sm font-semibold">{h.sortOrder}</span>
        </div>
      ),
    },
    {
      cle: "statut",
      entete: "Statut",
      aligne: "right",
      rendu: (h) => <BadgeActif actif={h.isActive} />,
    },
    {
      cle: "actions",
      entete: "",
      aligne: "right",
      rendu: (h) => (
        <ActionMenu
          hero={h}
          toggling={togglingId === h.id}
          onToggle={() => handleToggle(h)}
          onDelete={() => setDeleteTarget(h)}
        />
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [togglingId]);

  if (error) return <ErrorAlert message={error} onRetry={fetchHeroes} />;

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          titre="Héros images"
          sousTitre={
            loading
              ? "Chargement…"
              : `${heroes.length} image${heroes.length !== 1 ? "s" : ""} configurée${heroes.length !== 1 ? "s" : ""}`
          }
          action={
            <Button href="/settings/hero-images/new">
              <Plus className="h-4 w-4" /> Ajouter une image
            </Button>
          }
        />

        {loading ? (
          <LoadingSpinner />
        ) : heroes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <ImageIcon className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-500">Aucune hero image pour le moment</p>
            <p className="text-sm text-slate-400">Ajoutez une image pour la bannière de votre site.</p>
          </div>
        ) : (
          <DataTable columns={columns} rows={heroes} />
        )}
      </div>

      {/* ── Delete dialog ── */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;image</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L&apos;image héro sera définitivement supprimée.
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
    </>
  );
}
