"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { PageHeader, Button, SectionCard } from "@/components/ui/primitives";
import { Field, Select, Toggle, FormRow } from "@/components/ui/Field";
import { MultiSelect } from "@/components/ui/MultiSelect";

const zonesDouala = [
  "Akwa Nord",
  "Akwa Sud",
  "Bonanjo",
  "Bonapriso",
  "Deido",
  "Bali",
  "Bepanda",
  "Makepe",
  "Ndokotti",
  "New Bell",
  "Bonabéri",
  "Ange Raphaël",
  "Logpom",
  "Yassa",
];

export default function NouveauLivreurPage() {
  const router = useRouter();
  const [enregistre, setEnregistre] = useState(false);

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicule, setVehicule] = useState("Moto");
  const [zones, setZones] = useState<string[]>([]);
  const [actif, setActif] = useState(true);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnregistre(true);
    setTimeout(() => router.push("/orders/drivers"), 900);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" href="/orders/drivers" className="!px-2.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader titre="Ajouter un livreur" sousTitre="Enregistrez un nouveau livreur et ses zones" />
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Identité">
            <div className="space-y-4">
              <FormRow>
                <Field label="Nom complet" value={nom} onChange={setNom} placeholder="Junior Mbappé" />
                <Field label="Téléphone" value={telephone} onChange={setTelephone} placeholder="+237 6 90 00 00 00" />
              </FormRow>
              <FormRow>
                <Field label="E-mail" value={email} onChange={setEmail} placeholder="livreur@tchokos.cm" type="email" />
                <Select
                  label="Véhicule"
                  value={vehicule}
                  onChange={setVehicule}
                  options={[
                    { valeur: "Moto", libelle: "Moto" },
                    { valeur: "Voiture", libelle: "Voiture" },
                    { valeur: "Vélo", libelle: "Vélo" },
                    { valeur: "Tricycle", libelle: "Tricycle" },
                  ]}
                />
              </FormRow>
            </div>
          </SectionCard>

          <SectionCard title="Zones affectées">
            <MultiSelect
              label="Ajouter des zones de livraison"
              options={zonesDouala}
              selected={zones}
              onChange={setZones}
              placeholder="Choisir une zone…"
            />
            <p className="mt-3 text-xs text-slate-400">
              {zones.length === 0
                ? "Le livreur recevra les commandes des zones sélectionnées."
                : `${zones.length} zone(s) affectée(s).`}
            </p>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Statut">
            <Toggle label="Livreur actif" description="Peut recevoir des courses" actif={actif} onChange={setActif} />
          </SectionCard>

          <Button type="submit" className="w-full">
            {enregistre ? (
              <>
                <Check className="h-4 w-4" /> Enregistré
              </>
            ) : (
              "Ajouter le livreur"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
