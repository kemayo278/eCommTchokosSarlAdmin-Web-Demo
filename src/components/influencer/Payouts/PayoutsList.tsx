"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { PageHeader, SectionCard, Badge } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
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
import { fcfa } from "@/lib/format";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import type { PayoutRequest } from "@/types/influencer";

type ProcessStatus = "completed" | "cancelled";

interface ProcessModal {
  payout: PayoutRequest;
  action: ProcessStatus;
}

function StatusBadge({ status }: { status: PayoutRequest["status"] }) {
  if (status === "completed") return <Badge tone="primary">Payé</Badge>;
  if (status === "cancelled") return <Badge tone="danger">Annulé</Badge>;
  return <Badge tone="warn">En attente</Badge>;
}

export default function PayoutsList() {
  const { toast } = useToast();

  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [modal, setModal] = useState<ProcessModal | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchPayouts = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<{ data: PayoutRequest[]; current_page: number; last_page: number; total: number }>(
        "/v1/influencer/payouts/all",
        { params: { page } }
      )
      .then(({ data }) => {
        setPayouts(data.data);
        setLastPage(data.last_page);
        setTotal(data.total);
      })
      .catch((err) => setError(handleApiError(err, "Impossible de charger les demandes")))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  function openModal(payout: PayoutRequest, action: ProcessStatus) {
    setNotes("");
    setModal({ payout, action });
  }

  async function handleProcess() {
    if (!modal) return;
    setProcessing(true);
    try {
      await axiosClient.post(`/influencer/payouts/${modal.payout.id}/process`, {
        status: modal.action,
        notes: notes || undefined,
      });
      setPayouts((prev) =>
        prev.map((p) =>
          p.id === modal.payout.id ? { ...p, status: modal.action, notes } : p
        )
      );
      toast({
        title: modal.action === "completed" ? "Retrait approuvé" : "Retrait annulé",
        description:
          modal.action === "completed"
            ? `Paiement confirmé pour ${modal.payout.influencer.name}.`
            : `Demande annulée — points remboursés.`,
      });
      setModal(null);
    } catch (err: any) {
      handleApiError(err, "Impossible de traiter la demande");
    } finally {
      setProcessing(false);
    }
  }

  const columns: Column<PayoutRequest>[] = [
    {
      cle: "influencer",
      entete: "Influenceur",
      rendu: (p) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-secondary">{p.influencer.name}</p>
          <p className="truncate text-xs text-slate-400">{p.influencer.email}</p>
        </div>
      ),
    },
    {
      cle: "amount",
      entete: "Montant",
      rendu: (p) => <Badge tone="info">{fcfa(p.amount)}</Badge>,
    },
    {
      cle: "createdAt",
      entete: "Date",
      masquerMobile: true,
      rendu: (p) => (
        <span className="text-sm text-slate-500">
          {new Date(p.createdAt).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      cle: "status",
      entete: "Statut",
      aligne: "center",
      rendu: (p) => <StatusBadge status={p.status} />,
    },
    {
      cle: "id",
      entete: "Actions",
      aligne: "right",
      rendu: (p) =>
        p.status === "pending" ? (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => openModal(p, "completed")}
              className="flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-dark transition hover:bg-primary hover:text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approuver
            </button>
            <button
              type="button"
              onClick={() => openModal(p, "cancelled")}
              className="flex items-center gap-1.5 rounded-lg bg-danger-soft px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger hover:text-white"
            >
              <XCircle className="h-3.5 w-3.5" /> Annuler
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">{p.notes ?? "—"}</span>
        ),
    },
  ];

  if (error) return <ErrorAlert message={error} onRetry={fetchPayouts} />;

  const pending = payouts.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Demandes de retrait"
        sousTitre={
          loading
            ? "Chargement…"
            : `${pending} demande(s) en attente · ${total} au total`
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : payouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <CheckCircle2 className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-500">Aucune demande de retrait</p>
        </div>
      ) : (
        <DataTable columns={columns} rows={payouts} />
      )}

      {/* ── Pagination ── */}
      {!loading && lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page <span className="font-semibold text-secondary">{page}</span> sur{" "}
            <span className="font-semibold text-secondary">{lastPage}</span>
            {" · "}{total} demande(s)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-surface text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= lastPage}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-surface text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Process modal ── */}
      <Dialog open={!!modal} onOpenChange={(v) => { if (!v) setModal(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {modal?.action === "completed" ? "Approuver le retrait" : "Annuler le retrait"}
            </DialogTitle>
            <DialogDescription>
              {modal?.action === "completed"
                ? `Confirmer le paiement de ${fcfa(modal?.payout.amount ?? 0)} à ${modal?.payout.influencer.name}.`
                : `Annuler la demande de ${modal?.payout.influencer.name}. Les points seront automatiquement remboursés.`}
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-secondary">
              Note <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={
                modal?.action === "completed"
                  ? "Ex : Paiement envoyé via Orange Money"
                  : "Ex : Coordonnées invalides"
              }
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-secondary placeholder:text-slate-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setModal(null)}
              disabled={processing}
              className="flex-1 rounded-xl border border-slate-200 bg-surface py-2 text-sm font-semibold text-secondary transition hover:bg-slate-50 disabled:opacity-40"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleProcess}
              disabled={processing}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 ${
                modal?.action === "completed" ? "bg-primary" : "bg-danger"
              }`}
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              {modal?.action === "completed" ? "Confirmer" : "Annuler le retrait"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
