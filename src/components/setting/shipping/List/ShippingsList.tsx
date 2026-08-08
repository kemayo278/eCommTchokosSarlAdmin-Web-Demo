"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Pencil, Plus, Power, Trash2, Truck, Users } from "lucide-react";
import { PageHeader, SectionCard, Button, Badge } from "@/components/ui/primitives";
import { Field, Toggle } from "@/components/ui/Field";
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
import type { Zone } from "@/types/zone";

export default function ShippingsList() {
  const { toast } = useToast();

  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [gratuite, setGratuite] = useState(true);
  const [seuil, setSeuil] = useState("50000");

  const [toDelete, setToDelete] = useState<Zone | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchZones = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<Zone[]>("/v1/zones")
      .then(({ data }) => setZones(data))
      .catch((err) => setError(handleApiError(err, "Impossible de charger les zones")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  async function handleToggle(zone: Zone) {
    setTogglingId(zone.id);
    try {
      await axiosClient.put(`/v1/zones/${zone.id}`, {
        name: zone.name,
        description: zone.description,
        delivery_cost: zone.deliveryCost,
        is_active: !zone.isActive,
      });
      setZones((prev) =>
        prev.map((z) => (z.id === zone.id ? { ...z, isActive: !z.isActive } : z))
      );
      toast({
        title: zone.isActive ? "Zone désactivée" : "Zone activée",
        description: `« ${zone.name} » est maintenant ${zone.isActive ? "inactive" : "active"}.`,
      });
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/v1/zones/${toDelete.id}`);
      toast({ title: "Zone supprimée", description: `« ${toDelete.name} » a été supprimée.` });
      setZones((prev) => prev.filter((z) => z.id !== toDelete.id));
      setToDelete(null);
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          titre="Paramètres de livraison"
          sousTitre={
            loading ? "Chargement…" : `${zones.length} zone(s) de livraison`
          }
          action={
            <Button href="/settings/shipping/new">
              <Plus className="h-4 w-4" /> Ajouter une zone
            </Button>
          }
        />

        <SectionCard title="Livraison gratuite">
          <div className="space-y-4">
            <Toggle
              label="Activer la livraison gratuite"
              description="Au-delà d'un certain montant de commande"
              actif={gratuite}
              onChange={setGratuite}
            />
            {gratuite && (
              <div className="max-w-xs">
                <Field label="Seuil de commande" value={seuil} onChange={setSeuil} suffix="FCFA" type="number" />
              </div>
            )}
          </div>
        </SectionCard>

        <div>
          <h2 className="mb-3 font-bold tracking-tight text-secondary">Zones de livraison</h2>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorAlert message={error} onRetry={fetchZones} />
          ) : zones.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <MapPin className="mb-3 h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-500">Aucune zone configurée</p>
              <Button href="/settings/shipping/new" className="mt-4">
                <Plus className="h-4 w-4" /> Ajouter une zone
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">Zone</th>
                    <th className="hidden px-4 py-3 md:table-cell">Description</th>
                    <th className="hidden px-4 py-3 text-right md:table-cell">Frais</th>
                    <th className="hidden px-4 py-3 text-center md:table-cell">Livreurs</th>
                    <th className="px-4 py-3 text-center">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {zones.map((zone) => (
                    <tr key={zone.id} className="transition hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 font-semibold text-secondary">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          {zone.name}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                        {zone.description ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="hidden px-4 py-3 text-right md:table-cell">
                        {zone.deliveryCost != null ? (
                          <span className="inline-flex items-center gap-1 font-medium text-secondary">
                            <Truck className="h-3.5 w-3.5 text-slate-400" />
                            {zone.deliveryCost.toLocaleString("fr-FR")} F
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-center md:table-cell">
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          {zone.livreursCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge tone={zone.isActive ? "primary" : "neutral"}>
                          {zone.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle actif */}
                          <button
                            type="button"
                            onClick={() => handleToggle(zone)}
                            disabled={togglingId === zone.id}
                            title={zone.isActive ? "Désactiver" : "Activer"}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                              zone.isActive
                                ? "border border-warn/30 bg-warn-soft text-warn hover:bg-warn hover:text-white"
                                : "border border-primary/30 bg-primary-soft text-primary hover:bg-primary hover:text-white"
                            } disabled:opacity-50`}
                          >
                            {togglingId === zone.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Power className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Modifier */}
                          <a
                            href={`/settings/shipping/${zone.id}/edit`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-surface text-slate-500 transition hover:bg-slate-100 hover:text-secondary"
                            title="Modifier"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </a>

                          {/* Supprimer */}
                          <button
                            type="button"
                            onClick={() => setToDelete(zone)}
                            title="Supprimer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-danger/30 bg-danger-soft text-danger transition hover:bg-danger hover:text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete dialog ── */}
      <Dialog open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la zone</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La zone{" "}
              <strong>« {toDelete?.name} »</strong> sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setToDelete(null)}
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
