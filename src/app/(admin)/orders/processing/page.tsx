import Link from "next/link";
import { PageHeader, Card } from "@/components/ui/primitives";
import { commandes } from "@/lib/data";
import { fcfa } from "@/lib/format";
import type { StatutCommande } from "@/lib/types";

const colonnes: { statut: StatutCommande; titre: string; teinte: string }[] = [
  { statut: "en_attente", titre: "En attente", teinte: "bg-warn" },
  { statut: "en_traitement", titre: "En traitement", teinte: "bg-info" },
  { statut: "expediee", titre: "Expédiées", teinte: "bg-primary" },
];

export default function TraitementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titre="Traitement des commandes"
        sousTitre="Suivez les commandes à préparer et à expédier"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {colonnes.map((col) => {
          const liste = commandes.filter((c) => c.statut === col.statut);
          return (
            <div key={col.statut} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className={`h-2.5 w-2.5 rounded-full ${col.teinte}`} />
                <h2 className="text-sm font-bold text-secondary">{col.titre}</h2>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                  {liste.length}
                </span>
              </div>

              <div className="space-y-3">
                {liste.map((c) => (
                  <Link key={c.id} href={`/orders/${c.id}`}>
                    <Card className="p-4 transition hover:border-primary/40 hover:shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-secondary">{c.numero}</p>
                        <p className="text-sm font-semibold text-primary-dark">{fcfa(c.total)}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{c.client}</p>
                      <p className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>{c.quartier}</span>
                        <span>{c.articles.length} article(s)</span>
                      </p>
                    </Card>
                  </Link>
                ))}
                {liste.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                    Aucune commande
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
