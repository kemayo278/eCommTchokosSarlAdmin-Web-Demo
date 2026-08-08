"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  ExternalLink,
  Loader2,
  Pencil,
  Play,
  Trash2,
  UploadCloud,
  Video,
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
import type { Video as VideoType } from "@/types/video";

function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

function getTikTokId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/video\/(\d+)/);
  return match?.[1] ?? null;
}

const TT_ICON = (
  <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
  </svg>
);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export default function VideoView({ videoId }: { videoId: number }) {
  const router = useRouter();
  const { toast } = useToast();

  const [fetchKey, setFetchKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<VideoType | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosClient
      .get<VideoType>(`/v1/videos/${videoId}`)
      .then(({ data }) => setVideo(data))
      .catch((err) => setError(handleApiError(err, "Impossible de charger la vidéo")))
      .finally(() => setLoading(false));
  }, [videoId, fetchKey]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await axiosClient.delete(`/v1/videos/${videoId}`);
      toast({ title: "Vidéo supprimée", description: `« ${video?.title} » a été supprimée.` });
      router.push("/videos");
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
        onRetry={() => { setError(null); setFetchKey((k) => k + 1); }}
      />
    );

  if (!video) return null;

  const youtubeId = getYouTubeId(video.youtubeUrl);
  // tiktokUrl fallback: backend may store the URL in the generic `url` field
  const tiktokRawUrl =
    video.tiktokUrl ??
    (video.sourceType === "tiktok" ? video.url : null);
  const tiktokId = getTikTokId(tiktokRawUrl);

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" href="/videos" className="px-2.5!">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader titre={video.title} sousTitre="Détails de la vidéo" />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" href={`/videos/${videoId}/edit`}>
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
          {/* ── Left ── */}
          <div className="space-y-4 lg:col-span-2">
            {/* Player / Thumbnail */}
            <SectionCard title="Aperçu">
              {youtubeId ? (
                <div className="overflow-hidden rounded-xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="aspect-video w-full rounded-xl border-0"
                  />
                </div>
              ) : video.sourceType === "tiktok" ? (
                <div className="space-y-3">
                  {tiktokId ? (
                    <div className="flex justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                      <iframe
                        src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
                        title={video.title}
                        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                        allowFullScreen
                        sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
                        className="h-130 w-full max-w-sm border-0"
                      />
                    </div>
                  ) : (
                    <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-xl bg-slate-100 text-slate-400">
                      <svg viewBox="0 0 24 24" className="h-10 w-10 fill-slate-300" aria-hidden="true">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                      </svg>
                      <p className="text-sm font-semibold">Aperçu indisponible</p>
                      <p className="text-xs">ID TikTok non détecté dans l'URL</p>
                    </div>
                  )}
                  {tiktokRawUrl && (
                    <a
                      href={tiktokRawUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-secondary transition hover:bg-slate-50"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                      </svg>
                      Voir sur TikTok
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    </a>
                  )}
                </div>
              ) : video.thumbnail ? (
                <div className="relative overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-56 w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <Play className="h-7 w-7 fill-white text-white" />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center rounded-xl bg-slate-100">
                  <Video className="h-12 w-12 text-slate-300" />
                </div>
              )}
            </SectionCard>

            {/* Description */}
            {video.description && (
              <SectionCard title="Description">
                <p className="text-sm leading-relaxed text-slate-600">{video.description}</p>
              </SectionCard>
            )}
          </div>

          {/* ── Right ── */}
          <div className="space-y-4">
            <SectionCard title="Informations">
              <div className="divide-y divide-slate-100">
                <InfoRow label="Statut">
                  <BadgeActif actif={video.isActive} />
                </InfoRow>
                <InfoRow label="Type">
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
                      <span className="flex items-center gap-1">{TT_ICON} TikTok</span>
                    )}
                    {video.sourceType === "upload" && (
                      <span className="flex items-center gap-1">
                        <UploadCloud className="h-3 w-3" /> Upload
                      </span>
                    )}
                  </Badge>
                </InfoRow>
                <InfoRow label="Story">
                  <Badge tone={video.isStory ? "primary" : "neutral"}>
                    {video.isStory ? "Oui" : "Non"}
                  </Badge>
                </InfoRow>
                <InfoRow label="Ordre">{video.sortOrder}</InfoRow>
              </div>
            </SectionCard>

            {(video.youtubeUrl || video.tiktokUrl || video.url) && (
              <SectionCard title="Lien">
                <a
                  href={video.youtubeUrl ?? video.tiktokUrl ?? video.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 break-all text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {video.youtubeUrl ?? video.tiktokUrl ?? video.url}
                </a>
              </SectionCard>
            )}

            <SectionCard title="Planification">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Créé le</p>
                    <p className="text-sm font-semibold text-secondary">
                      {formatDate(video.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Mis à jour</p>
                    <p className="text-sm font-semibold text-secondary">
                      {formatDate(video.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* ── Delete dialog ── */}
      <Dialog open={confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la vidéo</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La vidéo{" "}
              <strong>« {video.title} »</strong> sera définitivement supprimée.
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
