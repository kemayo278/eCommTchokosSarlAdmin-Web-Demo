"use client";

import { LifeBuoy, Mail, MessageCircle, Phone } from "lucide-react";
import { PageHeader, StatCard, Badge, type Tone } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { BadgeTicket } from "@/components/ui/statuts";
import { tickets } from "@/lib/data";
import type { Ticket } from "@/lib/types";

const canalIcon = {
  email: Mail,
  whatsapp: MessageCircle,
  telephone: Phone,
};

const prioriteTone: Record<Ticket["priorite"], Tone> = {
  basse: "neutral",
  normale: "info",
  haute: "danger",
};

const colonnes: Column<Ticket>[] = [
  {
    cle: "sujet",
    entete: "Sujet",
    rendu: (t) => {
      const Icon = canalIcon[t.canal];
      return (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-secondary">{t.sujet}</p>
            <p className="text-xs text-slate-400">{t.client}</p>
          </div>
        </div>
      );
    },
  },
  { cle: "date", entete: "Créé le", masquerMobile: true, rendu: (t) => t.creeLe },
  { cle: "priorite", entete: "Priorité", aligne: "center", masquerMobile: true, rendu: (t) => <Badge tone={prioriteTone[t.priorite]}>{t.priorite}</Badge> },
  { cle: "statut", entete: "Statut", aligne: "right", rendu: (t) => <BadgeTicket statut={t.statut} /> },
];

export default function SupportPage() {
  const ouverts = tickets.filter((t) => t.statut === "ouvert").length;
  const enCours = tickets.filter((t) => t.statut === "en_cours").length;

  return (
    <div className="space-y-6">
      <PageHeader titre="Support client" sousTitre="Tickets et demandes des clients" />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Tickets ouverts" valeur={String(ouverts)} icon={<LifeBuoy className="h-5 w-5" />} tone="danger" />
        <StatCard label="En cours" valeur={String(enCours)} icon={<LifeBuoy className="h-5 w-5" />} tone="warn" />
        <StatCard label="Temps de réponse moyen" valeur="2 h 15" icon={<LifeBuoy className="h-5 w-5" />} tone="info" />
      </div>

      <DataTable columns={colonnes} rows={tickets} />
    </div>
  );
}