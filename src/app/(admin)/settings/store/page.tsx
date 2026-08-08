"use client";

import { useState } from "react";
import { Check, ImagePlus } from "lucide-react";
import { PageHeader, SectionCard, Button } from "@/components/ui/primitives";
import { Field, Textarea, FormRow } from "@/components/ui/Field";

export default function ParametresBoutiquePage() {
  const [nom, setNom] = useState("Tchokos Sarl");
  const [slogan, setSlogan] = useState("La boutique en ligne du Cameroun");
  const [adresse, setAdresse] = useState("Akwa, Douala, Cameroun");
  const [telephone, setTelephone] = useState("+237 6 90 00 00 00");
  const [description, setDescription] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [enregistre, setEnregistre] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader titre="Boutique" sousTitre="Informations affichées sur le site" />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Informations">
            <div className="space-y-4">
              <FormRow>
                <Field label="Nom de la boutique" value={nom} onChange={setNom} />
                <Field label="Slogan" value={slogan} onChange={setSlogan} />
              </FormRow>
              <FormRow>
                <Field label="Adresse" value={adresse} onChange={setAdresse} />
                <Field label="Téléphone" value={telephone} onChange={setTelephone} />
              </FormRow>
              <Textarea label="Description" value={description} onChange={setDescription} placeholder="Présentez votre boutique" />
            </div>
          </SectionCard>

          <SectionCard title="Réseaux sociaux">
            <div className="space-y-4">
              <Field label="Facebook" value={facebook} onChange={setFacebook} placeholder="facebook.com/tchokos" />
              <Field label="Instagram" value={instagram} onChange={setInstagram} placeholder="instagram.com/tchokos" />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Logo">
            <button
              type="button"
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-slate-400 transition hover:border-primary/50 hover:text-primary-dark"
            >
              <ImagePlus className="h-7 w-7" />
              <span className="text-sm font-semibold">Charger un logo</span>
            </button>
          </SectionCard>
          <Button className="w-full" onClick={() => { setEnregistre(true); setTimeout(() => setEnregistre(false), 1500); }}>
            {enregistre ? (
              <>
                <Check className="h-4 w-4" /> Enregistré
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
