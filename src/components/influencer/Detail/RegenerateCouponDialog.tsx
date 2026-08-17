"use client";

import { useState } from "react";
import { Calendar, Loader2, RefreshCw, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";
import type { InfluencerCoupon } from "@/types/influencer";

interface Props {
  influencerId: number;
  onSuccess: (coupons: InfluencerCoupon[]) => void;
}

const today = new Date().toISOString().split("T")[0];

export default function RegenerateCouponDialog({ influencerId, onSuccess }: Props) {
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [value, setValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  function reset() {
    setValue("");
    setMinOrderAmount("");
    setMaxUses("");
    setExpiresAt("");
    setErrors({});
  }

  function fieldClass(key: string) {
    return `h-10 w-full rounded-xl border px-3 text-sm text-secondary placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-primary/20 ${
      errors[key] ? "border-danger focus:border-danger" : "border-slate-200 focus:border-primary"
    }`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    const body: Record<string, unknown> = {};
    if (value !== "") body.value = Number(value);
    if (minOrderAmount !== "") body.min_order_amount = Number(minOrderAmount);
    if (maxUses !== "") body.max_uses = Number(maxUses);
    if (expiresAt !== "") body.expires_at = expiresAt;

    try {
      const { data } = await axiosClient.post<{ coupons: InfluencerCoupon[] }>(
        `/v1/influencers/${influencerId}/regenerate-coupon`,
        body,
      );
      onSuccess(data.coupons);
      toast({ title: "Coupon régénéré", description: "Le nouveau coupon est actif." });
      setOpen(false);
      reset();
    } catch (err: any) {
      if (err?.response?.status === 422 && err.response.data?.errors) {
        const apiErrors: Record<string, string[]> = err.response.data.errors;
        setErrors(Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v[0]])));
      }
      handleApiError(err, "Impossible de régénérer le coupon");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-2.5 py-1.5 text-xs font-semibold text-secondary transition hover:bg-slate-50"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Régénérer
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Régénérer le coupon</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <p className="text-xs text-slate-400">
            Tous les champs sont optionnels. Laissez vides pour conserver les valeurs actuelles du coupon.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Value */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-secondary">
                Réduction (%)
              </label>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="15"
                  className={`${fieldClass("value")} pl-8`}
                />
              </div>
              {errors.value && <p className="mt-1 text-xs text-danger">{errors.value}</p>}
            </div>

            {/* Min order amount */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-secondary">
                Commande min. (FCFA)
              </label>
              <input
                type="number"
                min={0}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="25000"
                className={fieldClass("min_order_amount")}
              />
              {errors.min_order_amount && (
                <p className="mt-1 text-xs text-danger">{errors.min_order_amount}</p>
              )}
            </div>

            {/* Max uses */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-secondary">
                Utilisations max
              </label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="50"
                className={fieldClass("max_uses")}
              />
              {errors.max_uses && <p className="mt-1 text-xs text-danger">{errors.max_uses}</p>}
            </div>

            {/* Expires at */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-secondary">
                Date d'expiration
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  min={today}
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={`${fieldClass("expires_at")} pl-8`}
                />
              </div>
              {errors.expires_at && (
                <p className="mt-1 text-xs text-danger">{errors.expires_at}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose className="flex h-9 items-center rounded-xl border border-slate-200 px-4 text-xs font-semibold text-secondary transition hover:bg-slate-50">
              Annuler
            </DialogClose>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Régénérer
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
