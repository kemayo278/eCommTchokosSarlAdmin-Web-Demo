"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, UploadCloud, X } from "lucide-react";
import { PageHeader, Button, SectionCard } from "@/components/ui/primitives";
import { Field, Textarea, Toggle } from "@/components/ui/Field";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import type { Video } from "@/types/video";

type SourceType = "youtube" | "tiktok" | "upload";

const YT_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-red-500" aria-hidden="true">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
  </svg>
);

const TT_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
  </svg>
);

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

function getTikTokId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/);
  return match?.[1] ?? null;
}

export default function VideoForm({ videoId }: { videoId?: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = videoId !== undefined;

  const [fetchKey, setFetchKey] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(isEdit);
  const [initError, setInitError] = useState<string | null>(null);

  const [sourceType, setSourceType] = useState<SourceType>("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isStory, setIsStory] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("1");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isEdit) return;
    setLoadingInitial(true);
    setInitError(null);
    axiosClient
      .get<Video>(`/v1/videos/${videoId}`)
      .then(({ data }) => {
        setSourceType(data.sourceType);
        setYoutubeUrl(data.youtubeUrl ?? "");
        setTiktokUrl(data.tiktokUrl ?? "");
        setThumbnail(data.thumbnail ?? "");
        setTitle(data.title);
        setDescription(data.description ?? "");
        setIsStory(data.isStory);
        setIsActive(data.isActive);
        setSortOrder(String(data.sortOrder));
      })
      .catch((err) => setInitError(handleApiError(err, "Impossible de charger la vidéo")))
      .finally(() => setLoadingInitial(false));
  }, [fetchKey, videoId]);

  // YouTube derived
  const youtubeId = getYouTubeId(youtubeUrl);
  const autoYtThumbnail = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : null;

  // TikTok derived
  const tiktokId = getTikTokId(tiktokUrl);

  const thumbnailPreview =
    thumbnail ||
    (sourceType === "youtube" ? autoYtThumbnail : null);

  function handleYoutubeUrlChange(url: string) {
    setYoutubeUrl(url);
    setFieldErrors((p) => ({ ...p, youtube_url: "" }));
    const id = getYouTubeId(url);
    if (id && !thumbnail) {
      setThumbnail(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
    }
  }

  function handleTiktokUrlChange(url: string) {
    setTiktokUrl(url);
    setFieldErrors((p) => ({ ...p, tiktok_url: "" }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setFieldErrors((p) => ({ ...p, video_file: "" }));
    }
    e.target.value = "";
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Le titre est obligatoire.";
    if (sourceType === "youtube" && !youtubeUrl.trim())
      errs.youtube_url = "L'URL YouTube est obligatoire.";
    if (sourceType === "tiktok" && !tiktokUrl.trim())
      errs.tiktok_url = "L'URL TikTok est obligatoire.";
    if (sourceType === "upload" && !isEdit && !videoFile)
      errs.video_file = "Veuillez sélectionner un fichier vidéo.";
    return errs;
  }

  async function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      const useFormData = sourceType === "upload" && videoFile;

      if (useFormData) {
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("source_type", "upload");
        fd.append("video_file", videoFile);
        if (description) fd.append("description", description);
        if (thumbnail) fd.append("thumbnail", thumbnail);
        fd.append("is_story", isStory ? "1" : "0");
        fd.append("is_active", isActive ? "1" : "0");
        fd.append("sort_order", String(Number(sortOrder) || 1));
        if (isEdit) fd.append("_method", "PUT");
        await axiosClient.post(isEdit ? `/v1/videos/${videoId}` : "/v1/videos", fd);
      } else {
        const payload: Record<string, unknown> = {
          title: title.trim(),
          source_type: sourceType,
          is_story: isStory,
          is_active: isActive,
          sort_order: Number(sortOrder) || 1,
        };
        if (description) payload.description = description;
        if (thumbnail) payload.thumbnail = thumbnail;
        if (sourceType === "youtube") {
          payload.youtube_url = youtubeUrl.trim();
          if (!thumbnail && autoYtThumbnail) payload.thumbnail = autoYtThumbnail;
        }
        if (sourceType === "tiktok") {
          payload.tiktok_url = tiktokUrl.trim();
        }

        if (isEdit) {
          await axiosClient.put(`/v1/videos/${videoId}`, payload);
        } else {
          await axiosClient.post("/v1/videos", payload);
        }
      }

      toast({
        title: isEdit ? "Vidéo mise à jour" : "Vidéo ajoutée",
        description: `« ${title} » a été ${isEdit ? "enregistrée" : "publiée"} avec succès.`,
      });
      router.push(isEdit ? `/videos/${videoId}` : "/videos");
    } catch (err: any) {
      setSubmitError(handleApiError(err, "Impossible d'enregistrer la vidéo"));
      const serverErrors = err?.response?.data?.errors as Record<string, string[]> | undefined;
      if (serverErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(serverErrors).forEach(([key, msgs]) => { mapped[key] = msgs[0] ?? ""; });
        setFieldErrors(mapped);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInitial) return <LoadingSpinner />;
  if (initError)
    return (
      <ErrorAlert
        message={initError}
        onRetry={() => { setInitError(null); setFetchKey((k) => k + 1); }}
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" href="/videos" className="px-2.5!">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          titre={isEdit ? "Modifier la vidéo" : "Ajouter une vidéo"}
          sousTitre="Publiez une vidéo produit sur le site"
        />
      </div>

      {submitError && (
        <div className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {submitError}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo"
        className="hidden"
        onChange={handleFileChange}
      />

      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">

          {/* ── Source ── */}
          <SectionCard title="Source">
            {/* 3-way toggle */}
            <div className="mb-5 flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(["youtube", "tiktok", "upload"] as SourceType[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSourceType(s)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    sourceType === s
                      ? "bg-white text-secondary shadow-sm"
                      : "text-slate-400 hover:text-secondary"
                  }`}
                >
                  {s === "youtube" && YT_ICON}
                  {s === "tiktok" && TT_ICON}
                  {s === "upload" && <UploadCloud className="h-4 w-4" />}
                  {s === "youtube" ? "YouTube" : s === "tiktok" ? "TikTok" : "Téléchargement"}
                </button>
              ))}
            </div>

            {/* ── YouTube ── */}
            {sourceType === "youtube" && (
              <div className="space-y-4">
                <Field
                  label="URL YouTube"
                  value={youtubeUrl}
                  onChange={handleYoutubeUrlChange}
                  placeholder="https://www.youtube.com/watch?v=…"
                  type="url"
                  required
                  error={fieldErrors.youtube_url}
                />
                <Field
                  label="Miniature (URL)"
                  value={thumbnail}
                  onChange={setThumbnail}
                  placeholder="Auto-générée depuis YouTube"
                  type="url"
                />
                {thumbnailPreview && (
                  <div className="relative overflow-hidden rounded-xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnailPreview} alt="Aperçu miniature" className="h-44 w-full object-cover" />
                    <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                      Aperçu miniature
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── TikTok ── */}
            {sourceType === "tiktok" && (
              <div className="space-y-4">
                <Field
                  label="URL TikTok"
                  value={tiktokUrl}
                  onChange={handleTiktokUrlChange}
                  placeholder="https://www.tiktok.com/@username/video/…"
                  type="url"
                  required
                  error={fieldErrors.tiktok_url}
                />
                <Field
                  label="Miniature (URL, optionnel)"
                  value={thumbnail}
                  onChange={setThumbnail}
                  placeholder="https://…"
                  type="url"
                />
                {tiktokId && (
                  <div className="space-y-2">
                    <div className="flex justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <iframe
                        src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
                        className="h-130 w-full max-w-sm border-0"
                        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                        allowFullScreen
                        sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
                        title="Aperçu TikTok"
                      />
                    </div>
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      Ouvrir sur TikTok si l'aperçu ne charge pas
                    </a>
                  </div>
                )}
                {tiktokUrl && !tiktokId && (
                  <p className="text-xs text-warn">
                    URL non reconnue. Utilisez le format :<br />
                    <code className="font-mono">https://www.tiktok.com/@username/video/1234…</code>
                  </p>
                )}
              </div>
            )}

            {/* ── Upload ── */}
            {sourceType === "upload" && (
              <div className="space-y-4">
                {videoFile ? (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <UploadCloud className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-secondary">{videoFile.name}</p>
                      <p className="text-xs text-slate-400">
                        {(videoFile.size / 1024 / 1024).toFixed(1)} Mo
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoFile(null)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-danger"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex w-full flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-sm transition ${
                        fieldErrors.video_file
                          ? "border-danger bg-danger-soft text-danger"
                          : "border-slate-300 bg-slate-50 text-slate-400 hover:border-primary/50 hover:text-primary-dark"
                      }`}
                    >
                      <UploadCloud className="h-8 w-8" />
                      <span className="font-semibold">
                        {isEdit ? "Remplacer le fichier (optionnel)" : "Déposer ou choisir une vidéo"}
                      </span>
                      <span className="text-xs opacity-70">MP4, MOV — max 100 Mo</span>
                    </button>
                    {fieldErrors.video_file && (
                      <p className="text-xs text-danger">{fieldErrors.video_file}</p>
                    )}
                  </>
                )}
                <Field
                  label="Miniature (URL, optionnel)"
                  value={thumbnail}
                  onChange={setThumbnail}
                  placeholder="https://…"
                  type="url"
                />
              </div>
            )}
          </SectionCard>

          {/* ── Détails ── */}
          <SectionCard title="Détails">
            <div className="space-y-4">
              <Field
                label="Titre de la vidéo"
                value={title}
                onChange={(v) => { setTitle(v); setFieldErrors((p) => ({ ...p, title: "" })); }}
                placeholder="Nouvelle collection wax été"
                required
                error={fieldErrors.title}
              />
              <Textarea
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Texte affiché sous la vidéo"
                rows={3}
              />
            </div>
          </SectionCard>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          <SectionCard title="Paramètres">
            <div className="space-y-4">
              <Field
                label="Ordre d'affichage"
                value={sortOrder}
                onChange={setSortOrder}
                type="number"
                placeholder="1"
                error={fieldErrors.sort_order}
              />
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <Toggle
                  label="Histoire (Story)"
                  description="Affichée dans le fil des stories"
                  actif={isStory}
                  onChange={setIsStory}
                />
                <Toggle
                  label="Vidéo active"
                  description="Visible sur la boutique"
                  actif={isActive}
                  onChange={setIsActive}
                />
              </div>
            </div>
          </SectionCard>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</>
            ) : isEdit ? (
              "Enregistrer les modifications"
            ) : (
              "Enregistrer la vidéo"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
