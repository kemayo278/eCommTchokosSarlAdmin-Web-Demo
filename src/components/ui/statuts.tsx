import { Badge, type Tone } from "./primitives";
import type {
  StatutCommande,
  StatutLivraisonAdmin,
  StatutPaiement,
  StatutTicket,
  StatutTransaction,
  StatutVideo,
} from "@/lib/types";
import type { OrderStatus, PaymentStatus, PaymentMethod } from "@/types/order";
import type { DeliveryStatus } from "@/types/delivery";

function make<T extends string>(map: Record<T, { label: string; tone: Tone }>) {
  return function BadgeStatut({ statut }: { statut: T }) {
    const s = map[statut] ?? { label: statut, tone: "neutral" as Tone };
    return <Badge tone={s.tone}>{s.label}</Badge>;
  };
}

export const BadgeCommande = make<StatutCommande>({
  en_attente: { label: "En attente", tone: "warn" },
  en_traitement: { label: "En traitement", tone: "info" },
  expediee: { label: "Expédiée", tone: "primary" },
  livree: { label: "Livrée", tone: "primary" },
  annulee: { label: "Annulée", tone: "danger" },
});

export const BadgePaiement = make<StatutPaiement>({
  paye: { label: "Payé", tone: "primary" },
  en_attente: { label: "En attente", tone: "warn" },
  echoue: { label: "Échoué", tone: "danger" },
  rembourse: { label: "Remboursé", tone: "neutral" },
});

export const BadgeTransaction = make<StatutTransaction>({
  reussie: { label: "Réussie", tone: "primary" },
  en_attente: { label: "En attente", tone: "warn" },
  echouee: { label: "Échouée", tone: "danger" },
});

export const BadgeLivraison = make<StatutLivraisonAdmin>({
  en_attente: { label: "En attente", tone: "warn" },
  assignee: { label: "Assignée", tone: "info" },
  en_transit: { label: "En transit", tone: "primary" },
  livree: { label: "Livrée", tone: "primary" },
});

export const BadgeVideo = make<StatutVideo>({
  publiee: { label: "Publiée", tone: "primary" },
  brouillon: { label: "Brouillon", tone: "neutral" },
});

export const BadgeTicket = make<StatutTicket>({
  ouvert: { label: "Ouvert", tone: "danger" },
  en_cours: { label: "En cours", tone: "warn" },
  resolu: { label: "Résolu", tone: "primary" },
});

export function BadgeActif({ actif }: { actif: boolean }) {
  return <Badge tone={actif ? "primary" : "neutral"}>{actif ? "Actif" : "Inactif"}</Badge>;
}

export const BadgeOrderStatus = make<OrderStatus>({
  pending:   { label: "En attente",    tone: "warn"    },
  confirmed: { label: "Confirmée",     tone: "info"    },
  processing:{ label: "En traitement", tone: "primary" },
  shipped:   { label: "Expédiée",      tone: "primary" },
  delivered: { label: "Livrée",        tone: "primary" },
  cancelled: { label: "Annulée",       tone: "danger"  },
});

export const BadgePaymentStatus = make<PaymentStatus>({
  pending:  { label: "En attente",  tone: "warn"    },
  paid:     { label: "Payé",        tone: "primary" },
  failed:   { label: "Échoué",      tone: "danger"  },
  refunded: { label: "Remboursé",   tone: "neutral" },
});

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  momo: "MTN MoMo",
  om:   "Orange Money",
  card: "Carte",
  cash: "Espèces",
};

export const BadgeDeliveryStatus = make<DeliveryStatus>({
  pending:    { label: "En attente", tone: "warn"    },
  assigned:   { label: "Assignée",   tone: "info"    },
  in_transit: { label: "En transit", tone: "primary" },
  delivered:  { label: "Livrée",     tone: "primary" },
  failed:     { label: "Échouée",    tone: "danger"  },
});

export function BadgePaymentMethod({ method }: { method: PaymentMethod }) {
  return <Badge tone="neutral">{PAYMENT_METHOD_LABEL[method] ?? method}</Badge>;
}
