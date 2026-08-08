import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Video,
  BarChart3,
  Headphones,
  Settings,
  UserCheck,
} from "lucide-react";

export interface NavLeaf {
  label: string;
  href: string;
}

export interface NavGroup {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: NavLeaf[];
}

export const nav: NavGroup[] = [
  { label: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard" },
  {
    label: "Produits",
    icon: Package,
    children: [
      { label: "Tous les produits", href: "/products" },
      { label: "Ajouter un produit", href: "/products/new" },
      { label: "Catégories", href: "/products/categories" },
      { label: "Promotions", href: "/products/promotions" },
      { label: "Packs", href: "/products/packs" },
      { label: "Import / Export", href: "/products/import-export" },
    ],
  },
  {
    label: "Commandes",
    icon: ShoppingCart,
    children: [
      { label: "Toutes les commandes", href: "/orders" },
      // { label: "Traitement", href: "/orders/processing" },
      { label: "Livraisons", href: "/orders/deliveries" },
      { label: "Clients", href: "/orders/customers" },
      { label: "Livreurs", href: "/orders/drivers" },
      { label: "Retours", href: "/orders/returns" },
      { label: "Avis", href: "/orders/reviews" },
    ],
  },
  {
    label: "Paiements",
    icon: CreditCard,
    children: [
      { label: "Historique", href: "/payments" },
      { label: "Transactions MoMo / OM", href: "/payments/transactions" },
      { label: "Rapports financiers", href: "/payments/reports" },
    ],
  },
  {
    label: "Vidéos",
    icon: Video,
    children: [
      { label: "Toutes les vidéos", href: "/videos" },
      { label: "Ajouter une vidéo", href: "/videos/new" },
      // { label: "Catégories", href: "/videos/categories" },
    ],
  },
  {
    label: "Statistiques",
    icon: BarChart3,
    children: [
      { label: "Tableau de bord", href: "/statistics" },
      { label: "Ventes", href: "/statistics/sales" },
      { label: "Produits", href: "/statistics/products" },
      { label: "Clients", href: "/statistics/customers" },
      { label: "Financières", href: "/statistics/financial" },
    ],
  },
  {
    label: "Support client",
    icon: Headphones,
    children: [
      { label: "Tickets", href: "/support" },
      { label: "Messages", href: "/support/messages" },
      { label: "FAQ", href: "/support/faq" },
    ],
  },
  {
    label: "Influenceurs",
    icon: UserCheck,
    children: [
      { label: "Vue d'ensemble", href: "/influencers" },
      { label: "Ajouter", href: "/influencers/new" },
      { label: "Demandes de retrait", href: "/influencers/payouts" },
    ],
  },
  {
    label: "Paramètres",
    icon: Settings,
    children: [
      { label: "Général", href: "/settings" },
      { label: "Boutique", href: "/settings/store" },
      { label: "Paiements", href: "/settings/payments" },
      { label: "Zones de Livraison", href: "/settings/shipping" },
      { label: "Utilisateurs & rôles", href: "/settings/users" },
    ],
  },
];
