"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { PageHeader, Button, SectionCard } from "@/components/ui/primitives";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";
import type { Zone } from "@/types/zone";

type Role = "admin" | "manager" | "developpeur" | "livreur";

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "developpeur", label: "Développeur" },
  { value: "livreur", label: "Livreur" },
];

const ROLE_NEEDS_POSITION: Role[] = ["admin", "manager", "developpeur"];

interface CreateUserResponse {
  user: { id: number; name: string; email: string };
  temporary_password: string;
}

export default function UserForm() {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [position, setPosition] = useState("");
  const [maxSelfAssign, setMaxSelfAssign] = useState("");
  const [selectedZones, setSelectedZones] = useState<number[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CreateUserResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (role === "livreur") {
      axiosClient
        .get<Zone[]>("/v1/zones")
        .then(({ data }) => setZones(data))
        .catch(() => {});
    }
  }, [role]);

  function fieldClass(key: string) {
    return `h-10 w-full rounded-xl border px-3 text-sm text-secondary placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-primary/20 ${
      errors[key]
        ? "border-danger focus:border-danger"
        : "border-slate-200 focus:border-primary"
    }`;
  }

  function toggleZone(id: number) {
    setSelectedZones((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name,
        email,
        phone: phone || null,
        role,
      };
      if (ROLE_NEEDS_POSITION.includes(role) && position) {
        payload.position = position;
      }
      if (role === "livreur") {
        if (maxSelfAssign) payload.max_self_assign_deliveries = Number(maxSelfAssign);
        if (selectedZones.length) payload.zone_ids = selectedZones;
      }

      const { data } = await axiosClient.post<CreateUserResponse>(
        "/v1/admin/users",
        payload
      );
      setResult(data);
    } catch (err: unknown) {
      const anyErr = err as any;
      if (anyErr?.response?.status === 422 && anyErr.response.data?.errors) {
        const apiErrors: Record<string, string[]> = anyErr.response.data.errors;
        const fieldErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(apiErrors)) {
          fieldErrors[key] = msgs[0];
        }
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Erreur",
          description: handleApiError(err),
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function copyPassword() {
    if (!result) return;
    navigator.clipboard.writeText(result.temporary_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="mx-auto max-w-md space-y-6 pt-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
            <Check className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-secondary">Utilisateur créé !</h1>
          <p className="text-sm text-slate-500">
            Le compte de{" "}
            <span className="font-semibold text-secondary">{result.user.name}</span> a
            été créé. Partagez le mot de passe temporaire ci-dessous.
          </p>
        </div>

        <SectionCard title="Mot de passe temporaire">
          <p className="mb-3 text-xs text-slate-400">
            Ce mot de passe ne sera plus accessible après avoir quitté cette page.
            L'utilisateur devra le changer à sa première connexion.
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Lock className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="flex-1 font-mono text-sm font-semibold tracking-wide text-secondary">
              {result.temporary_password}
            </span>
            <button
              type="button"
              onClick={copyPassword}
              className="ml-2 flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
        </SectionCard>

        <Button href="/settings/users" className="w-full justify-center">
          Retourner à la liste
        </Button>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" href="/settings/users" className="px-2.5!">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          titre="Nouvel utilisateur"
          sousTitre="Crée un compte admin, manager, développeur ou livreur"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">

          {/* Informations personnelles */}
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
                    placeholder="jean@tchokos.cm"
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
                    placeholder="+2250101020304"
                    className={`${fieldClass("phone")} pl-9`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone}</p>}
              </div>
            </div>
          </SectionCard>

          {/* Rôle & accès */}
          <SectionCard title="Rôle & accès">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Rôle <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setRole(r.value);
                        setSelectedZones([]);
                        setPosition("");
                      }}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        role === r.value
                          ? "border-primary bg-primary-soft text-primary-dark"
                          : "border-slate-200 bg-surface text-slate-500 hover:border-primary/40 hover:text-secondary"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {errors.role && <p className="mt-1 text-xs text-danger">{errors.role}</p>}
              </div>

              {/* Position — admin, manager, developpeur */}
              {ROLE_NEEDS_POSITION.includes(role) && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-secondary">
                    Poste{" "}
                    <span className="font-normal text-slate-400">(optionnel)</span>
                  </label>
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder={`ex: Responsable ${role}`}
                    className={fieldClass("position")}
                  />
                  {errors.position && (
                    <p className="mt-1 text-xs text-danger">{errors.position}</p>
                  )}
                </div>
              )}

              {/* Livreur-specific */}
              {role === "livreur" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-secondary">
                      Max livraisons auto-assignées{" "}
                      <span className="font-normal text-slate-400">(optionnel)</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={maxSelfAssign}
                      onChange={(e) => setMaxSelfAssign(e.target.value)}
                      placeholder="5"
                      className={fieldClass("max_self_assign_deliveries")}
                    />
                    {errors.max_self_assign_deliveries && (
                      <p className="mt-1 text-xs text-danger">
                        {errors.max_self_assign_deliveries}
                      </p>
                    )}
                  </div>

                  {zones.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-secondary">
                        Zones de livraison{" "}
                        <span className="font-normal text-slate-400">(optionnel)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {zones.map((z) => (
                          <button
                            key={z.id}
                            type="button"
                            onClick={() => toggleZone(z.id)}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                              selectedZones.includes(z.id)
                                ? "border-primary bg-primary-soft text-primary-dark"
                                : "border-slate-200 bg-surface text-slate-500 hover:border-primary/40"
                            }`}
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            {z.name}
                          </button>
                        ))}
                      </div>
                      {errors.zone_ids && (
                        <p className="mt-1 text-xs text-danger">{errors.zone_ids}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Création…" : "Créer l'utilisateur"}
          </button>
          <Button
            type="button"
            variant="secondary"
            href="/settings/users"
            className="w-full justify-center"
          >
            Annuler
          </Button>

          <div className="mt-2 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-400">
            <p className="font-semibold text-secondary">À noter</p>
            <p>Un mot de passe temporaire sera généré automatiquement.</p>
            <p>L'utilisateur devra le changer à sa première connexion.</p>
          </div>
        </div>
      </div>
    </form>
  );
}
