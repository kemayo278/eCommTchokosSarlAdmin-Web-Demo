import type {
  Categorie,
  Client,
  Commande,
  Coupon,
  LivraisonAdmin,
  NotificationAdmin,
  Pack,
  Livreur,
  Paiement,
  Produit,
  Retour,
  Ticket,
  Video,
} from "./types";

export const categories: Categorie[] = [
  { id: "c1", nom: "Sacs", slug: "sacs", parent: null, nbProduits: 48, actif: true, ordre: 1 },
  { id: "c2", nom: "Draps & Linge de lit", slug: "draps", parent: null, nbProduits: 36, actif: true, ordre: 2 },
  { id: "c3", nom: "Sacs à main", slug: "sacs-a-main", parent: "Sacs", nbProduits: 22, actif: true, ordre: 3 },
  { id: "c4", nom: "Sacs à dos", slug: "sacs-a-dos", parent: "Sacs", nbProduits: 15, actif: true, ordre: 4 },
  { id: "c5", nom: "Parures de lit", slug: "parures-de-lit", parent: "Draps & Linge de lit", nbProduits: 18, actif: true, ordre: 5 },
  { id: "c6", nom: "Couvertures & Plaids", slug: "couvertures", parent: "Draps & Linge de lit", nbProduits: 12, actif: false, ordre: 6 },
];

export const produits: Produit[] = [
  { id: "p1", nom: "Sac à main cuir premium", slug: "sac-main-cuir", sku: "SAC-001", categorie: "Sacs à main", prix: 18900, prixCompare: 24000, stock: 34, actif: true, enVedette: true, note: 4.7, ventes: 128 },
  { id: "p2", nom: "Sac à dos urbain toile", slug: "sac-dos-urbain", sku: "SAC-014", categorie: "Sacs à dos", prix: 14500, prixCompare: null, stock: 22, actif: true, enVedette: true, note: 4.5, ventes: 96 },
  { id: "p3", nom: "Sac de voyage weekend", slug: "sac-voyage-weekend", sku: "SAC-207", categorie: "Sacs", prix: 21000, prixCompare: 26000, stock: 8, actif: true, enVedette: false, note: 4.8, ventes: 210 },
  { id: "p4", nom: "Sac bandoulière femme", slug: "sac-bandouliere", sku: "SAC-051", categorie: "Sacs à main", prix: 12900, prixCompare: null, stock: 0, actif: false, enVedette: false, note: 4.2, ventes: 54 },
  { id: "p5", nom: "Parure de lit wax 2 places", slug: "parure-wax", sku: "DRP-119", categorie: "Parures de lit", prix: 24500, prixCompare: 29000, stock: 27, actif: true, enVedette: true, note: 4.9, ventes: 175 },
  { id: "p6", nom: "Drap-housse coton 180×200", slug: "drap-housse-coton", sku: "DRP-033", categorie: "Draps & Linge de lit", prix: 9000, prixCompare: null, stock: 45, actif: true, enVedette: false, note: 4.4, ventes: 61 },
  { id: "p7", nom: "Couverture polaire double", slug: "couverture-polaire", sku: "DRP-088", categorie: "Couvertures & Plaids", prix: 16000, prixCompare: 19000, stock: 5, actif: true, enVedette: true, note: 4.6, ventes: 88 },
  { id: "p8", nom: "Taie d'oreiller satin (lot de 2)", slug: "taie-satin", sku: "DRP-045", categorie: "Draps & Linge de lit", prix: 5500, prixCompare: null, stock: 120, actif: true, enVedette: false, note: 4.3, ventes: 240 },
];

export const commandes: Commande[] = [
  {
    id: "8N9", numero: "#85894N9", client: "Aïcha Ndongo", telephone: "+237 6 55 44 33 22", quartier: "Bonapriso",
    articles: [
      { nom: "Sac à main cuir premium", sku: "SAC-001", quantite: 1, prixUnitaire: 18900 },
      { nom: "Taie d'oreiller satin (lot de 2)", sku: "DRP-045", quantite: 2, prixUnitaire: 5500 },
    ],
    sousTotal: 29900, livraison: 1500, remise: 0, total: 31400,
    statut: "en_traitement", statutPaiement: "paye", methode: "momo", livreur: "Junior Mbappé", creeLe: "8 juil. 2026",
    notes: "Livrer avant 17h si possible.",
  },
  {
    id: "K21", numero: "#77120K21", client: "Serge Etoa", telephone: "+237 6 77 88 99 00", quartier: "Ndokotti",
    articles: [{ nom: "Sac à dos urbain toile", sku: "SAC-014", quantite: 1, prixUnitaire: 14500 }],
    sousTotal: 14500, livraison: 1000, remise: 0, total: 15500,
    statut: "en_attente", statutPaiement: "en_attente", methode: "om", livreur: null, creeLe: "8 juil. 2026",
  },
  {
    id: "B07", numero: "#90233B07", client: "Chantal Fotso", telephone: "+237 6 91 22 11 44", quartier: "Deido",
    articles: [
      { nom: "Sac de voyage weekend", sku: "SAC-207", quantite: 2, prixUnitaire: 21000 },
      { nom: "Drap-housse coton 180×200", sku: "DRP-033", quantite: 1, prixUnitaire: 9000 },
    ],
    sousTotal: 51000, livraison: 1500, remise: 5000, total: 47500,
    statut: "expediee", statutPaiement: "paye", methode: "carte", livreur: "Junior Mbappé", creeLe: "8 juil. 2026",
  },
  {
    id: "R55", numero: "#61008R55", client: "Boris Kamga", telephone: "+237 6 70 00 55 11", quartier: "Makepe",
    articles: [{ nom: "Parure de lit wax 2 places", sku: "DRP-119", quantite: 1, prixUnitaire: 24500 }],
    sousTotal: 24500, livraison: 1000, remise: 0, total: 25500,
    statut: "livree", statutPaiement: "paye", methode: "momo", livreur: "Estelle Nga", creeLe: "7 juil. 2026",
  },
  {
    id: "T88", numero: "#55471T88", client: "Nadège Owona", telephone: "+237 6 99 33 22 88", quartier: "Bali",
    articles: [{ nom: "Couverture polaire double", sku: "DRP-088", quantite: 1, prixUnitaire: 16000 }],
    sousTotal: 16000, livraison: 1500, remise: 0, total: 17500,
    statut: "annulee", statutPaiement: "rembourse", methode: "om", livreur: null, creeLe: "7 juil. 2026",
  },
  {
    id: "M12", numero: "#33012M12", client: "Paul Biya Jr", telephone: "+237 6 80 11 22 33", quartier: "Akwa",
    articles: [{ nom: "Sac bandoulière femme", sku: "SAC-051", quantite: 3, prixUnitaire: 12900 }],
    sousTotal: 38700, livraison: 1000, remise: 2000, total: 37700,
    statut: "en_traitement", statutPaiement: "paye", methode: "momo", livreur: null, creeLe: "8 juil. 2026",
  },
];

export const paiements: Paiement[] = [
  { id: "pay1", transactionId: "MOMO-4820193", commande: "#85894N9", client: "Aïcha Ndongo", methode: "momo", montant: 31400, statut: "reussie", creeLe: "8 juil. 2026 · 08:12" },
  { id: "pay2", transactionId: "OM-7729841", commande: "#77120K21", client: "Serge Etoa", methode: "om", montant: 15500, statut: "en_attente", creeLe: "8 juil. 2026 · 08:41" },
  { id: "pay3", transactionId: "CARD-1029384", commande: "#90233B07", client: "Chantal Fotso", methode: "carte", montant: 47500, statut: "reussie", creeLe: "8 juil. 2026 · 09:03" },
  { id: "pay4", transactionId: "MOMO-4820055", commande: "#61008R55", client: "Boris Kamga", methode: "momo", montant: 25500, statut: "reussie", creeLe: "7 juil. 2026 · 14:22" },
  { id: "pay5", transactionId: "OM-7728102", commande: "#55471T88", client: "Nadège Owona", methode: "om", montant: 17500, statut: "echouee", creeLe: "7 juil. 2026 · 11:47" },
  { id: "pay6", transactionId: "MOMO-4819922", commande: "#33012M12", client: "Paul Biya Jr", methode: "momo", montant: 37700, statut: "reussie", creeLe: "8 juil. 2026 · 07:55" },
];

export const livraisonsAdmin: LivraisonAdmin[] = [
  { id: "l1", code: "DLV-85894", commande: "#85894N9", livreur: "Junior Mbappé", quartier: "Bonapriso", statut: "en_transit", planifieeLe: "8 juil. · 09:00" },
  { id: "l2", code: "DLV-77120", commande: "#77120K21", livreur: null, quartier: "Ndokotti", statut: "en_attente", planifieeLe: "8 juil. · 10:30" },
  { id: "l3", code: "DLV-90233", commande: "#90233B07", livreur: "Junior Mbappé", quartier: "Deido", statut: "assignee", planifieeLe: "8 juil. · 11:00" },
  { id: "l4", code: "DLV-61008", commande: "#61008R55", livreur: "Estelle Nga", quartier: "Makepe", statut: "livree", planifieeLe: "7 juil. · 15:00" },
];

export const livreurs: Livreur[] = [
  { id: "lv1", nom: "Junior Mbappé", telephone: "+237 6 90 12 34 56", zones: ["Akwa Nord", "Deido", "Bonapriso"], livraisons: 342, note: 4.8, actif: true },
  { id: "lv2", nom: "Estelle Nga", telephone: "+237 6 91 55 44 33", zones: ["Makepe", "Bali", "Ange Raphaël"], livraisons: 289, note: 4.9, actif: true },
  { id: "lv3", nom: "Cédric Owona", telephone: "+237 6 78 22 11 00", zones: ["Bonabéri", "Bepanda"], livraisons: 156, note: 4.6, actif: true },
  { id: "lv4", nom: "Franck Talla", telephone: "+237 6 55 66 77 88", zones: ["Ndokotti", "New Bell"], livraisons: 98, note: 4.4, actif: false },
];

export const retours: Retour[] = [
  { id: "r1", commande: "#55471T88", client: "Nadège Owona", motif: "Produit défectueux", montant: 17500, statut: "rembourse", creeLe: "7 juil. 2026" },
  { id: "r2", commande: "#48120P03", client: "Marie Essomba", motif: "Dimensions incorrectes", montant: 24500, statut: "approuve", creeLe: "6 juil. 2026" },
  { id: "r3", commande: "#39901X22", client: "Yann Mballa", motif: "Article non conforme", montant: 9000, statut: "demande", creeLe: "8 juil. 2026" },
];

export const coupons: Coupon[] = [
  { id: "cp1", code: "RENTREE10", type: "pourcentage", valeur: 10, minCommande: 20000, utilisations: 142, maxUtilisations: 500, actif: true, expireLe: "31 août 2026" },
  { id: "cp2", code: "LIVRAISON0", type: "fixe", valeur: 1500, minCommande: 30000, utilisations: 89, maxUtilisations: 200, actif: true, expireLe: "15 juil. 2026" },
  { id: "cp3", code: "VIP5000", type: "fixe", valeur: 5000, minCommande: 50000, utilisations: 33, maxUtilisations: 100, actif: true, expireLe: "30 sept. 2026" },
  { id: "cp4", code: "SOLDES20", type: "pourcentage", valeur: 20, minCommande: 15000, utilisations: 210, maxUtilisations: 210, actif: false, expireLe: "30 juin 2026" },
];

export const videos: Video[] = [
  { id: "v1", titre: "Nouvelle collection sacs à main", categorie: "Sacs", produitLie: "Sac à main cuir premium", statut: "publiee", vues: 12480, likes: 892, duree: "0:45", publieeLe: "5 juil. 2026" },
  { id: "v2", titre: "Test sac de voyage weekend", categorie: "Sacs", produitLie: "Sac de voyage weekend", statut: "publiee", vues: 8210, likes: 540, duree: "1:20", publieeLe: "3 juil. 2026" },
  { id: "v3", titre: "Comment choisir sa parure de lit", categorie: "Draps", produitLie: "Parure de lit wax 2 places", statut: "brouillon", vues: 0, likes: 0, duree: "2:05", publieeLe: "—" },
  { id: "v4", titre: "Unboxing sac à dos urbain", categorie: "Sacs", produitLie: "Sac à dos urbain toile", statut: "publiee", vues: 15920, likes: 1120, duree: "0:58", publieeLe: "1 juil. 2026" },
];

export const clients: Client[] = [
  { id: "cl1", nom: "Aïcha Ndongo", email: "aicha.n@gmail.com", telephone: "+237 6 55 44 33 22", commandes: 12, totalDepense: 348000, dernierAchat: "8 juil. 2026" },
  { id: "cl2", nom: "Chantal Fotso", email: "chantal.f@gmail.com", telephone: "+237 6 91 22 11 44", commandes: 8, totalDepense: 215000, dernierAchat: "8 juil. 2026" },
  { id: "cl3", nom: "Boris Kamga", email: "boris.k@yahoo.fr", telephone: "+237 6 70 00 55 11", commandes: 5, totalDepense: 132000, dernierAchat: "7 juil. 2026" },
  { id: "cl4", nom: "Paul Biya Jr", email: "paul.jr@gmail.com", telephone: "+237 6 80 11 22 33", commandes: 3, totalDepense: 78500, dernierAchat: "8 juil. 2026" },
  { id: "cl5", nom: "Nadège Owona", email: "nadege.o@gmail.com", telephone: "+237 6 99 33 22 88", commandes: 2, totalDepense: 41000, dernierAchat: "7 juil. 2026" },
];

export const tickets: Ticket[] = [
  { id: "t1", sujet: "Colis non reçu", client: "Serge Etoa", canal: "whatsapp", priorite: "haute", statut: "ouvert", creeLe: "8 juil. 2026" },
  { id: "t2", sujet: "Demande de remboursement", client: "Nadège Owona", canal: "email", priorite: "normale", statut: "en_cours", creeLe: "7 juil. 2026" },
  { id: "t3", sujet: "Problème de paiement OM", client: "Yann Mballa", canal: "telephone", priorite: "haute", statut: "ouvert", creeLe: "8 juil. 2026" },
  { id: "t4", sujet: "Article manquant", client: "Marie Essomba", canal: "whatsapp", priorite: "basse", statut: "resolu", creeLe: "6 juil. 2026" },
];

export const ventesMensuelles = [
  { mois: "Jan", ventes: 1240000, commandes: 210 },
  { mois: "Fév", ventes: 1580000, commandes: 268 },
  { mois: "Mar", ventes: 1390000, commandes: 241 },
  { mois: "Avr", ventes: 1820000, commandes: 312 },
  { mois: "Mai", ventes: 2100000, commandes: 358 },
  { mois: "Juin", ventes: 1950000, commandes: 335 },
  { mois: "Juil", ventes: 2480000, commandes: 402 },
];

export const ventes7Jours = [
  { jour: "Lun", montant: 312000 },
  { jour: "Mar", montant: 289000 },
  { jour: "Mer", montant: 401000 },
  { jour: "Jeu", montant: 358000 },
  { jour: "Ven", montant: 512000 },
  { jour: "Sam", montant: 623000 },
  { jour: "Dim", montant: 298000 },
];

export const repartitionPaiements = [
  { nom: "MoMo", valeur: 58, couleur: "#f59e0b" },
  { nom: "Orange Money", valeur: 27, couleur: "#f97316" },
  { nom: "Carte", valeur: 10, couleur: "#3b82f6" },
  { nom: "Espèces", valeur: 5, couleur: "#64748b" },
];

export const ventesParCategorie = [
  { categorie: "Sacs à main", ventes: 4200000 },
  { categorie: "Sacs à dos", ventes: 3100000 },
  { categorie: "Parures de lit", ventes: 2400000 },
  { categorie: "Draps", ventes: 1900000 },
  { categorie: "Couvertures", ventes: 1200000 },
];

export function getCommande(id: string): Commande | undefined {
  return commandes.find((c) => c.id === id);
}

export const packs: Pack[] = [
  {
    id: "pk1",
    nom: "Pack Trousseau Maison",
    description: "Parure, drap-housse, couverture et taies + sacs pour tout ranger.",
    prix: 62000,
    position: "top",
    produits: [
      "Parure de lit wax 2 places",
      "Drap-housse coton 180×200",
      "Couverture polaire double",
      "Taie d'oreiller satin (lot de 2)",
      "Sac de voyage weekend",
      "Sac à main cuir premium",
    ],
    actif: true,
  },
  {
    id: "pk2",
    nom: "Pack Sacs Essentiels",
    description: "Sac à main + sac à dos urbain à prix réduit.",
    prix: 28000,
    position: "top",
    produits: ["Sac à main cuir premium", "Sac à dos urbain toile"],
    actif: true,
  },
  {
    id: "pk3",
    nom: "Pack Nuit Douce",
    description: "Drap-housse coton et taies d'oreiller satin.",
    prix: 13000,
    position: "bottom",
    produits: ["Drap-housse coton 180×200", "Taie d'oreiller satin (lot de 2)"],
    actif: false,
  },
];

export const notificationsAdmin: NotificationAdmin[] = [
  { id: "n1", type: "commande", titre: "Nouvelle commande", message: "#85894N9 · Aïcha Ndongo · 31 400 FCFA", href: "/orders/8N9", date: "Aujourd'hui", heure: "08:12", lu: false },
  { id: "n2", type: "paiement", titre: "Paiement reçu", message: "MoMo · 37 700 FCFA · #33012M12", href: "/payments", date: "Aujourd'hui", heure: "07:55", lu: false },
  { id: "n3", type: "stock", titre: "Stock faible", message: "Couverture polaire double : 5 unités restantes", href: "/products", date: "Aujourd'hui", heure: "07:30", lu: false },
  { id: "n4", type: "ticket", titre: "Nouveau ticket support", message: "Serge Etoa · Colis non reçu", href: "/support", date: "Aujourd'hui", heure: "08:42", lu: false },
  { id: "n5", type: "retour", titre: "Demande de retour", message: "Yann Mballa · Article non conforme", href: "/orders/returns", date: "Hier", heure: "16:20", lu: true },
  { id: "n6", type: "systeme", titre: "Rapport hebdomadaire prêt", message: "Le rapport des ventes de la semaine est disponible.", href: "/statistics", date: "Hier", heure: "09:00", lu: true },
];
