"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { PageHeader, Card, Button } from "@/components/ui/primitives";

const faq = [
  { q: "Quels sont les délais de livraison à Douala ?", r: "La livraison à Douala est assurée sous 24 à 48 h selon le quartier. Les commandes express sont livrées le jour même." },
  { q: "Quels moyens de paiement acceptez-vous ?", r: "Nous acceptons MTN Mobile Money, Orange Money, carte bancaire et le paiement à la livraison." },
  { q: "Comment suivre ma commande ?", r: "Un code de suivi est envoyé par SMS. Le livreur présente un QR code que vous scannez à la réception." },
  { q: "Puis-je retourner un article ?", r: "Oui, sous 7 jours après réception, si l'article est intact. Rendez-vous dans la section « Mes commandes »." },
];

export default function FaqPage() {
  const [ouvert, setOuvert] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      <PageHeader
        titre="FAQ"
        sousTitre="Questions fréquentes affichées sur le site"
        action={
          <Button>
            <Plus className="h-4 w-4" /> Ajouter une question
          </Button>
        }
      />

      <div className="space-y-2">
        {faq.map((item, i) => {
          const actif = ouvert === i;
          return (
            <Card key={i} className="overflow-hidden">
              <button
                onClick={() => setOuvert(actif ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-secondary">{item.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${actif ? "rotate-180" : ""}`} />
              </button>
              {actif && (
                <p className="border-t border-slate-50 px-5 py-4 text-sm text-slate-500">{item.r}</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
