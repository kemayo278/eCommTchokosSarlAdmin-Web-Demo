"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mail, Phone, User } from "lucide-react";
import { PageHeader, Button, SectionCard } from "@/components/ui/primitives";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";

export default function InfluencerForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [commissionPerUser, setCommissionPerUser] = useState("");
  const [minPurchaseForReferral, setMinPurchaseForReferral] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await axiosClient.post("/v1/influencers", {
        name,
        email,
        phone: phone || null,
        commission_per_user: Number(commissionPerUser),
        min_purchase_for_referral: Number(minPurchaseForReferral),
      });
      toast({ title: "Influenceur créé", description: `« ${name} » a été ajouté avec succès.` });
      router.push("/influencers");
    } catch (err: any) {
      handleApiError(err, "Impossible de créer l'influenceur");
      setSubmitting(false);
    }
  }

  function fieldClass(key: string) {
    return `h-10 w-full rounded-xl border px-3 text-sm text-secondary placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-primary/20 ${
      errors[key] ? "border-danger focus:border-danger" : "border-slate-200 focus:border-primary"
    }`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" href="/influencers" className="px-2.5!">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          titre="Nouvel influenceur"
          sousTitre="Crée un compte utilisateur avec les rôles customer et influencer"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Informations personnelles">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Nom complet <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean Dupont"
                    required
                    className={`${fieldClass("name")} pl-9`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Email <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean@example.com"
                    required
                    className={`${fieldClass("email")} pl-9`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Téléphone <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="699000000"
                    className={`${fieldClass("phone")} pl-9`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone}</p>}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Programme de parrainage">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Commission */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Commission par parrainage (FCFA) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={commissionPerUser}
                  onChange={(e) => setCommissionPerUser(e.target.value)}
                  placeholder="300"
                  required
                  className={fieldClass("commission_per_user")}
                />
                {errors.commission_per_user && (
                  <p className="mt-1 text-xs text-danger">{errors.commission_per_user}</p>
                )}
              </div>

              {/* Min purchase */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Achat minimum pour valider (FCFA) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={minPurchaseForReferral}
                  onChange={(e) => setMinPurchaseForReferral(e.target.value)}
                  placeholder="5000"
                  required
                  className={fieldClass("min_purchase_for_referral")}
                />
                {errors.min_purchase_for_referral && (
                  <p className="mt-1 text-xs text-danger">{errors.min_purchase_for_referral}</p>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              La commission est créditée en points une fois que le filleul atteint le montant minimum d'achat.
            </p>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-2 lg:mt-0">
          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer l'influenceur
          </button>
          <Button type="button" variant="secondary" href="/influencers" className="w-full justify-center">
            Annuler
          </Button>
        </div>
      </div>
    </form>
  );
}
