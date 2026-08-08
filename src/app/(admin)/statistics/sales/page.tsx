import { PageHeader, StatCard, SectionCard } from "@/components/ui/primitives";
import { AireVentes, BarresVentes, LigneCommandes } from "@/components/ui/Charts";
import { ventes7Jours, ventesMensuelles } from "@/lib/data";
import { fcfa } from "@/lib/format";

export default function StatsVentesPage() {
  const semaine = ventes7Jours.reduce((s, j) => s + j.montant, 0);
  const meilleurJour = [...ventes7Jours].sort((a, b) => b.montant - a.montant)[0];

  return (
    <div className="space-y-6">
      <PageHeader titre="Ventes" sousTitre="Analyse détaillée des ventes" />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Ventes cette semaine" valeur={fcfa(semaine)} icon={<span className="text-lg">₣</span>} tone="primary" />
        <StatCard label="Meilleur jour" valeur={meilleurJour.jour} icon={<span className="text-lg">★</span>} tone="warn" />
        <StatCard label="Panier moyen" valeur={fcfa(24580)} icon={<span className="text-lg">◇</span>} tone="info" />
      </div>

      <SectionCard title="Ventes des 7 derniers jours">
        <BarresVentes data={ventes7Jours} cle="montant" x="jour" />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Chiffre d'affaires mensuel">
          <AireVentes data={ventesMensuelles} cle="ventes" x="mois" />
        </SectionCard>
        <SectionCard title="Nombre de commandes">
          <LigneCommandes data={ventesMensuelles} cle="commandes" x="mois" />
        </SectionCard>
      </div>
    </div>
  );
}
