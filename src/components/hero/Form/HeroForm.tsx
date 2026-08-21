"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, ImageIcon, Link2, Loader2, Type, Upload, X } from "lucide-react";
import { PageHeader, Button, SectionCard } from "@/components/ui/primitives";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";
import { HeroImage } from "@/types/heroimage";

interface Props {
  initial?: HeroImage;
}

export default function HeroForm({ initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!initial;
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [startsAt, setStartsAt] = useState(initial?.startsAt ? initial.startsAt.split("T")[0] : "");
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ? initial.expiresAt.split("T")[0] : "");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.imageUrl ?? null);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function fc(key: string) {
    return `h-10 w-full rounded-xl border px-3 text-sm text-secondary placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-primary/20 ${
      errors[key] ? "border-danger focus:border-danger" : "border-slate-200 focus:border-primary"
    }`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && !imageFile) {
      setErrors({ image: "Une image est requise." });
      return;
    }

    setErrors({});
    setSubmitting(true);

    const fd = new FormData();
    if (isEdit) fd.append("_method", "PUT");
    if (title) fd.append("title", title);
    if (subtitle) fd.append("subtitle", subtitle);
    if (link) fd.append("link", link);
    fd.append("is_active", isActive ? "1" : "0");
    fd.append("sort_order", sortOrder || "0");
    if (startsAt) fd.append("starts_at", startsAt);
    if (expiresAt) fd.append("expires_at", expiresAt);
    if (imageFile) fd.append("image", imageFile);

    try {
      if (isEdit) {
        await axiosClient.post(`/v1/hero-images/${initial!.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast({ title: "Image mise à jour", description: "La hero image a été modifiée." });
      } else {
        await axiosClient.post("/v1/hero-images", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast({ title: "Image ajoutée", description: "La hero image a été créée." });
      }
      router.push("/settings/hero-images");
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
      if (apiErr?.response?.status === 422 && apiErr.response.data?.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(apiErr.response.data.errors)) {
          fieldErrors[k] = msgs[0];
        }
        setErrors(fieldErrors);
      } else {
        handleApiError(err, isEdit ? "Impossible de modifier l'image" : "Impossible de créer l'image");
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" href="/settings/hero-images" className="px-2.5!">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          titre={isEdit ? "Modifier l'image héro" : "Nouvelle image héro"}
          sousTitre="Image affichée en bannière sur le site"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Left ── */}
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Contenu">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Titre <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <div className="relative">
                  <Type className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Soldes d'été"
                    maxLength={255}
                    className={`${fc("title")} pl-9`}
                  />
                </div>
                {errors.title && <p className="mt-1 text-xs text-danger">{errors.title}</p>}
              </div>

              {/* Subtitle */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Sous-titre <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Jusqu'à -50% sur tous les produits"
                  maxLength={255}
                  className={fc("subtitle")}
                />
                {errors.subtitle && <p className="mt-1 text-xs text-danger">{errors.subtitle}</p>}
              </div>

              {/* Link */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Lien <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="/products?promo=1"
                    maxLength={255}
                    className={`${fc("link")} pl-9`}
                  />
                </div>
                {errors.link && <p className="mt-1 text-xs text-danger">{errors.link}</p>}
              </div>
            </div>
          </SectionCard>

          {/* Image */}
          <SectionCard title={isEdit ? "Image (laisser vide pour conserver l'actuelle)" : "Image *"}>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />

            {previewUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="h-48 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setPreviewUrl(initial?.imageUrl ?? null); }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black/70"
                >
                  <Upload className="h-3 w-3" /> Changer
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed py-12 transition ${
                  errors.image
                    ? "border-danger bg-danger-soft text-danger"
                    : "border-slate-300 bg-slate-50 text-slate-400 hover:border-primary/50 hover:text-primary-dark"
                }`}
              >
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm font-semibold">
                  Cliquer pour charger une image
                </span>
                <span className="text-xs">JPEG, PNG, WEBP · max 4 Mo</span>
                <span className="text-xs opacity-70">Dimensions recommandées : 2358 × 1185 px</span>
              </button>
            )}
            {errors.image && <p className="mt-1.5 text-xs text-danger">{errors.image}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="inline-block h-1 w-1 rounded-full bg-primary" />
              Pour un affichage optimal, utilisez une image de <strong className="text-slate-500">2358 × 1185 px</strong> (ratio 2:1).
            </p>
          </SectionCard>

          {/* Period */}
          <SectionCard title="Période de diffusion">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Début <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className={`${fc("starts_at")} pl-9`}
                  />
                </div>
                {errors.starts_at && <p className="mt-1 text-xs text-danger">{errors.starts_at}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Fin <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={expiresAt}
                    min={startsAt || undefined}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className={`${fc("expires_at")} pl-9`}
                  />
                </div>
                {errors.expires_at && <p className="mt-1 text-xs text-danger">{errors.expires_at}</p>}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Laissez vide pour diffuser l'image en permanence.
            </p>
          </SectionCard>
        </div>

        {/* ── Right sidebar ── */}
        <div className="flex flex-col gap-4">
          <SectionCard title="Publication">
            <div className="space-y-4">
              {/* isActive toggle */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">Statut</label>
                <label className="flex cursor-pointer items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    onClick={() => setIsActive((v) => !v)}
                    className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      isActive ? "bg-primary" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        isActive ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-secondary">
                    {isActive ? "Actif" : "Inactif"}
                  </span>
                </label>
              </div>

              {/* Sort order */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={fc("sort_order")}
                />
                {errors.sort_order && <p className="mt-1 text-xs text-danger">{errors.sort_order}</p>}
                <p className="mt-1 text-xs text-slate-400">0 = affiché en premier</p>
              </div>
            </div>
          </SectionCard>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : isEdit ? "Enregistrer les modifications" : "Créer l'image héro"}
          </button>

          <Button type="button" variant="secondary" href="/settings/hero-images" className="w-full justify-center">
            Annuler
          </Button>
        </div>
      </div>
    </form>
  );
}
