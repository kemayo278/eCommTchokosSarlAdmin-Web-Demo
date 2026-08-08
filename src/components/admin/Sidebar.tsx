"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, KeyRound, LogOut, Store } from "lucide-react";
import { nav } from "@/lib/nav";
import { useAuth } from "@/contexts/auth";
import { initiales } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function hrefActif(pathname: string): string | null {
  let meilleur: string | null = null;
  let longueur = -1;
  for (const groupe of nav) {
    const cibles = groupe.href
      ? [groupe.href]
      : (groupe.children ?? []).map((c) => c.href);
    for (const href of cibles) {
      const correspond =
        pathname === href || pathname.startsWith(href + "/");
      if (correspond && href.length > longueur) {
        longueur = href.length;
        meilleur = href;
      }
    }
  }
  return meilleur;
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const actif = hrefActif(pathname);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const groupeActif = nav.find((g) =>
    g.children?.some((c) => c.href === actif)
  )?.label;

  const ouvertsParDefaut = ["Produits", "Commandes", "Paiements", "Paramètres"];

  const [ouverts, setOuverts] = useState<string[]>(
    groupeActif
      ? [...new Set([...ouvertsParDefaut, groupeActif])]
      : ouvertsParDefaut
  );

  useEffect(() => {
    if (groupeActif && !ouverts.includes(groupeActif)) {
      setOuverts((o) => [...o, groupeActif]);
    }
  }, [groupeActif, ouverts]);

  function basculer(label: string) {
    setOuverts((o) =>
      o.includes(label) ? o.filter((l) => l !== label) : [...o, label]
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-white">
          <Store className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="font-extrabold tracking-tight text-secondary">Tchokos Sarl</p>
          <p className="text-xs font-medium text-primary">Administration</p>
        </div>
      </div>

      <nav className="scroll-slim flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {nav.map((groupe) => {
            const Icon = groupe.icon;

            if (groupe.href) {
              const estActif = actif === groupe.href;
              return (
                <li key={groupe.label}>
                  <Link
                    href={groupe.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      estActif
                        ? "bg-primary-soft text-primary-dark"
                        : "text-slate-500 hover:bg-slate-50 hover:text-secondary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {groupe.label}
                  </Link>
                </li>
              );
            }

            const ouvert = ouverts.includes(groupe.label);
            const contientActif = groupe.children?.some((c) => c.href === actif);

            return (
              <li key={groupe.label}>
                <button
                  onClick={() => basculer(groupe.label)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    contientActif
                      ? "text-secondary"
                      : "text-slate-500 hover:bg-slate-50 hover:text-secondary"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 text-left">{groupe.label}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition ${
                      ouvert ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {ouvert && (
                  <ul className="mt-1 space-y-0.5 pl-11">
                    {groupe.children!.map((enfant) => {
                      const estActif = actif === enfant.href;
                      return (
                        <li key={enfant.href}>
                          <Link
                            href={enfant.href}
                            onClick={onNavigate}
                            className={`block rounded-lg px-3 py-2 text-sm transition ${
                              estActif
                                ? "bg-primary-soft font-semibold text-primary-dark"
                                : "text-slate-500 hover:bg-slate-50 hover:text-secondary"
                            }`}
                          >
                            {enfant.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {user ? initiales(user.name) : "–"}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-secondary">
              {user?.name}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.role}</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/account/change-password"
              onClick={onNavigate}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-primary-soft hover:text-primary"
              aria-label="Changer le mot de passe"
              title="Changer le mot de passe"
            >
              <KeyRound className="h-4 w-4" />
            </Link>

            <Dialog open={confirmLogoutOpen} onOpenChange={setConfirmLogoutOpen}>
              <button
                type="button"
                onClick={() => setConfirmLogoutOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-danger-soft hover:text-danger"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmer la déconnexion</DialogTitle>
                  <DialogDescription>
                    Voulez-vous vraiment quitter la session administrateur ?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <button
                    type="button"
                    onClick={() => setConfirmLogoutOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmLogoutOpen(false);
                      logout();
                      onNavigate?.();
                    }}
                    className="rounded-xl bg-danger px-4 py-2 text-sm font-bold text-white transition hover:opacity-80"
                  >
                    Se déconnecter
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

    </div>
  );
}
