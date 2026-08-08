"use client";

import { CreditCard, TrendingUp, Wallet } from "lucide-react";
import { PageHeader, StatCard, Badge } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { BadgeTransaction } from "@/components/ui/statuts";
import { paiements } from "@/lib/data";
import { fcfa } from "@/lib/format";
import type { MethodePaiement, Paiement } from "@/lib/types";

const methodeLabel: Record<MethodePaiement, string> = {
  momo: "MoMo",
  om: "Orange Money",
  carte: "Carte",
  especes: "Espèces",
};

const colonnes: Column<Paiement>[] = [
  { cle: "tx", entete: "Transaction", rendu: (p) => <span className="font-mono text-xs font-semibold text-secondary">{p.transactionId}</span> },
  { cle: "commande", entete: "Commande", masquerMobile: true, rendu: (p) => p.commande },
  { cle: "client", entete: "Client", masquerMobile: true, rendu: (p) => p.client },
  { cle: "methode", entete: "Méthode", rendu: (p) => <Badge tone="neutral">{methodeLabel[p.methode]}</Badge> },
  { cle: "montant", entete: "Montant", aligne: "right", rendu: (p) => <span className="font-semibold">{fcfa(p.montant)}</span> },
  { cle: "statut", entete: "Statut", aligne: "right", rendu: (p) => <BadgeTransaction statut={p.statut} /> },
];

export default function PaiementsPage() {
  const encaisse = paiements.filter((p) => p.statut === "reussie").reduce((s, p) => s + p.montant, 0);
  const enAttente = paiements.filter((p) => p.statut === "en_attente").reduce((s, p) => s + p.montant, 0);

  return (
    <div className="space-y-6">
      <PageHeader titre="Historique des paiements" sousTitre={`${paiements.length} transactions`} />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Encaissé" valeur={fcfa(encaisse)} icon={<TrendingUp className="h-5 w-5" />} tone="primary" />
        <StatCard label="En attente" valeur={fcfa(enAttente)} icon={<Wallet className="h-5 w-5" />} tone="warn" />
        <StatCard label="Transactions" valeur={String(paiements.length)} icon={<CreditCard className="h-5 w-5" />} tone="info" />
      </div>
      <DataTable columns={colonnes} rows={paiements} />
    </div>
  );
}