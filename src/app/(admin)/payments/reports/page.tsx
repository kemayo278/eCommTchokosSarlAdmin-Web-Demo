import { Download, Landmark, TrendingUp, Wallet } from "lucide-react";
import { PageHeader, StatCard, SectionCard, Button } from "@/components/ui/primitives";
import { BarresVentes, CamembertPaiements } from "@/components/ui/Charts";
import { repartitionPaiements, ventesMensuelles } from "@/lib/data";
import { fcfa } from "@/lib/format";

export default function RapportsPage() {
  const total = ventesMensuelles.reduce((s, m) => s + m.ventes, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Rapports financiers"
        sousTitre="Synthèse des revenus de l'année"
        action={
          <Button variant="secondary">
            <Download className="h-4 w-4" /> Exporter le rapport
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Revenu total (année)" valeur={fcfa(total)} icon={<TrendingUp className="h-5 w-5" />} tone="primary" />
        <StatCard label="Commission plateforme" valeur={fcfa(total * 0.05)} icon={<Landmark className="h-5 w-5" />} tone="info" />
        <StatCard label="Net reversé" valeur={fcfa(total * 0.95)} icon={<Wallet className="h-5 w-5" />} tone="warn" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Revenus mensuels" className="lg:col-span-2">
          <BarresVentes data={ventesMensuelles} cle="ventes" x="mois" />
        </SectionCard>
        <SectionCard title="Répartition des encaissements">
          <CamembertPaiements data={repartitionPaiements} />
        </SectionCard>
      </div>
    </div>
  );
}
