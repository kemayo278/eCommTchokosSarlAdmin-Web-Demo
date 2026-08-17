"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { ALLOWED, useAuth } from "@/contexts/auth";
import { setAuthToken } from "@/lib/api/axiosClient";
import { AuthSidePanel } from "@/components/auth/AuthSidePanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";

export default function LoginForm() {
  const { user, loading, login, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [voir, setVoir] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    setAuthToken(null);
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("tc-widget-session-")) localStorage.removeItem(key);
    });
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace(redirectTo);
  }, [loading, user, router]);

  useEffect(() => {
    const saved = localStorage.getItem("tc_remember_email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    if (rememberMe) {
      localStorage.setItem("tc_remember_email", email);
    } else {
      localStorage.removeItem("tc_remember_email");
    }

    try {
      const data = await login(email, motDePasse, rememberMe);
      const hasAccess = data.user.roles.some((r) => ALLOWED.includes(r));
      if (!hasAccess) {
        logout(data.user.id);
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les droits nécessaires pour accéder à cette interface.",
          variant: "destructive"
        });
        return;
      }
      router.replace(redirectTo);
    } catch (err: any) {
      const message = handleApiError(err);
      setErreur(message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <AuthSidePanel
        title={
          <>
            Pilotez tout le site,
            <br />
            <span className="text-primary">depuis un seul endroit.</span>
          </>
        }
        description="Produits, commandes, paiements MoMo/OM, vidéos et statistiques — l'administration complète de votre boutique en ligne."
      />

      <AuthCard>
        <h2 className="text-xl font-bold tracking-tight">Connexion admin</h2>
        <p className="mt-1 text-sm text-slate-500">
          Accédez au tableau de bord de gestion.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-secondary">E-mail</span>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Mail className="h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-secondary">
              Mot de passe
            </span>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                type={voir ? "text" : "password"}
                required
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="********"
                className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setVoir((v) => !v)}
                className="text-slate-400 transition hover:text-secondary"
                aria-label={voir ? "Masquer" : "Afficher"}
              >
                {voir ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-primary"
              />
              <span className="text-sm text-slate-500">Se souvenir de moi</span>
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-sm font-semibold text-primary transition hover:text-primary-dark"
            >
              Mot de passe oublié ?
            </Link>
          </div>

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
            {envoi ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </AuthCard>
    </>
  );
}
