import { Landmark, TrendingUp, Wallet, Percent } from "lucide-react";
import { PageHeader, SectionCard, StatCard } from "@/components/ui/primitives";
import { AireVentes, CamembertPaiements } from "@/components/ui/Charts";
import { repartitionPaiements, ventesMensuelles } from "@/lib/data";
import { fcfa } from "@/lib/format";

export default function StatsFinancieresPage() {
  const revenu = ventesMensuelles.reduce((s, m) => s + m.ventes, 0);
  const marge = revenu * 0.32;

  return (
    <div className="space-y-6">
      <PageHeader titre="Statistiques financières" sousTitre="Revenus, marges et encaissements" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenu total" valeur={fcfa(revenu)} icon={<TrendingUp className="h-5 w-5" />} tone="primary" />
        <StatCard label="Marge brute" valeur={fcfa(marge)} icon={<Wallet className="h-5 w-5" />} tone="info" />
        <StatCard label="Taux de marge" valeur="32 %" icon={<Percent className="h-5 w-5" />} tone="warn" />
        <StatCard label="Frais de transaction" valeur={fcfa(revenu * 0.02)} icon={<Landmark className="h-5 w-5" />} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Revenus mensuels" className="lg:col-span-2">
          <AireVentes data={ventesMensuelles} cle="ventes" x="mois" />
        </SectionCard>
        <SectionCard title="Encaissements par canal">
          <CamembertPaiements data={repartitionPaiements} />
        </SectionCard>
      </div>
    </div>
  );
}
