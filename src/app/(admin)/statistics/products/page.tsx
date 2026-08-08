"use client";

import { PageHeader, SectionCard, StatCard, Badge } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { BarresVentes } from "@/components/ui/Charts";
import { produits, ventesParCategorie } from "@/lib/data";
import { fcfa } from "@/lib/format";
import type { Produit } from "@/lib/types";

const colonnes: Column<Produit>[] = [
  {
    cle: "nom",
    entete: "Produit",
    rendu: (p) => (
      <div>
        <p className="font-semibold text-secondary">{p.nom}</p>
        <p className="text-xs text-slate-400">{p.categorie}</p>
      </div>
    ),
  },
  { cle: "ventes", entete: "Ventes", aligne: "center", rendu: (p) => <Badge tone="primary">{p.ventes}</Badge> },
  { cle: "ca", entete: "CA généré", aligne: "right", masquerMobile: true, rendu: (p) => fcfa(p.ventes * p.prix) },
  { cle: "stock", entete: "Stock", aligne: "right", rendu: (p) => p.stock },
];

export default function StatsProduitsPage() {
  const top = [...produits].sort((a, b) => b.ventes - a.ventes);
  const rupture = produits.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      <PageHeader titre="Performances produits" sousTitre="Meilleures ventes et stocks" />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Produits vendus" valeur="1 892" icon={<span className="text-lg">▣</span>} tone="primary" />
        <StatCard label="Meilleure vente" valeur={top[0].nom.split(" ").slice(0, 2).join(" ")} icon={<span className="text-lg">★</span>} tone="warn" />
        <StatCard label="En rupture" valeur={String(rupture)} icon={<span className="text-lg">!</span>} tone="danger" />
      </div>

      <SectionCard title="Ventes par catégorie">
        <BarresVentes data={ventesParCategorie} cle="ventes" x="categorie" />
      </SectionCard>

      <div>
        <h2 className="mb-3 font-bold tracking-tight text-secondary">Classement des produits</h2>
        <DataTable columns={colonnes} rows={top} />
      </div>
    </div>
  );
}