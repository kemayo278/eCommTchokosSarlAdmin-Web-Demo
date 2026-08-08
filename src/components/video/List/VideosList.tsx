"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Play,
  Plus,
  Search,
  Upload,
  Video,
  X,
} from "lucide-react";
import { PageHeader, Button, Badge } from "@/components/ui/primitives";
import { BadgeActif } from "@/components/ui/statuts";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import type { VideosResponse, VideoMeta, Video as VideoType } from "@/types/video";

const PER_PAGE_OPTIONS = [12, 24, 48] as const;

type StatusFilter = "all" | "active" | "inactive";

export default function VideosList() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [meta, setMeta] = useState<VideoMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchVideos = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<VideosResponse>("/v1/videos", { params: { page, per_page: perPage } })
      .then(({ data }) => {
        setVideos(data.data);
        setMeta(data.meta);
      })
      .catch((err) => setError(handleApiError(err, "Impossible de charger les vidéos")))
      .finally(() => setLoading(false));
  }, [page, perPage]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos.filter((v) => {
      const matchSearch = !q || v.title.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && v.isActive) ||
        (statusFilter === "inactive" && !v.isActive);
      return matchSearch && matchStatus;
    });
  }, [videos, search, statusFilter]);

  const actives = videos.filter((v) => v.isActive).length;

  if (error) return <ErrorAlert message={error} onRetry={fetchVideos} />;

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Vidéos"
        sousTitre={
          loading
            ? "Chargement…"
            : `${actives} active(s) sur ${meta.total} au total`
        }
        action={
          <Button href="/videos/new">
            <Plus className="h-4 w-4" /> Ajouter une vidéo
          </Button>
        }
      />

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une vidéo…"
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

      {/* ── Grid ── */}
      {loading ? (
        <LoadingSpinner />
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <Video className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-500">
            {search || statusFilter !== "all" ? "Aucun résultat" : "Aucune vidéo pour le moment"}
          </p>
          {!search && statusFilter === "all" && (
            <>
              <p className="mt-1 text-sm text-slate-400">Publiez votre première vidéo.</p>
              <Button href="/videos/new" className="mt-5">
                <Plus className="h-4 w-4" /> Ajouter une vidéo
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && meta.total > 0 && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page{" "}
            <span className="font-semibold text-secondary">{meta.current_page}</span>
            {" "}sur{" "}
            <span className="font-semibold text-secondary">{meta.last_page}</span>
            {" · "}{meta.total} vidéo(s)
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
    </div>
  );
}

function VideoCard({ video }: { video: VideoType }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-surface transition hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-800">
        {video.thumbnail && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Video className="h-12 w-12 text-slate-600" />
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Play className="h-5 w-5 fill-white text-white" />
          </span>
        </div>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {video.isStory && (
            <Badge tone="primary">Story</Badge>
          )}
          <Badge
            tone={
              video.sourceType === "youtube"
                ? "danger"
                : video.sourceType === "tiktok"
                ? "info"
                : "neutral"
            }
          >
            {video.sourceType === "youtube" && (
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
                </svg>
                YouTube
              </span>
            )}
            {video.sourceType === "tiktok" && (
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                </svg>
                TikTok
              </span>
            )}
            {video.sourceType === "upload" && (
              <span className="flex items-center gap-1"><Upload className="h-3 w-3" /> Upload</span>
            )}
          </Badge>
        </div>

        <div className="absolute right-2 top-2">
          <BadgeActif actif={video.isActive} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="truncate font-bold text-secondary">{video.title}</p>
        {video.description && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-400">{video.description}</p>
        )}
        {video.youtubeUrl && (
          <a
            href={video.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate text-xs text-primary hover:underline"
          >
            {video.youtubeUrl}
          </a>
        )}
        <p className="mt-2 text-xs text-slate-400">Ordre #{video.sortOrder}</p>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            href={`/videos/${video.id}`}
            className="px-3! py-1.5! text-xs"
          >
            Voir
          </Button>
          <Button
            variant="secondary"
            href={`/videos/${video.id}/edit`}
            className="px-3! py-1.5! text-xs"
          >
            <Pencil className="h-3.5 w-3.5" /> Modifier
          </Button>
        </div>
      </div>
    </div>
  );
}
