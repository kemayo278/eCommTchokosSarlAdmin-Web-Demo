"use client";

import { useMemo, useState } from "react";
import { Smartphone } from "lucide-react";
import { PageHeader, StatCard, Badge } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { BadgeTransaction } from "@/components/ui/statuts";
import { paiements } from "@/lib/data";
import { fcfa } from "@/lib/format";
import type { MethodePaiement, Paiement } from "@/lib/types";

const label: Record<MethodePaiement, string> = {
  momo: "MTN MoMo",
  om: "Orange Money",
  carte: "Carte",
  especes: "Espèces",
};

const filtres: { cle: "tous" | MethodePaiement; label: string }[] = [
  { cle: "tous", label: "Tous" },
  { cle: "momo", label: "MTN MoMo" },
  { cle: "om", label: "Orange Money" },
];

const colonnes: Column<Paiement>[] = [
  { cle: "tx", entete: "ID transaction", rendu: (p) => <span className="font-mono text-xs font-semibold text-secondary">{p.transactionId}</span> },
  { cle: "client", entete: "Client", masquerMobile: true, rendu: (p) => p.client },
  { cle: "methode", entete: "Opérateur", rendu: (p) => <Badge tone={p.methode === "om" ? "warn" : "neutral"}>{label[p.methode]}</Badge> },
  { cle: "date", entete: "Date", masquerMobile: true, rendu: (p) => p.creeLe },
  { cle: "montant", entete: "Montant", aligne: "right", rendu: (p) => <span className="font-semibold">{fcfa(p.montant)}</span> },
  { cle: "statut", entete: "Statut", aligne: "right", rendu: (p) => <BadgeTransaction statut={p.statut} /> },
];

export default function TransactionsMobilePage() {
  const [f, setF] = useState<"tous" | MethodePaiement>("tous");
  const mobile = paiements.filter((p) => p.methode === "momo" || p.methode === "om");

  const liste = useMemo(
    () => (f === "tous" ? mobile : mobile.filter((p) => p.methode === f)),
    [f, mobile]
  );

  const momo = mobile.filter((p) => p.methode === "momo").reduce((s, p) => s + p.montant, 0);
  const om = mobile.filter((p) => p.methode === "om").reduce((s, p) => s + p.montant, 0);

  return (
    <div className="space-y-6">
      <PageHeader titre="Transactions MoMo / OM" sousTitre="Paiements par mobile money" />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Total MTN MoMo" valeur={fcfa(momo)} icon={<Smartphone className="h-5 w-5" />} tone="warn" />
        <StatCard label="Total Orange Money" valeur={fcfa(om)} icon={<Smartphone className="h-5 w-5" />} tone="warn" />
      </div>

      <div className="flex gap-2">
        {filtres.map((x) => (
          <button
            key={x.cle}
            onClick={() => setF(x.cle)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              f === x.cle ? "bg-secondary text-white" : "border border-slate-200 bg-surface text-slate-500 hover:text-secondary"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <DataTable columns={colonnes} rows={liste} />
    </div>
  );
}
