"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { PageHeader, Badge } from "@/components/ui/primitives";
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
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import ZoneAssignModal from "@/components/driver/ZoneAssignModal";
import type { User, UserMeta, UsersResponse } from "@/types/user";

const PER_PAGE_OPTIONS = [20, 50, 100] as const;

const AVATAR_COLORS = [
  "bg-primary text-white", "bg-info-soft text-info", "bg-warn-soft text-warn",
  "bg-danger-soft text-danger", "bg-primary-soft text-primary-dark",
];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

type StatusFilter = "all" | "active" | "inactive";

interface DriverZone { id: number; name: string; }

function buildColumns(
  onEditZones: (driver: User) => void,
  onDelete: (driver: User) => void,
): Column<User>[] {
  return [
    {
      cle: "name",
      entete: "Livreur",
      rendu: (u) => (
        <div className="flex items-center gap-3">
          {u.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.avatar} alt={u.name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(u.id)}`}>
              {initials(u.name)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-secondary">{u.name}</p>
            <p className="truncate text-xs text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      cle: "phone",
      entete: "Téléphone",
      masquerMobile: true,
      rendu: (u) => (
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          {u.phone ? (
            <>
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {u.phone}
            </>
          ) : "—"}
        </span>
      ),
    },
    {
      cle: "zones",
      entete: "Zones",
      masquerMobile: true,
      rendu: (u) => {
        const visible = u.zones.slice(0, 2);
        const extra = u.zones.length - visible.length;
        return (
          <div className="flex flex-wrap items-center gap-1">
            {u.zones.length > 0 ? (
              <>
                {visible.map((z) => (
                  <span
                    key={z.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-dark"
                  >
                    <MapPin className="h-3 w-3" />
                    {z.name}
                  </span>
                ))}
                {extra > 0 && (
                  <span
                    className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500"
                    title={u.zones.slice(2).map((z) => z.name).join(", ")}
                  >
                    +{extra}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-slate-300">—</span>
            )}
            <button
              type="button"
              onClick={() => onEditZones(u)}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-400 transition hover:border-primary hover:bg-primary-soft hover:text-primary"
              title="Gérer les zones"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        );
      },
    },
    {
      cle: "maxSelfAssignDeliveries",
      entete: "Max livraisons",
      aligne: "center",
      masquerMobile: true,
      rendu: (u) => (
        <Badge tone={u.maxSelfAssignDeliveries > 0 ? "info" : "neutral"}>
          {u.maxSelfAssignDeliveries}
        </Badge>
      ),
    },
    {
      cle: "isActive",
      entete: "Statut",
      aligne: "center",
      rendu: (u) => <BadgeActif actif={u.isActive} />,
    },
    {
      cle: "id",
      entete: "",
      aligne: "right",
      rendu: (u) => (
        <button
          type="button"
          onClick={() => onDelete(u)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-danger-soft hover:text-danger"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];
}

export default function DriversList() {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<UserMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [zoneModal, setZoneModal] = useState<User | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDrivers = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<UsersResponse | User[]>("/v1/admin/users", {
        params: { page, per_page: perPage, role: "livreur" },
      })
      .then(({ data }) => {
        if (Array.isArray(data)) {
          const drivers = data.filter((u) => u.roles.includes("livreur"));
          setUsers(drivers);
          setMeta({ current_page: 1, last_page: 1, per_page: drivers.length, total: drivers.length });
        } else {
          const drivers = data.data.filter((u) => u.roles.includes("livreur"));
          setUsers(drivers);
          setMeta(data.meta);
        }
      })
      .catch((err) => setError(handleApiError(err, "Impossible de charger les livreurs")))
      .finally(() => setLoading(false));
  }, [page, perPage]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/v1/admin/users/${toDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== toDelete.id));
      setMeta((m) => ({ ...m, total: m.total - 1 }));
      toast({ title: "Livreur supprimé", description: `« ${toDelete.name} » a été supprimé.` });
      setToDelete(null);
    } catch (err: any) {
      handleApiError(err, "Impossible de supprimer le livreur");
    } finally {
      setDeleting(false);
    }
  }

  function handleZonesChanged(driverId: number, zones: DriverZone[]) {
    setUsers((prev) =>
      prev.map((u) => (u.id === driverId ? { ...u, zones } : u))
    );
    if (zoneModal?.id === driverId) {
      setZoneModal((m) => m ? { ...m, zones } : m);
    }
  }

  const columns = useMemo(() => buildColumns(setZoneModal, setToDelete), []);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").includes(q) ||
        u.zones.some((z) => z.name.toLowerCase().includes(q));
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.isActive) ||
        (statusFilter === "inactive" && !u.isActive);
      return matchSearch && matchStatus;
    });
  }, [users, search, statusFilter]);

  if (error) return <ErrorAlert message={error} onRetry={fetchDrivers} />;

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Livreurs"
        sousTitre={
          loading
            ? "Chargement…"
            : `${meta.total} livreur(s) enregistré(s)`
        }
      />

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone ou zone…"
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

        {/* Status */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-surface p-1">
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

        {/* Per page */}
        <div className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3">
          <span className="shrink-0 text-sm text-slate-400">Afficher</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="h-full cursor-pointer bg-transparent text-sm font-semibold text-secondary outline-none"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <LoadingSpinner />
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <Truck className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-500">
            {search || statusFilter !== "all"
              ? "Aucun résultat"
              : "Aucun livreur pour le moment"}
          </p>
          {(search || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
              className="mt-3 text-sm font-semibold text-primary hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <DataTable columns={columns} rows={displayed} />
      )}

      {/* ── Pagination ── */}
      {!loading && meta.total > 0 && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page{" "}
            <span className="font-semibold text-secondary">{meta.current_page}</span>
            {" "}sur{" "}
            <span className="font-semibold text-secondary">{meta.last_page}</span>
            {" · "}{meta.total} livreur(s)
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

      {/* ── Zone assign modal ── */}
      {zoneModal && (
        <ZoneAssignModal
          open={true}
          onClose={() => setZoneModal(null)}
          driverId={zoneModal.id}
          driverName={zoneModal.name}
          currentZones={zoneModal.zones}
          onZonesChanged={handleZonesChanged}
        />
      )}

      {/* ── Delete confirmation ── */}
      <Dialog open={!!toDelete} onOpenChange={(v) => { if (!v) setToDelete(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le livreur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <span className="font-semibold text-secondary">{toDelete?.name}</span>
              {" "}? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setToDelete(null)}
              disabled={deleting}
              className="flex-1 rounded-xl border border-slate-200 bg-surface py-2 text-sm font-semibold text-secondary transition hover:bg-slate-50 disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Supprimer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
