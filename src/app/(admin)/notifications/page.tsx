"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BellOff,
  CreditCard,
  Info,
  LifeBuoy,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import { notificationsAdmin } from "@/lib/data";
import type { NotificationAdmin, TypeNotification } from "@/lib/types";

const icones: Record<TypeNotification, typeof ShoppingCart> = {
  commande: ShoppingCart,
  paiement: CreditCard,
  stock: AlertTriangle,
  ticket: LifeBuoy,
  retour: RotateCcw,
  systeme: Info,
};

const teintes: Record<TypeNotification, string> = {
  commande: "bg-primary-soft text-primary-dark",
  paiement: "bg-info-soft text-info",
  stock: "bg-warn-soft text-warn",
  ticket: "bg-danger-soft text-danger",
  retour: "bg-warn-soft text-warn",
  systeme: "bg-slate-100 text-slate-500",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationAdmin[]>(notificationsAdmin);
  const nonLues = items.filter((n) => !n.lu).length;

  const groupes = useMemo(() => {
    const map = new Map<string, NotificationAdmin[]>();
    for (const n of items) {
      if (!map.has(n.date)) map.set(n.date, []);
      map.get(n.date)!.push(n);
    }
    return Array.from(map.entries());
  }, [items]);

  function marquerLu(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
  }

  function toutMarquer() {
    setItems((prev) => prev.map((n) => ({ ...n, lu: true })));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Notifications"
        sousTitre={nonLues > 0 ? `${nonLues} non lue(s)` : "Vous êtes à jour"}
        action={
          nonLues > 0 ? (
            <button
              onClick={toutMarquer}
              className="rounded-full border border-slate-200 bg-surface px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-secondary"
            >
              Tout marquer comme lu
            </button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-surface py-16 text-center">
          <BellOff className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-semibold text-secondary">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupes.map(([date, liste]) => (
            <div key={date}>
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                {date}
              </p>
              <div className="space-y-2">
                {liste.map((n) => {
                  const Icon = icones[n.type];
                  const contenu = (
                    <div
                      className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                        n.lu
                          ? "border-slate-100 bg-surface"
                          : "border-primary/20 bg-primary-soft/40"
                      }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${teintes[n.type]}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-secondary">{n.titre}</p>
                          {!n.lu && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                        <p className="mt-1 text-xs text-slate-400">{n.heure}</p>
                      </div>
                    </div>
                  );

                  return n.href ? (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => marquerLu(n.id)}
                      className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {contenu}
                    </Link>
                  ) : (
                    <button key={n.id} onClick={() => marquerLu(n.id)} className="block w-full text-left">
                      {contenu}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
