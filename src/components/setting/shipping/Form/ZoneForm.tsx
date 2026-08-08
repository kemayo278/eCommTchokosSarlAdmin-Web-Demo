"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MapPin, Truck } from "lucide-react";
import { PageHeader, Button, SectionCard } from "@/components/ui/primitives";
import { Toggle } from "@/components/ui/Field";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import type { Zone } from "@/types/zone";

interface Props {
  zoneId?: number;
}

export default function ZoneForm({ zoneId }: Props) {
  const isEdit = zoneId !== undefined;
  const router = useRouter();
  const { toast } = useToast();

  const [loadingZone, setLoadingZone] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryCost, setDeliveryCost] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isEdit) return;
    setLoadingZone(true);
    axiosClient
      .get<Zone>(`/v1/zones/${zoneId}`)
      .then(({ data }) => {
        setName(data.name);
        setDescription(data.description ?? "");
        setDeliveryCost(data.deliveryCost != null ? String(data.deliveryCost) : "");
        setIsActive(data.isActive);
      })
      .catch((err) => setLoadError(handleApiError(err, "Impossible de charger la zone")))
      .finally(() => setLoadingZone(false));
  }, [isEdit, zoneId]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    const payload = {
      name,
      description: description || null,
      delivery_cost: deliveryCost !== "" ? Number(deliveryCost) : null,
      is_active: isActive,
    };

    try {
      if (isEdit) {
        await axiosClient.put(`/v1/zones/${zoneId}`, payload);
        toast({ title: "Zone mise à jour", description: `« ${name} » a été modifiée.` });
      } else {
        await axiosClient.post("/v1/zones", payload);
        toast({ title: "Zone créée", description: `« ${name} » a été ajoutée.` });
      }
      router.push("/settings/shipping");
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.errors as Record<string, string[]> | undefined;
      if (fieldErrors) {
        setErrors(
          Object.fromEntries(
            Object.entries(fieldErrors).map(([k, v]) => [k, v[0]])
          )
        );
      }
      handleApiError(err);
      setSubmitting(false);
    }
  }

  if (loadingZone) return <LoadingSpinner />;
  if (loadError) return <ErrorAlert message={loadError} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" href="/settings/shipping" className="px-2.5!">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          titre={isEdit ? "Modifier la zone" : "Nouvelle zone"}
          sousTitre={isEdit ? `Édition de « ${name} »` : "Ajouter une zone de livraison"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Informations">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Nom de la zone <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Akwa · Bonanjo"
                    required
                    className={`h-10 w-full rounded-xl border pl-9 pr-3 text-sm text-secondary placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-primary/20 ${
                      errors.name ? "border-danger focus:border-danger" : "border-slate-200 focus:border-primary"
                    }`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
              </div>

              {/* Delivery cost */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Frais de livraison <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <div className="relative">
                  <Truck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min={0}
                    value={deliveryCost}
                    onChange={(e) => setDeliveryCost(e.target.value)}
                    placeholder="Ex: 1000"
                    className={`h-10 w-full rounded-xl border pl-9 pr-14 text-sm text-secondary placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-primary/20 ${
                      errors.delivery_cost ? "border-danger focus:border-danger" : "border-slate-200 focus:border-primary"
                    }`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    FCFA
                  </span>
                </div>
                {errors.delivery_cost && <p className="mt-1 text-xs text-danger">{errors.delivery_cost}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Description <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Quartiers ou secteurs couverts…"
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm text-secondary placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-primary/20 resize-none ${
                    errors.description ? "border-danger focus:border-danger" : "border-slate-200 focus:border-primary"
                  }`}
                />
                {errors.description && <p className="mt-1 text-xs text-danger">{errors.description}</p>}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Statut">
            <Toggle
              label="Zone active"
              description="Les livreurs peuvent être affectés à cette zone"
              actif={isActive}
              onChange={setIsActive}
            />
          </SectionCard>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Enregistrer les modifications" : "Créer la zone"}
            </button>
            <Button type="button" variant="secondary" href="/settings/shipping" className="w-full justify-center">
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
