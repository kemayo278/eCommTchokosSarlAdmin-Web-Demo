"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  Loader2,
  Pencil,
  Percent,
  ShoppingBag,
  Ticket,
  Trash2,
} from "lucide-react";
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
import type { Coupon } from "@/types/coupon";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
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

export default function PromotionView({ couponId }: { couponId: number }) {
  const router = useRouter();
  const { toast } = useToast();

  const [fetchKey, setFetchKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<Coupon>(`/v1/coupons/${couponId}`)
      .then(({ data }) => setCoupon(data))
      .catch((err) => setError(handleApiError(err, "Impossible de charger la promotion")))
      .finally(() => setLoading(false));
  }, [couponId, fetchKey]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await axiosClient.delete(`/v1/coupons/${couponId}`);
      toast({
        title: "Promotion supprimée",
        description: `Le coupon « ${coupon?.code} » a été supprimé.`,
      });
      router.push("/products/promotions");
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
        onRetry={() => {
          setError(null);
          setFetchKey((k) => k + 1);
        }}
      />
    );

  if (!coupon) return null;

  const isPercentage = coupon.type === "percentage";

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" href="/products/promotions" className="px-2.5!">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            titre={coupon.code}
            sousTitre="Détails du coupon de réduction"
          />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" href={`/products/promotions/${couponId}/edit`}>
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
            <SectionCard
              title="Produits concernés"
              action={
                coupon.appliesToAllProducts ? (
                  <Badge tone="info">Toute la boutique</Badge>
                ) : (
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-dark">
                    {coupon.products.length} produit(s)
                  </span>
                )
              }
            >
              {coupon.appliesToAllProducts ? (
                <div className="flex items-center gap-3 py-3 text-sm text-slate-500">
                  <ShoppingBag className="h-5 w-5 shrink-0 text-slate-300" />
                  Ce coupon s'applique à tous les produits de la boutique.
                </div>
              ) : coupon.products.length === 0 ? (
                <p className="py-3 text-sm text-slate-400">Aucun produit associé.</p>
              ) : (
                <ul className="space-y-2">
                  {coupon.products.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <Ticket className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-semibold text-secondary">{p.name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">
            <SectionCard title="Réduction">
              <div className="divide-y divide-slate-100">
                <InfoRow label="Statut">
                  <BadgeActif actif={coupon.isActive} />
                </InfoRow>
                <InfoRow label="Type">
                  <Badge tone={isPercentage ? "primary" : "warn"}>
                    {isPercentage ? "Pourcentage" : "Montant fixe"}
                  </Badge>
                </InfoRow>
                <InfoRow label="Valeur">
                  {isPercentage ? (
                    <span className="flex items-center gap-1">
                      <Percent className="h-3.5 w-3.5 text-slate-400" />
                      {coupon.value} %
                    </span>
                  ) : (
                    fcfa(coupon.value)
                  )}
                </InfoRow>
                {coupon.minOrderAmount > 0 && (
                  <InfoRow label="Min. commande">{fcfa(coupon.minOrderAmount)}</InfoRow>
                )}
                <InfoRow label="Utilisations">
                  {coupon.usedCount} / {coupon.maxUses ?? "∞"}
                </InfoRow>
              </div>
            </SectionCard>

            <SectionCard title="Validité">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Début</p>
                    <p className="text-sm font-semibold text-secondary">
                      {coupon.startsAt ? formatDate(coupon.startsAt) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Expiration</p>
                    <p className="text-sm font-semibold text-secondary">
                      {coupon.expiresAt ? formatDate(coupon.expiresAt) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Métadonnées">
              <div className="divide-y divide-slate-100">
                <InfoRow label="Créé le">{formatDate(coupon.createdAt)}</InfoRow>
                <InfoRow label="Mis à jour">{formatDate(coupon.updatedAt)}</InfoRow>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* ── Delete dialog ── */}
      <Dialog
        open={confirmDelete}
        onOpenChange={(o) => {
          if (!o) setConfirmDelete(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la promotion</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le coupon{" "}
              <strong>« {coupon.code} »</strong> sera définitivement supprimé.
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
