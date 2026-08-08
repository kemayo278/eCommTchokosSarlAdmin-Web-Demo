export interface Categorie {
  id: string;
  nom: string;
  slug: string;
  parent: string | null;
  nbProduits: number;
  actif: boolean;
  ordre: number;
}

export interface Produit {
  id: string;
  nom: string;
  slug: string;
  sku: string;
  categorie: string;
  prix: number;
  prixCompare: number | null;
  stock: number;
  actif: boolean;
  enVedette: boolean;
  note: number;
  ventes: number;
}

export type StatutCommande =
  | "en_attente"
  | "en_traitement"
  | "expediee"
  | "livree"
  | "annulee";

export type StatutPaiement = "paye" | "en_attente" | "echoue" | "rembourse";

export interface LigneCommande {
  nom: string;
  sku: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Commande {
  id: string;
  numero: string;
  client: string;
  telephone: string;
  quartier: string;
  articles: LigneCommande[];
  sousTotal: number;
  livraison: number;
  remise: number;
  total: number;
  statut: StatutCommande;
  statutPaiement: StatutPaiement;
  methode: MethodePaiement;
  livreur: string | null;
  creeLe: string;
  notes?: string;
}

export type MethodePaiement = "momo" | "om" | "carte" | "especes";
export type StatutTransaction = "reussie" | "en_attente" | "echouee";

export interface Paiement {
  id: string;
  transactionId: string;
  commande: string;
  client: string;
  methode: MethodePaiement;
  montant: number;
  statut: StatutTransaction;
  creeLe: string;
}

export type StatutLivraisonAdmin =
  | "en_attente"
  | "assignee"
  | "en_transit"
  | "livree";

export interface LivraisonAdmin {
  id: string;
  code: string;
  commande: string;
  livreur: string | null;
  quartier: string;
  statut: StatutLivraisonAdmin;
  planifieeLe: string;
}

export interface Livreur {
  id: string;
  nom: string;
  telephone: string;
  zones: string[];
  livraisons: number;
  note: number;
  actif: boolean;
}

export interface Retour {
  id: string;
  commande: string;
  client: string;
  motif: string;
  montant: number;
  statut: "demande" | "approuve" | "refuse" | "rembourse";
  creeLe: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "pourcentage" | "fixe";
  valeur: number;
  minCommande: number;
  utilisations: number;
  maxUtilisations: number;
  actif: boolean;
  expireLe: string;
}

export type StatutVideo = "publiee" | "brouillon";

export interface Video {
  id: string;
  titre: string;
  categorie: string;
  produitLie: string | null;
  statut: StatutVideo;
  vues: number;
  likes: number;
  duree: string;
  publieeLe: string;
}

export interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  commandes: number;
  totalDepense: number;
  dernierAchat: string;
}

export type StatutTicket = "ouvert" | "en_cours" | "resolu";

export interface Ticket {
  id: string;
  sujet: string;
  client: string;
  canal: "email" | "whatsapp" | "telephone";
  priorite: "basse" | "normale" | "haute";
  statut: StatutTicket;
  creeLe: string;
}

export type PositionPack = "top" | "bottom";

export interface Pack {
  id: string;
  nom: string;
  description: string;
  prix: number;
  position: PositionPack;
  produits: string[];
  actif: boolean;
}

export type TypeNotification =
  | "commande"
  | "paiement"
  | "stock"
  | "ticket"
  | "retour"
  | "systeme";

export interface NotificationAdmin {
  id: string;
  type: TypeNotification;
  titre: string;
  message: string;
  href?: string;
  date: string;
  heure: string;
  lu: boolean;
}
