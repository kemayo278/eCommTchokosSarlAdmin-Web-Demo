"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Loader2, MessageSquare, Star } from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: number;
  userId: number;
  user: { id: number; name: string };
  productId: number;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-warn text-warn" : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
      <span className="ml-1.5 text-xs font-semibold text-slate-500">{rating}/5</span>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AvisPage() {
  const { toast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toApprove, setToApprove] = useState<Review | null>(null);
  const [approving, setApproving] = useState(false);

  const fetchReviews = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<Review[]>("/v1/admin/reviews/pending")
      .then(({ data }) => setReviews(Array.isArray(data) ? data : (data as any).data ?? []))
      .catch((err) => setError(handleApiError(err, "Impossible de charger les avis")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleApprove = async () => {
    if (!toApprove) return;
    setApproving(true);
    try {
      await axiosClient.patch(`/v1/admin/reviews/${toApprove.id}/approve`);
      toast({
        title: "Avis approuvé",
        description: `L'avis de ${toApprove.user.name} a été publié.`,
      });
      setReviews((prev) => prev.filter((r) => r.id !== toApprove.id));
      setToApprove(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Impossible d'approuver l'avis.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setApproving(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          titre="Avis en attente"
          sousTitre={
            loading
              ? "Chargement…"
              : `${reviews.length} avis en attente de modération`
          }
        />

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorAlert message={error} onRetry={fetchReviews} />
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <MessageSquare className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-500">Aucun avis en attente</p>
            <p className="mt-1 text-sm text-slate-400">Tous les avis ont été modérés.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-slate-100 bg-surface p-5 transition hover:border-slate-200"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left — content */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={review.rating} />
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">
                        Produit #{review.productId}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    <div>
                      <p className="font-semibold text-secondary">{review.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500 line-clamp-3">
                        {review.body}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white">
                        {review.user.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-slate-600">
                        {review.user.name}
                      </span>
                    </div>
                  </div>

                  {/* Right — action */}
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setToApprove(review)}
                      className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approuver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Dialog de confirmation ─────────────────────────────────────────── */}
      <Dialog open={!!toApprove} onOpenChange={(o) => { if (!o) setToApprove(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver l'avis</DialogTitle>
            <DialogDescription>
              Cet avis de{" "}
              <strong>{toApprove?.user.name}</strong> sera publié et visible
              sur la page du produit. Cette action est immédiate.
            </DialogDescription>
          </DialogHeader>

          {toApprove && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1.5">
              <Stars rating={toApprove.rating} />
              <p className="text-sm font-semibold text-secondary">{toApprove.title}</p>
              <p className="text-xs leading-relaxed text-slate-500 line-clamp-4">
                {toApprove.body}
              </p>
            </div>
          )}

          <DialogFooter>
            <button
              onClick={() => setToApprove(null)}
              disabled={approving}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {approving && <Loader2 className="h-4 w-4 animate-spin" />}
              Approuver
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
