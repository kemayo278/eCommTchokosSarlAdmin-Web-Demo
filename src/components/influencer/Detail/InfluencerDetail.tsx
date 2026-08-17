"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Loader2, Mail, Phone, Tag } from "lucide-react";
import { PageHeader, Button, SectionCard, Badge } from "@/components/ui/primitives";
import { Toggle } from "@/components/ui/Field";
import { BadgeActif } from "@/components/ui/statuts";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";
import { fcfa } from "@/lib/format";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import type { Influencer, InfluencerCoupon } from "@/types/influencer";
import RegenerateCouponDialog from "./RegenerateCouponDialog";

interface Props {
  influencerId: number;
}

export default function InfluencerDetail({ influencerId }: Props) {
  const { toast } = useToast();

  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commission, setCommission] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    axiosClient
      .get<Influencer>(`/v1/influencers/${influencerId}`)
      .then(({ data }) => {
        setInfluencer(data);
        setCommission(String(data.commissionPerUser));
        setMinPurchase(String(data.minPurchaseForReferral));
        setIsActive(data.isActive);
      })
      .catch((err) => setError(handleApiError(err, "Impossible de charger l'influenceur")))
      .finally(() => setLoading(false));
  }, [influencerId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSaving(true);
    try {
      const { data } = await axiosClient.put<Influencer>(`/v1/influencers/${influencerId}`, {
        commission_per_user: Number(commission),
        min_purchase_for_referral: Number(minPurchase),
        is_active: isActive,
      });
      setInfluencer(data);
      toast({ title: "Modifications enregistrées", description: `« ${data.user.name} » a été mis à jour.` });
    } catch (err: any) {
      const errs = err?.response?.data?.errors as Record<string, string[]> | undefined;
      if (errs) {
        setFieldErrors(Object.fromEntries(Object.entries(errs).map(([k, v]) => [k, v[0]])));
      } else {
        handleApiError(err, "Impossible de sauvegarder");
      }
    } finally {
      setSaving(false);
    }
  }

  function fieldClass(key: string) {
    return `h-10 w-full rounded-xl border px-3 text-sm text-secondary placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-primary/20 ${
      fieldErrors[key] ? "border-danger focus:border-danger" : "border-slate-200 focus:border-primary"
    }`;
  }

  if (loading) return <LoadingSpinner />;
  if (error || !influencer) return <ErrorAlert message={error ?? "Introuvable"} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" href="/influencers" className="px-2.5!">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          titre={influencer.user.name}
          sousTitre={influencer.user.email}
        />
        <div className="ml-auto">
          <BadgeActif actif={influencer.isActive} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Left: edit form ── */}
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Informations">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                {influencer.user.email}
              </div>
              {influencer.user.phone && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                  {influencer.user.phone}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Programme de parrainage">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-secondary">
                    Commission par parrainage (FCFA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    className={fieldClass("commission_per_user")}
                  />
                  {fieldErrors.commission_per_user && (
                    <p className="mt-1 text-xs text-danger">{fieldErrors.commission_per_user}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-secondary">
                    Achat minimum (FCFA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    className={fieldClass("min_purchase_for_referral")}
                  />
                  {fieldErrors.min_purchase_for_referral && (
                    <p className="mt-1 text-xs text-danger">{fieldErrors.min_purchase_for_referral}</p>
                  )}
                </div>
              </div>

              <Toggle
                label="Influenceur actif"
                description="S'il est désactivé, ses liens de parrainage ne génèrent plus de commission"
                actif={isActive}
                onChange={setIsActive}
              />

              <button
                type="submit"
                disabled={saving}
                className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </button>
            </form>
          </SectionCard>
        </div>

        {/* ── Right: coupons ── */}
        <div>
          <SectionCard
            title="Coupons associés"
            action={
              <RegenerateCouponDialog
                influencerId={influencerId}
                onSuccess={(coupons: InfluencerCoupon[]) =>
                  setInfluencer((prev) => prev ? { ...prev, coupons } : prev)
                }
              />
            }
          >
            {!influencer.coupons || influencer.coupons.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun coupon associé</p>
            ) : (
              <ul className="space-y-2">
                {influencer.coupons.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-slate-100 px-3 py-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="font-mono text-sm font-semibold text-secondary">
                          {c.code}
                        </span>
                      </div>
                      <BadgeActif actif={c.isActive} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.value != null && (
                        <Badge tone="primary">{c.value}% de réduction</Badge>
                      )}
                      <Badge tone="neutral">{c.usedCount}{c.maxUses != null ? `/${c.maxUses}` : ""} util.</Badge>
                      {c.minOrderAmount != null && (
                        <Badge tone="neutral">Min. {fcfa(c.minOrderAmount)}</Badge>
                      )}
                    </div>
                    {c.expiresAt && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        Expire le {new Date(c.expiresAt).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
