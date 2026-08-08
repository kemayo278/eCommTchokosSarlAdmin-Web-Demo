"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { PageHeader, Button, SectionCard } from "@/components/ui/primitives";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";

interface Props {
  forced?: boolean;
}

interface FieldErrors {
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}

function PasswordField({
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-secondary">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 transition focus-within:ring-2 focus-within:ring-primary/20 ${
          error
            ? "border-danger focus-within:border-danger"
            : "border-slate-200 focus-within:border-primary"
        }`}
      >
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          required
          className="h-11 flex-1 bg-transparent text-sm text-secondary placeholder:text-slate-400 outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="shrink-0 text-slate-400 transition hover:text-secondary"
          tabIndex={-1}
          aria-label={show ? "Masquer" : "Afficher"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export default function ChangePasswordForm({ forced = false }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { patchUser } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await axiosClient.post("/v1/change-password", {
        current_password: current,
        password: next,
        password_confirmation: confirm,
      });
      toast({
        title: "Mot de passe modifié",
        description: "Votre nouveau mot de passe est maintenant actif.",
      });
      patchUser({ mustChangePassword: false });
      router.replace("/dashboard");
    } catch (err: any) {
      handleApiError(err, "Impossible de modifier le mot de passe");
      setSubmitting(false);
    }
  }

  return (
    <div className=" space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {!forced && (
          <Button
            type="button"
            variant="secondary"
            href="/dashboard"
            className="px-2.5!"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <PageHeader
          titre={forced ? "Définir votre mot de passe" : "Changer le mot de passe"}
          sousTitre={
            forced
              ? "Votre mot de passe temporaire doit être changé avant de continuer."
              : "Modifiez votre mot de passe de connexion."
          }
        />
      </div>

      {forced && (
        <div className="flex items-start gap-3 rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Pour des raisons de sécurité, vous devez définir un nouveau mot de passe avant d'accéder à l'administration.
          </span>
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        <SectionCard title="Modification du mot de passe">
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              label="Mot de passe actuel"
              value={current}
              onChange={setCurrent}
              error={errors.current_password}
            />

            <PasswordField
              label="Nouveau mot de passe"
              value={next}
              onChange={setNext}
              error={errors.password}
            />
            <p className="-mt-2 text-xs text-slate-400">
              Min. 8 caractères, majuscules, minuscules et chiffres.
            </p>

            <PasswordField
              label="Confirmer le nouveau mot de passe"
              value={confirm}
              onChange={setConfirm}
              error={errors.password_confirmation}
            />

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Enregistrement…" : "Enregistrer le mot de passe"}
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
