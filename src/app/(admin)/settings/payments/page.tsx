"use client";

import { useState } from "react";
import { PageHeader, SectionCard, Card } from "@/components/ui/primitives";
import { Field, Toggle } from "@/components/ui/Field";

export default function ParametresPaiementsPage() {
  const [momo, setMomo] = useState(true);
  const [om, setOm] = useState(true);
  const [carte, setCarte] = useState(true);
  const [livraison, setLivraison] = useState(true);
  const [momoKey, setMomoKey] = useState("");
  const [omKey, setOmKey] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader titre="Paramètres de paiement" sousTitre="Activez et configurez vos moyens de paiement" />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="MTN Mobile Money">
          <div className="space-y-4">
            <Toggle label="Activer MoMo" description="Paiement via MTN Mobile Money" actif={momo} onChange={setMomo} />
            {momo && <Field label="Clé API marchand" value={momoKey} onChange={setMomoKey} placeholder="momo_live_xxxxx" />}
          </div>
        </SectionCard>

        <SectionCard title="Orange Money">
          <div className="space-y-4">
            <Toggle label="Activer Orange Money" description="Paiement via Orange Money" actif={om} onChange={setOm} />
            {om && <Field label="Clé API marchand" value={omKey} onChange={setOmKey} placeholder="om_live_xxxxx" />}
          </div>
        </SectionCard>

        <SectionCard title="Carte bancaire">
          <Toggle label="Activer le paiement par carte" description="Visa, Mastercard via passerelle" actif={carte} onChange={setCarte} />
        </SectionCard>

        <SectionCard title="Paiement à la livraison">
          <Toggle label="Activer le paiement à la livraison" description="Le client règle en espèces à la réception" actif={livraison} onChange={setLivraison} />
        </SectionCard>
      </div>

      <Card className="bg-warn-soft p-4 text-sm text-warn">
        Les clés API sont sensibles : conservez-les côté serveur et ne les exposez jamais dans le code client.
      </Card>
    </div>
  );
}
