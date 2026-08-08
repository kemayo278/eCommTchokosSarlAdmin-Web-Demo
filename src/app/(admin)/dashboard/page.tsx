"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader, StatCard, SectionCard, Card } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AireVentes, CamembertPaiements } from "@/components/ui/Charts";
import { BadgeCommande } from "@/components/ui/statuts";
import {
  commandes,
  produits,
  repartitionPaiements,
  ventes7Jours,
} from "@/lib/data";
import { fcfa } from "@/lib/format";
import type { Commande } from "@/lib/types";

const colonnes: Column<Commande>[] = [
  { cle: "numero", entete: "Commande", rendu: (c) => <span className="font-semibold text-secondary">{c.numero}</span> },
  { cle: "client", entete: "Client", rendu: (c) => c.client, masquerMobile: true },
  { cle: "total", entete: "Total", aligne: "right", rendu: (c) => <span className="font-semibold">{fcfa(c.total)}</span> },
  { cle: "statut", entete: "Statut", aligne: "right", rendu: (c) => <BadgeCommande statut={c.statut} /> },
];

export default function DashboardPage() {
  const topProduits = [...produits].sort((a, b) => b.ventes - a.ventes).slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Tableau de bord"
        sousTitre="Aperçu de l'activité — 8 juillet 2026"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Chiffre d'affaires (jour)" valeur={fcfa(623000)} icon={<TrendingUp className="h-5 w-5" />} variation="+12,4 %" tone="primary" />
        <StatCard label="Commandes du jour" valeur="24" icon={<ShoppingCart className="h-5 w-5" />} variation="+8,0 %" tone="info" />
        <StatCard label="Panier moyen" valeur={fcfa(25958)} icon={<Package className="h-5 w-5" />} variation="+3,1 %" tone="warn" />
        <StatCard label="Nouveaux clients" valeur="7" icon={<Users className="h-5 w-5" />} variation="-2,0 %" tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Ventes des 7 derniers jours" className="lg:col-span-2">
          <AireVentes data={ventes7Jours} cle="montant" x="jour" />
        </SectionCard>
        <SectionCard title="Répartition paiements">
          <CamembertPaiements data={repartitionPaiements} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold tracking-tight text-secondary">Commandes récentes</h2>
            <Link href="/orders" className="text-sm font-semibold text-primary-dark hover:underline">
              Voir tout
            </Link>
          </div>
          <DataTable columns={colonnes} rows={commandes.slice(0, 5)} link={(c) => `/orders/${c.id}`} />
        </div>

        <SectionCard title="Meilleures ventes">
          <ul className="space-y-4">
            {topProduits.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-secondary">{p.nom}</p>
                  <p className="text-xs text-slate-400">{p.ventes} ventes</p>
                </div>
                <span className="text-sm font-semibold text-primary-dark">{fcfa(p.prix)}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <Card className="flex items-center justify-between gap-4 bg-secondary p-5 text-white">
        <div>
          <p className="font-bold">Prêt à faire vivre le site&nbsp;?</p>
          <p className="text-sm text-slate-300">Ajoutez un produit ou publiez une vidéo produit.</p>
        </div>
        <Link
          href="/products/new"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
        >
          Nouveau produit <ArrowUpRight className="h-4 w-4" />
        </Link>
      </Card>
    </div>
  );
}