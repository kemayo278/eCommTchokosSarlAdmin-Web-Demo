"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PageHeader, SectionCard, Button } from "@/components/ui/primitives";
import { Field, Select, Toggle, FormRow } from "@/components/ui/Field";

export default function ParametresGenerauxPage() {
  const [nomSite, setNomSite] = useState("Tchokos Sarl");
  const [emailContact, setEmailContact] = useState("contact@tchokos.cm");
  const [devise, setDevise] = useState("FCFA");
  const [langue, setLangue] = useState("Français");
  const [maintenance, setMaintenance] = useState(false);
  const [enregistre, setEnregistre] = useState(false);

  function sauver() {
    setEnregistre(true);
    setTimeout(() => setEnregistre(false), 1500);
  }

  return (
    <div className="space-y-6">
      <PageHeader titre="Paramètres généraux" sousTitre="Configuration globale du site" />

      <SectionCard title="Identité du site">
        <div className="space-y-4">
          <FormRow>
            <Field label="Nom du site" value={nomSite} onChange={setNomSite} />
            <Field label="E-mail de contact" value={emailContact} onChange={setEmailContact} type="email" />
          </FormRow>
          <FormRow>
            <Select
              label="Devise"
              value={devise}
              onChange={setDevise}
              options={[{ valeur: "FCFA", libelle: "Franc CFA (FCFA)" }, { valeur: "EUR", libelle: "Euro (€)" }]}
            />
            <Select
              label="Langue par défaut"
              value={langue}
              onChange={setLangue}
              options={[{ valeur: "Français", libelle: "Français" }, { valeur: "Anglais", libelle: "Anglais" }]}
            />
          </FormRow>
        </div>
      </SectionCard>

      <SectionCard title="Disponibilité">
        <Toggle
          label="Mode maintenance"
          description="Rend le site temporairement inaccessible aux visiteurs"
          actif={maintenance}
          onChange={setMaintenance}
        />
      </SectionCard>

      <Button onClick={sauver}>
        {enregistre ? (
          <>
            <Check className="h-4 w-4" /> Enregistré
          </>
        ) : (
          "Enregistrer les modifications"
        )}
      </Button>
    </div>
  );
}
