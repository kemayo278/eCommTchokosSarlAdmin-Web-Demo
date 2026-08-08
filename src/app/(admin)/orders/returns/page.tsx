"use client";

import { RotateCcw } from "lucide-react";
import { PageHeader, StatCard, Badge, type Tone } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { retours } from "@/lib/data";
import { fcfa } from "@/lib/format";
import type { Retour } from "@/lib/types";

const statutRetour: Record<Retour["statut"], { label: string; tone: Tone }> = {
  demande: { label: "Demandé", tone: "warn" },
  approuve: { label: "Approuvé", tone: "info" },
  refuse: { label: "Refusé", tone: "danger" },
  rembourse: { label: "Remboursé", tone: "primary" },
};

const colonnes: Column<Retour>[] = [
  { cle: "commande", entete: "Commande", rendu: (r) => <span className="font-semibold text-secondary">{r.commande}</span> },
  { cle: "client", entete: "Client", rendu: (r) => r.client },
  { cle: "motif", entete: "Motif", masquerMobile: true, rendu: (r) => r.motif },
  { cle: "date", entete: "Date", masquerMobile: true, rendu: (r) => r.creeLe },
  { cle: "montant", entete: "Montant", aligne: "right", rendu: (r) => <span className="font-semibold">{fcfa(r.montant)}</span> },
  {
    cle: "statut",
    entete: "Statut",
    aligne: "right",
    rendu: (r) => <Badge tone={statutRetour[r.statut].tone}>{statutRetour[r.statut].label}</Badge>,
  },
];

export default function RetoursPage() {
  const enCours = retours.filter((r) => r.statut === "demande").length;
  const rembourse = retours
    .filter((r) => r.statut === "rembourse")
    .reduce((s, r) => s + r.montant, 0);

  return (
    <div className="space-y-6">
      <PageHeader titre="Retours" sousTitre="Demandes de retour et remboursements" />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Demandes en attente" valeur={String(enCours)} icon={<RotateCcw className="h-5 w-5" />} tone="warn" />
        <StatCard label="Total remboursé" valeur={fcfa(rembourse)} icon={<RotateCcw className="h-5 w-5" />} tone="primary" />
        <StatCard label="Taux de retour" valeur="2,4 %" icon={<RotateCcw className="h-5 w-5" />} tone="info" />
      </div>
      <DataTable columns={colonnes} rows={retours} />
    </div>
  );
}