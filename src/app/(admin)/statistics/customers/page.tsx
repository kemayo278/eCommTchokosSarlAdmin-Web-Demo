"use client";

import { Users, UserPlus, Repeat } from "lucide-react";
import { PageHeader, SectionCard, StatCard } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { clients } from "@/lib/data";
import { fcfa } from "@/lib/format";
import type { Client } from "@/lib/types";

const colonnes: Column<Client>[] = [
  {
    cle: "nom",
    entete: "Client",
    rendu: (c) => (
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
          {c.nom.split(" ").map((m) => m[0]).join("").slice(0, 2)}
        </span>
        <div>
          <p className="font-semibold text-secondary">{c.nom}</p>
          <p className="text-xs text-slate-400">{c.email}</p>
        </div>
      </div>
    ),
  },
  { cle: "commandes", entete: "Commandes", aligne: "center", masquerMobile: true, rendu: (c) => c.commandes },
  { cle: "total", entete: "Total dépensé", aligne: "right", rendu: (c) => <span className="font-semibold">{fcfa(c.totalDepense)}</span> },
  { cle: "dernier", entete: "Dernier achat", aligne: "right", masquerMobile: true, rendu: (c) => c.dernierAchat },
];

export default function StatsClientsPage() {
  const top = [...clients].sort((a, b) => b.totalDepense - a.totalDepense);

  return (
    <div className="space-y-6">
      <PageHeader titre="Clients" sousTitre="Analyse de la clientèle" />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Clients totaux" valeur="486" icon={<Users className="h-5 w-5" />} variation="+6,4 %" tone="primary" />
        <StatCard label="Nouveaux ce mois" valeur="52" icon={<UserPlus className="h-5 w-5" />} variation="+14,0 %" tone="info" />
        <StatCard label="Taux de fidélité" valeur="38 %" icon={<Repeat className="h-5 w-5" />} tone="warn" />
      </div>

      <div>
        <h2 className="mb-3 font-bold tracking-tight text-secondary">Meilleurs clients</h2>
        <DataTable columns={colonnes} rows={top} />
      </div>
    </div>
  );
}