"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { AuthSidePanel } from "@/components/auth/AuthSidePanel";
import { AuthCard } from "@/components/auth/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (!email.trim()) {
      setErreur("Veuillez saisir votre adresse e-mail.");
      return;
    }

    setEnvoi(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setEnvoye(true);
    } catch {
      setErreur("Impossible d'envoyer le lien. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <AuthSidePanel
        title={
          <>
            Mot de passe oublié ?
            <br />
            <span className="text-primary">On vous aide à revenir.</span>
          </>
        }
        description="Saisissez l'adresse e-mail associée à votre compte administrateur et nous vous enverrons un lien pour réinitialiser votre mot de passe."
      />

      <AuthCard>
        {envoye ? (
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-xl font-bold tracking-tight">
              Vérifiez votre boîte mail
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Si un compte est associé à{" "}
              <span className="font-semibold text-secondary">{email}</span>,
              vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <Link
              href="/auth/login"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-dark"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold tracking-tight">
              Réinitialiser le mot de passe
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Nous vous enverrons un lien de réinitialisation par e-mail.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-secondary">
                  E-mail
                </span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@tchokos.cm"
                    className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              {erreur && (
                <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                  {erreur}
                </p>
              )}

              <button
                type="submit"
                disabled={envoi}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
              >
                {envoi && <Loader2 className="h-4 w-4 animate-spin" />}
                {envoi ? "Envoi…" : "Envoyer le lien"}
              </button>
            </form>

            <Link
              href="/auth/login"
              className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </>
        )}
      </AuthCard>
    </>
  );
}
