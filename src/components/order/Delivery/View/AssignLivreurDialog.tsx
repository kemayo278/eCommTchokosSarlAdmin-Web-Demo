"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Phone, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axiosClient from "@/lib/api/axiosClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/types/user";

const AVATAR_COLORS = [
  "bg-primary text-white",
  "bg-info-soft text-info",
  "bg-warn-soft text-warn",
  "bg-danger-soft text-danger",
  "bg-primary-soft text-primary-dark",
];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

function initiales(name: string) {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface Props {
  deliveryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AssignLivreurDialog({
  deliveryId,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const { toast } = useToast();

  const [drivers, setDrivers]           = useState<User[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [search, setSearch]             = useState("");
  const [selectedId, setSelectedId]     = useState<number | null>(null);
  const [assigning, setAssigning]       = useState(false);

  const loadDrivers = useCallback(() => {
    setLoadingDrivers(true);
    axiosClient
      .get<{ data: User[] } | User[]>("/v1/admin/users", {
        params: { per_page: 100, role: "livreur" },
      })
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.data;
        setDrivers(list.filter((u) => u.roles.includes("livreur") && u.isActive));
      })
      .catch(() => setDrivers([]))
      .finally(() => setLoadingDrivers(false));
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setSearch("");
      loadDrivers();
    }
  }, [open, loadDrivers]);

  const handleAssign = async () => {
    if (selectedId === null) return;
    setAssigning(true);
    try {
      await axiosClient.post(`/v1/deliveries/${deliveryId}/assign`, {
        livreur_id: selectedId,
      });
      const driver = drivers.find((d) => d.id === selectedId);
      toast({
        title: "Livreur assigné",
        description: `${driver?.name ?? "Le livreur"} a été affecté à cette livraison.`,
      });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description:
          err?.response?.data?.message ?? "Impossible d'assigner le livreur.",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const filtered = (() => {
    const q = search.trim().toLowerCase();
    return drivers.filter(
      (d) =>
        !q ||
        d.name.toLowerCase().includes(q) ||
        (d.phone ?? "").includes(q) ||
        d.zones.some((z) => z.name.toLowerCase().includes(q))
    );
  })();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assigner un livreur</DialogTitle>
          <DialogDescription>
            Sélectionnez un livreur actif pour prendre en charge cette livraison.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, téléphone, zone…"
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

        {/* Driver list */}
        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100">
          {loadingDrivers ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">
              Aucun livreur disponible
            </p>
          ) : (
            filtered.map((driver) => (
              <button
                key={driver.id}
                type="button"
                onClick={() => setSelectedId(driver.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  selectedId === driver.id
                    ? "bg-primary-soft ring-1 ring-inset ring-primary/30"
                    : ""
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(driver.id)}`}
                >
                  {initiales(driver.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-secondary">
                    {driver.name}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-slate-400">
                    {driver.phone && (
                      <span className="flex items-center gap-0.5">
                        <Phone className="h-3 w-3" />
                        {driver.phone}
                      </span>
                    )}
                    {driver.zones.length > 0 && (
                      <span>· {driver.zones.map((z) => z.name).join(", ")}</span>
                    )}
                  </p>
                </div>
                {selectedId === driver.id && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            ))
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={assigning}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={selectedId === null || assigning}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {assigning && <Loader2 className="h-4 w-4 animate-spin" />}
            Assigner
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
