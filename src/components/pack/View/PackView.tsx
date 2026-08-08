"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  Hash,
  Layers,
  Loader2,
  Pencil,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";
import { ProductThumbnail } from "@/components/product/Thumbnail/ProductThumbnail";
import { PageHeader, Button, SectionCard, Badge } from "@/components/ui/primitives";
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
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { fcfa } from "@/lib/format";
import type { Pack } from "@/types/pack";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-slate-100">
      <span className="shrink-0 text-sm text-slate-400">{label}</span>
      <span className="text-right text-sm font-semibold text-secondary">{children}</span>
    </div>
  );
}

export default function PackView({ packId }: { packId: number }) {
  const router = useRouter();
  const { toast } = useToast();

  const [fetchKey, setFetchKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pack, setPack] = useState<Pack | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<Pack>(`/v1/packs/${packId}`)
      .then(({ data }) => setPack(data))
      .catch((err) => setError(handleApiError(err, "Impossible de charger le pack")))
      .finally(() => setLoading(false));
  }, [packId, fetchKey]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await axiosClient.delete(`/v1/packs/${packId}`);
      toast({ title: "Pack supprimé", description: `« ${pack?.name} » a été supprimé.` });
      router.push("/products/packs");
    } catch (err: any) {
      handleApiError(err);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  if (error)
    return (
      <ErrorAlert
        message={error}
        onRetry={() => { setError(null); setFetchKey((k) => k + 1); }}
      />
    );

  if (!pack) return null;

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <Button variant="secondary" href="/products/packs" className="!px-2.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            titre={pack.name}
            sousTitre="Détails du pack"
          />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" href={`/products/packs/${packId}/edit`}>
              <Pencil className="h-4 w-4" /> Modifier
            </Button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white"
            >
              <Trash2 className="h-4 w-4" /> Supprimer
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* ── Left column ── */}
          <div className="space-y-4 lg:col-span-2">

            {/* Cover image */}
            {pack.coverImage && (
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pack.coverImage}
                  alt={pack.name}
                  className="h-56 w-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            {pack.description && (
              <SectionCard title="Description">
                <p className="text-sm leading-relaxed text-slate-600">{pack.description}</p>
              </SectionCard>
            )}

            {/* Products */}
            <SectionCard
              title="Produits du pack"
              action={
                <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-dark">
                  {pack.productsCount} produit(s)
                </span>
              }
            >
              {pack.products.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">Aucun produit dans ce pack.</p>
              ) : (
                <ul className="space-y-2">
                  {pack.products.map((pp) => (
                    <li
                      key={pp.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5"
                    >
                      <ProductThumbnail
                        src={pp.product.primaryImage}
                        name={pp.product.name}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-secondary">
                          {pp.product.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {pp.product.category?.name} · {fcfa(pp.product.price)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {pp.discountPercent != null && pp.discountPercent > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-dark">
                            <Tag className="h-3 w-3" />
                            -{pp.discountPercent}%
                          </span>
                        )}
                        {pp.discountFixed != null && pp.discountFixed > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
                            <Tag className="h-3 w-3" />
                            -{fcfa(pp.discountFixed)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">
            <SectionCard title="Informations">
              <div className="divide-y divide-slate-100">
                <InfoRow label="Statut">
                  <BadgeActif actif={pack.isActive} />
                </InfoRow>
                <InfoRow label="Type">
                  <Badge tone={pack.type === "flash_sale" ? "warn" : "info"}>
                    {pack.type === "flash_sale" ? (
                      <><Zap className="h-3 w-3" /> Vente flash</>
                    ) : (
                      <><Layers className="h-3 w-3" /> Pack</>
                    )}
                  </Badge>
                </InfoRow>
                <InfoRow label="Actif actuellement">
                  <Badge tone={pack.isCurrentlyActive ? "primary" : "neutral"}>
                    {pack.isCurrentlyActive ? "Oui" : "Non"}
                  </Badge>
                </InfoRow>
                <InfoRow label={<span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />Ordre</span> as any}>
                  {pack.sortOrder}
                </InfoRow>
              </div>
            </SectionCard>

            <SectionCard title="Planification">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Début</p>
                    <p className="text-sm font-semibold text-secondary">
                      {pack.startsAt ? formatDate(pack.startsAt) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Expiration</p>
                    <p className="text-sm font-semibold text-secondary">
                      {pack.expiresAt ? formatDate(pack.expiresAt) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Métadonnées">
              <div className="divide-y divide-slate-100">
                <InfoRow label="Créé le">{formatDate(pack.createdAt)}</InfoRow>
                <InfoRow label="Mis à jour">{formatDate(pack.updatedAt)}</InfoRow>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le pack</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le pack{" "}
              <strong>« {pack.name} »</strong> sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirmDelete(false)}
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
