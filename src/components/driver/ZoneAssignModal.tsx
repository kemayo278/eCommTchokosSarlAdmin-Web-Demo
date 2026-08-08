"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Plus, PlusCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { Zone } from "@/types/zone";

interface DriverZone {
  id: number;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  driverId: number;
  driverName: string;
  currentZones: DriverZone[];
  onZonesChanged: (driverId: number, zones: DriverZone[]) => void;
}

export default function ZoneAssignModal({
  open,
  onClose,
  driverId,
  driverName,
  currentZones,
  onZonesChanged,
}: Props) {
  const { toast } = useToast();
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [assigningAll, setAssigningAll] = useState(false);
  const [localZones, setLocalZones] = useState<DriverZone[]>(currentZones);

  useEffect(() => {
    setLocalZones(currentZones);
  }, [currentZones]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    axiosClient
      .get<Zone[]>("/v1/zones")
      .then(({ data }) => setAllZones(data.filter((z) => z.isActive)))
      .catch((err) => handleApiError(err, "Impossible de charger les zones"))
      .finally(() => setLoading(false));
  }, [open]);

  const assignedIds = new Set(localZones.map((z) => z.id));
  const availableZones = allZones.filter((z) => !assignedIds.has(z.id));

  async function handleAssign(zone: Zone) {
    setAssigningId(zone.id);
    try {
      await axiosClient.post(`/v1/zones/${zone.id}/assign-livreur`, {
        user_id: driverId,
      });
      const updated = [...localZones, { id: zone.id, name: zone.name }];
      setLocalZones(updated);
      onZonesChanged(driverId, updated);
      toast({ title: "Zone assignée", description: `« ${zone.name} » a été assignée à ${driverName}.` });
    } catch (err: any) {
      handleApiError(err, "Impossible d'assigner la zone");
    } finally {
      setAssigningId(null);
    }
  }

  async function handleAssignAll() {
    if (availableZones.length === 0 || assigningAll) return;
    setAssigningAll(true);
    const toAssign = [...availableZones];
    const results = await Promise.allSettled(
      toAssign.map((z) =>
        axiosClient
          .post(`/v1/zones/${z.id}/assign-livreur`, { user_id: driverId })
          .then(() => ({ id: z.id, name: z.name }))
      )
    );
    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<DriverZone> => r.status === "fulfilled")
      .map((r) => r.value);
    if (succeeded.length > 0) {
      const updated = [...localZones, ...succeeded];
      setLocalZones(updated);
      onZonesChanged(driverId, updated);
      toast({
        title: "Zones assignées",
        description: `${succeeded.length} zone(s) assignée(s) à ${driverName}.`,
      });
    }
    const failedCount = results.filter((r) => r.status === "rejected").length;
    if (failedCount > 0) {
      toast({ title: `${failedCount} zone(s) en erreur`, variant: "destructive" });
    }
    setAssigningAll(false);
  }

  async function handleRemove(zone: DriverZone) {
    setRemovingId(zone.id);
    try {
      await axiosClient.delete(`/v1/zones/${zone.id}/livreurs/${driverId}`);
      const updated = localZones.filter((z) => z.id !== zone.id);
      setLocalZones(updated);
      onZonesChanged(driverId, updated);
      toast({ title: "Zone retirée", description: `« ${zone.name} » a été retirée de ${driverName}.` });
    } catch (err: any) {
      handleApiError(err, "Impossible de retirer la zone");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Zones de {driverName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-5">
            {/* Assigned zones */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Zones assignées
              </p>
              {localZones.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune zone assignée</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {localZones.map((z) => (
                    <span
                      key={z.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary-dark"
                    >
                      <MapPin className="h-3 w-3" />
                      {z.name}
                      <button
                        type="button"
                        onClick={() => handleRemove(z)}
                        disabled={removingId === z.id}
                        className="ml-0.5 rounded-full text-primary-dark/60 transition hover:text-danger disabled:opacity-40"
                        aria-label={`Retirer ${z.name}`}
                      >
                        {removingId === z.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Available zones */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Zones disponibles
                </p>
                {availableZones.length > 1 && (
                  <button
                    type="button"
                    onClick={handleAssignAll}
                    disabled={assigningAll}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:underline disabled:opacity-40"
                  >
                    {assigningAll ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <PlusCircle className="h-3 w-3" />
                    )}
                    Toutes assigner
                  </button>
                )}
              </div>
              {availableZones.length === 0 ? (
                <p className="text-sm text-slate-400">Toutes les zones sont déjà assignées</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableZones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => handleAssign(z)}
                      disabled={assigningId === z.id || assigningAll}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-surface px-3 py-1 text-sm font-semibold text-slate-600 transition hover:border-primary hover:bg-primary-soft hover:text-primary-dark disabled:opacity-40"
                    >
                      {assigningId === z.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      {z.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
