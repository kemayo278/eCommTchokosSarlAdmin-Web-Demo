"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  Tag,
  User,
} from "lucide-react";
import { PageHeader, Button, SectionCard } from "@/components/ui/primitives";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";
import { generatePassword, sendInfluencerWelcomeEmail } from "@/services/influencerMailService";

const STEPS = [
  { id: 1, label: "Compte" },
  { id: 2, label: "Parrainage" },
  { id: 3, label: "Coupon" },
];

const STEP1_KEYS = ["name", "email", "phone"];
const STEP2_KEYS = ["commission_per_user", "min_purchase_for_referral"];

export default function InfluencerForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [commissionPerUser, setCommissionPerUser] = useState("");
  const [minPurchaseForReferral, setMinPurchaseForReferral] = useState("");

  const [couponEnabled, setCouponEnabled] = useState(false);
  const [couponValue, setCouponValue] = useState("");
  const [couponMinOrderAmount, setCouponMinOrderAmount] = useState("");
  const [couponMaxUses, setCouponMaxUses] = useState("");
  const [couponExpiresAt, setCouponExpiresAt] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split("T")[0];

  function fieldClass(key: string) {
    return `h-10 w-full rounded-xl border px-3 text-sm text-secondary placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-primary/20 ${
      errors[key] ? "border-danger focus:border-danger" : "border-slate-200 focus:border-primary"
    }`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 3) {
      setErrors({});
      setStep((s) => s + 1);
      return;
    }

    setErrors({});
    setSubmitting(true);
    const password = generatePassword();

    const coupon = couponEnabled
      ? {
          value: couponValue !== "" ? Number(couponValue) : null,
          min_order_amount: couponMinOrderAmount !== "" ? Number(couponMinOrderAmount) : null,
          max_uses: couponMaxUses !== "" ? Number(couponMaxUses) : null,
          expires_at: couponExpiresAt || null,
        }
      : {};

    try {
      await axiosClient.post("/v1/influencers", {
        name,
        email,
        password,
        phone: phone || null,
        commission_per_user: commissionPerUser !== "" ? Number(commissionPerUser) : null,
        min_purchase_for_referral: minPurchaseForReferral !== "" ? Number(minPurchaseForReferral) : null,
        coupon,
      });

      await sendInfluencerWelcomeEmail(name, email, password);

      toast({
        title: "Influenceur créé",
        description: `« ${name} » a été ajouté et ses identifiants lui ont été envoyés par e-mail.`,
      });
      router.push("/influencers");
    } catch (err: any) {
      if (err?.response?.status === 422 && err.response.data?.errors) {
        const apiErrors: Record<string, string[]> = err.response.data.errors;
        const fieldErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(apiErrors)) {
          fieldErrors[key] = msgs[0];
        }
        setErrors(fieldErrors);
        const keys = Object.keys(fieldErrors);
        if (keys.some((k) => STEP1_KEYS.includes(k))) setStep(1);
        else if (keys.some((k) => STEP2_KEYS.includes(k))) setStep(2);
      }
      handleApiError(err, "Impossible de créer l'influenceur");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" href="/influencers" className="px-2.5!">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          titre="Nouvel influenceur"
          sousTitre="Crée un compte utilisateur avec les rôles customer et influencer"
        />
      </div>

      {/* Stepper */}
      <div className="flex items-start">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex flex-1 items-start">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step > s.id
                    ? "bg-primary text-white"
                    : step === s.id
                      ? "bg-primary text-white shadow shadow-primary/30"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
              </div>
              <span
                className={`text-xs font-semibold ${step >= s.id ? "text-secondary" : "text-slate-400"}`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mt-4 h-px flex-1 transition-colors ${step > s.id ? "bg-primary" : "bg-slate-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content + sidebar */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">

          {/* Step 1 — Compte */}
          {step === 1 && (
            <SectionCard title="Informations personnelles">
              <div className="space-y-4">
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

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-secondary">
                    Téléphone{" "}
                    <span className="font-normal text-slate-400">(optionnel)</span>
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
          )}

          {/* Step 2 — Parrainage */}
          {step === 2 && (
            <SectionCard title="Programme de parrainage">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-secondary">
                    Commission par parrainage (FCFA){" "}
                    <span className="font-normal text-slate-400">(optionnel)</span>
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={10000}
                    value={commissionPerUser}
                    onChange={(e) => setCommissionPerUser(e.target.value)}
                    placeholder="300"
                    className={fieldClass("commission_per_user")}
                  />
                  {errors.commission_per_user && (
                    <p className="mt-1 text-xs text-danger">{errors.commission_per_user}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-secondary">
                    Achat minimum pour valider (FCFA){" "}
                    <span className="font-normal text-slate-400">(optionnel)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minPurchaseForReferral}
                    onChange={(e) => setMinPurchaseForReferral(e.target.value)}
                    placeholder="5000"
                    className={fieldClass("min_purchase_for_referral")}
                  />
                  {errors.min_purchase_for_referral && (
                    <p className="mt-1 text-xs text-danger">{errors.min_purchase_for_referral}</p>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                La commission est créditée une fois que le filleul atteint le montant minimum d'achat.
              </p>
            </SectionCard>
          )}

          {/* Step 3 — Coupon */}
          {step === 3 && (
            <SectionCard title="Coupon de parrainage">
              {/* Toggle */}
              <label className="mb-5 flex cursor-pointer items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={couponEnabled}
                  onClick={() => setCouponEnabled((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    couponEnabled ? "bg-primary" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      couponEnabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="text-sm font-semibold text-secondary">
                  Associer un coupon à cet influenceur
                </span>
              </label>

              {couponEnabled ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-secondary">
                        Réduction (%) <span className="text-danger">*</span>
                      </label>
                      <div className="relative">
                        <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={couponValue}
                          onChange={(e) => setCouponValue(e.target.value)}
                          placeholder="20"
                          required
                          className={`${fieldClass("coupon.value")} pl-9`}
                        />
                      </div>
                      {errors["coupon.value"] && (
                        <p className="mt-1 text-xs text-danger">{errors["coupon.value"]}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-secondary">
                        Commande minimum (FCFA){" "}
                        <span className="font-normal text-slate-400">(optionnel)</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={couponMinOrderAmount}
                        onChange={(e) => setCouponMinOrderAmount(e.target.value)}
                        placeholder="5000"
                        className={fieldClass("coupon.min_order_amount")}
                      />
                      {errors["coupon.min_order_amount"] && (
                        <p className="mt-1 text-xs text-danger">{errors["coupon.min_order_amount"]}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-secondary">
                        Utilisations max{" "}
                        <span className="font-normal text-slate-400">(optionnel)</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={couponMaxUses}
                        onChange={(e) => setCouponMaxUses(e.target.value)}
                        placeholder="100"
                        className={fieldClass("coupon.max_uses")}
                      />
                      {errors["coupon.max_uses"] && (
                        <p className="mt-1 text-xs text-danger">{errors["coupon.max_uses"]}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-secondary">
                        Date d'expiration{" "}
                        <span className="font-normal text-slate-400">(optionnel)</span>
                      </label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="date"
                          min={today}
                          value={couponExpiresAt}
                          onChange={(e) => setCouponExpiresAt(e.target.value)}
                          className={`${fieldClass("coupon.expires_at")} pl-9`}
                        />
                      </div>
                      {errors["coupon.expires_at"] && (
                        <p className="mt-1 text-xs text-danger">{errors["coupon.expires_at"]}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Le coupon sera automatiquement associé à cet influenceur et utilisable par ses filleuls.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Activez l'option ci-dessus pour générer un coupon de réduction lié à cet influenceur.
                </p>
              )}
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : step < 3 ? (
              <>
                Suivant <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              "Créer l'influenceur"
            )}
          </button>

          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setErrors({}); setStep((s) => s - 1); }}
              className="w-full justify-center"
            >
              Retour
            </Button>
          ) : (
            <Button type="button" variant="secondary" href="/influencers" className="w-full justify-center">
              Annuler
            </Button>
          )}

          {/* Recap visible sur le step 3 */}
          {step === 3 && (
            <div className="mt-2 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs">
              <p className="mb-2 font-semibold text-secondary">Récapitulatif</p>
              {name && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Nom</span>
                  <span className="truncate font-medium text-secondary">{name}</span>
                </div>
              )}
              {email && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Email</span>
                  <span className="truncate font-medium text-secondary">{email}</span>
                </div>
              )}
              {commissionPerUser && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Commission</span>
                  <span className="font-medium text-secondary">{commissionPerUser} FCFA</span>
                </div>
              )}
              {minPurchaseForReferral && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Achat min.</span>
                  <span className="font-medium text-secondary">{minPurchaseForReferral} FCFA</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
