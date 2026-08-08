"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import { PageHeader, Badge, Button, SectionCard } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { BadgeActif } from "@/components/ui/statuts";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { fcfa, nombre } from "@/lib/format";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import type { Influencer, InfluencerStats } from "@/types/influencer";

const AVATAR_COLORS = [
  "bg-primary text-white", "bg-info-soft text-info", "bg-warn-soft text-warn",
  "bg-danger-soft text-danger", "bg-primary-soft text-primary-dark",
];
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

const columns: Column<Influencer>[] = [
  {
    cle: "user",
    entete: "Influenceur",
    rendu: (inf) => (
      <div className="flex items-center gap-3">
        {inf.user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={inf.user.avatar} alt={inf.user.name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(inf.id)}`}>
            {initials(inf.user.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-secondary">{inf.user.name}</p>
          <p className="truncate text-xs text-slate-400">{inf.user.email}</p>
        </div>
      </div>
    ),
  },
  {
    cle: "commissionPerUser",
    entete: "Commission / parrainage",
    masquerMobile: true,
    rendu: (inf) => (
      <Badge tone="info">{fcfa(inf.commissionPerUser)}</Badge>
    ),
  },
  {
    cle: "minPurchaseForReferral",
    entete: "Achat minimum",
    masquerMobile: true,
    rendu: (inf) => (
      <span className="text-sm text-slate-500">{fcfa(inf.minPurchaseForReferral)}</span>
    ),
  },
  {
    cle: "isActive",
    entete: "Statut",
    aligne: "center",
    rendu: (inf) => <BadgeActif actif={inf.isActive} />,
  },
  {
    cle: "id",
    entete: "",
    aligne: "right",
    rendu: (inf) => (
      <Button variant="secondary" href={`/influencers/${inf.id}`} className="!py-1.5 !px-3">
        <Pencil className="h-3.5 w-3.5" /> Gérer
      </Button>
    ),
  },
];

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
}
function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-secondary">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function InfluencersList() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [stats, setStats] = useState<InfluencerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      axiosClient.get<Influencer[] | { data: Influencer[]; meta: { current_page: number; last_page: number; total: number } }>("/v1/influencers", { params: { page } }),
      axiosClient.get<InfluencerStats>("/v1/influencer/stats"),
    ])
      .then(([infRes, statsRes]) => {
        const infData = infRes.data;
        if (Array.isArray(infData)) {
          setInfluencers(infData);
          setTotal(infData.length);
          setLastPage(1);
        } else {
          setInfluencers(infData.data);
          setTotal(infData.meta.total);
          setLastPage(infData.meta.last_page);
        }
        setStats(statsRes.data);
      })
      .catch((err) => setError(handleApiError(err, "Impossible de charger les influenceurs")))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return influencers;
    return influencers.filter(
      (inf) =>
        inf.user.name.toLowerCase().includes(q) ||
        inf.user.email.toLowerCase().includes(q) ||
        (inf.user.phone ?? "").includes(q)
    );
  }, [influencers, search]);

  if (error) return <ErrorAlert message={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Influenceurs"
        sousTitre={loading ? "Chargement…" : `${total} influenceur(s) enregistré(s)`}
        action={
          <Button href="/influencers/new">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        }
      />

      {/* ── Stats ── */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total influenceurs"
            value={nombre(stats.total_influencers)}
            sub={`${nombre(stats.active_influencers)} actifs`}
          />
          <StatCard
            label="Points distribués"
            value={nombre(stats.total_points_awarded)}
          />
          <StatCard
            label="Retraits en attente"
            value={nombre(stats.pending_payouts)}
          />
          <StatCard
            label="Total payé"
            value={fcfa(stats.total_paid)}
          />
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email…"
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

      {/* ── Table ── */}
      {loading ? (
        <LoadingSpinner />
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <UserCheck className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-500">
            {search ? "Aucun résultat" : "Aucun influenceur pour le moment"}
          </p>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-3 text-sm font-semibold text-primary hover:underline"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <DataTable columns={columns} rows={displayed} />
      )}

      {/* ── Pagination ── */}
      {!loading && lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page <span className="font-semibold text-secondary">{page}</span> sur{" "}
            <span className="font-semibold text-secondary">{lastPage}</span>
            {" · "}{total} influenceur(s)
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
    </div>
  );
}
