"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellOff,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Info,
  LifeBuoy,
  Loader2,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import ErrorAlert from "@/components/ui/ErrorAlert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ApiNotification {
  id: string;
  type: string;
  data: { type?: string; message: string };
  read_at: string | null;
  created_at: string;
}

interface PaginatedResponse {
  current_page: number;
  data: ApiNotification[];
  last_page: number;
  total: number;
}

const TYPE_ICON: Record<string, typeof ShoppingCart> = {
  order:      ShoppingCart,
  new_order:  ShoppingCart,
  payment:    CreditCard,
  payout:     CreditCard,
  stock:      AlertTriangle,
  low_stock:  AlertTriangle,
  ticket:     LifeBuoy,
  support:    LifeBuoy,
  return:     RotateCcw,
  refund:     RotateCcw,
};

const TYPE_COLOR: Record<string, string> = {
  order:      "bg-primary-soft text-primary-dark",
  new_order:  "bg-primary-soft text-primary-dark",
  payment:    "bg-info-soft text-info",
  payout:     "bg-info-soft text-info",
  stock:      "bg-warn-soft text-warn",
  low_stock:  "bg-warn-soft text-warn",
  ticket:     "bg-danger-soft text-danger",
  support:    "bg-danger-soft text-danger",
  return:     "bg-warn-soft text-warn",
  refund:     "bg-warn-soft text-warn",
};

function resolveType(n: ApiNotification) {
  if (n.data.type) return n.data.type;
  const parts = n.type.split("\\");
  const last = parts[parts.length - 1] ?? "";
  return last.replace("Notification", "").toLowerCase();
}

function groupByDate(items: ApiNotification[]) {
  const map = new Map<string, ApiNotification[]>();
  for (const n of items) {
    const key = new Date(n.created_at).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long",
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  return Array.from(map.entries());
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function NotificationsList() {
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<PaginatedResponse>("/v1/my-notifications", { params: { page } })
      .then(({ data }) => {
        setItems(data.data);
        setLastPage(data.last_page);
        setTotal(data.total);
      })
      .catch((err) => setError(handleApiError(err, "Impossible de charger les notifications")))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function markRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    try {
      await axiosClient.post(`/v1/notifications/${id}/read`);
    } catch {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: null } : n)));
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await axiosClient.post("/v1/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    } catch (err: unknown) {
      handleApiError(err, "Erreur lors du marquage");
    } finally {
      setMarkingAll(false);
    }
  }

  const nonLues = items.filter((n) => !n.read_at).length;
  const groupes = useMemo(() => groupByDate(items), [items]);

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Notifications"
        sousTitre={
          loading ? "Chargement…" :
          nonLues > 0 ? `${nonLues} non lue(s) · ${total} au total` : "Vous êtes à jour"
        }
        action={
          nonLues > 0 ? (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-surface px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-secondary disabled:opacity-50"
            >
              {markingAll
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CheckCheck className="h-3.5 w-3.5" />
              }
              Tout marquer comme lu
            </button>
          ) : undefined
        }
      />

      {error && <ErrorAlert message={error} onRetry={fetchNotifications} />}

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-surface py-16 text-center">
          <BellOff className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-semibold text-secondary">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupes.map(([date, liste]) => (
            <div key={date}>
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                {date}
              </p>
              <div className="space-y-2">
                {liste.map((n) => {
                  const type = resolveType(n);
                  const Icon = TYPE_ICON[type] ?? Info;
                  const color = TYPE_COLOR[type] ?? "bg-slate-100 text-slate-500";
                  const isRead = !!n.read_at;

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => !isRead && markRead(n.id)}
                      className="block w-full text-left"
                    >
                      <div
                        className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                          isRead
                            ? "border-slate-100 bg-surface"
                            : "border-primary/20 bg-primary-soft/40"
                        }`}
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-secondary">
                              {n.data.message}
                            </p>
                            {!isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                          </div>
                          <p className="mt-1 text-xs text-slate-400">{timeLabel(n.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page <span className="font-semibold text-secondary">{page}</span> sur{" "}
            <span className="font-semibold text-secondary">{lastPage}</span>
            {" · "}{total} notification(s)
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
