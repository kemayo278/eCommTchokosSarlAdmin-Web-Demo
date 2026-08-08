import { BarChart3, Package, ShoppingCart, Users } from "lucide-react";
import { PageHeader, StatCard, SectionCard } from "@/components/ui/primitives";
import { AireVentes, BarresVentes, CamembertPaiements } from "@/components/ui/Charts";
import {
  repartitionPaiements,
  ventesMensuelles,
  ventesParCategorie,
} from "@/lib/data";
import { fcfa } from "@/lib/format";

export default function StatistiquesPage() {
  const total = ventesMensuelles.reduce((s, m) => s + m.ventes, 0);
  const commandes = ventesMensuelles.reduce((s, m) => s + m.commandes, 0);

  return (
    <div className="space-y-6">
      <PageHeader titre="Statistiques" sousTitre="Vue d'ensemble des performances" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="CA cumulé" valeur={fcfa(total)} icon={<BarChart3 className="h-5 w-5" />} variation="+18,2 %" tone="primary" />
        <StatCard label="Commandes" valeur={String(commandes)} icon={<ShoppingCart className="h-5 w-5" />} variation="+11,5 %" tone="info" />
        <StatCard label="Produits vendus" valeur="1 892" icon={<Package className="h-5 w-5" />} variation="+9,0 %" tone="warn" />
        <StatCard label="Clients actifs" valeur="486" icon={<Users className="h-5 w-5" />} variation="+6,4 %" tone="neutral" />
      </div>

      <SectionCard title="Évolution des ventes">
        <AireVentes data={ventesMensuelles} cle="ventes" x="mois" />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Ventes par catégorie" className="lg:col-span-2">
          <BarresVentes data={ventesParCategorie} cle="ventes" x="categorie" />
        </SectionCard>
        <SectionCard title="Moyens de paiement">
          <CamembertPaiements data={repartitionPaiements} />
        </SectionCard>
      </div>
    </div>
  );
}
