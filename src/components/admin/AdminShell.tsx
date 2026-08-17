"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  FolderPlus,
  LayoutDashboard,
  Loader2,
  Menu,
  Package,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import axiosClient, { getStoredToken } from "@/lib/api/axiosClient";
import { initiales } from "@/lib/format";
import Sidebar from "./Sidebar";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { nav } from "@/lib/nav";

type QuickAction = {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  iconClass: string;
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [nonLues, setNonLues] = useState(0);

  const quickActions: QuickAction[] = [
    { label: "Tableau de bord", description: "Retourner à l’accueil admin", href: "/dashboard", icon: LayoutDashboard, iconClass: "bg-primary-soft text-primary" },
    { label: "Nouvelle catégorie", description: "Créer une catégorie produit", href: "/products/categories/new", icon: FolderPlus, iconClass: "bg-warn-soft text-warn" },
    { label: "Ajouter un produit", description: "Créer un nouveau produit", href: "/products/new", icon: Package, iconClass: "bg-info-soft text-info" },
    { label: "Toutes les commandes", description: "Consulter le flux de commandes", href: "/orders", icon: ShoppingCart, iconClass: "bg-success-soft text-success" },
    { label: "Notifications", description: "Voir les dernières alertes", href: "/notifications", icon: Bell, iconClass: "bg-danger-soft text-danger" },
  ];

  const navigationActions: QuickAction[] = nav.flatMap((group) =>
    group.href
      ? [{ label: group.label, description: `Ouvrir ${group.label.toLowerCase()}`, href: group.href, icon: group.icon, iconClass: "bg-slate-100 text-slate-500" }]
      : (group.children ?? []).map((child) => ({
          label: child.label,
          description: group.label,
          href: child.href,
          icon: group.icon,
          iconClass: "bg-slate-100 text-slate-500",
        }))
  );

  useEffect(() => {
    const token = getStoredToken();
    if (!token || (!loading && !user)) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!loading && user?.mustChangePassword) {
      router.replace("/account/change-password?forced=true");
    }
  }, [loading, user, router, pathname]);

  useEffect(() => {
    if (!user) return;
    function fetchUnread() {
      axiosClient
        .get<{ data: { read_at: string | null }[] }>("/v1/my-notifications", { params: { page: 1 } })
        .then(({ data }) => setNonLues(data.data.filter((n) => !n.read_at).length))
        .catch(() => {});
    }
    fetchUnread();
    const id = setInterval(fetchUnread, 60_000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function ouvrirAction(href: string) {
    setCommandOpen(false);
    router.push(href);
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-100 lg:block">
        <Sidebar />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <button
              onClick={() => setDrawer(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-surface/90 px-4 py-3 backdrop-blur lg:px-8">
          <button
            onClick={() => setDrawer(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 text-slate-500 lg:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-400 transition hover:border-primary/30 hover:text-slate-500 md:flex"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="flex-1 truncate">Trouvez n'importe quoi : Appuyez sur ⌘K sur votre clavier</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 text-slate-500 transition hover:text-secondary"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {nonLues > 0 && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                  {nonLues > 9 ? "9+" : nonLues}
                </span>
              )}
            </Link>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {initiales(user.name)}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>

      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        title="Actions rapides"
        description="Recherchez une page ou lancez une action rapide"
        className="sm:max-w-2xl"
      >
        <Command>
          <CommandInput placeholder="Rechercher une page, une action…" />
          <CommandList className="max-h-105">
            <CommandEmpty>Aucune action trouvée.</CommandEmpty>

            <CommandGroup heading="Actions rapides">
              {quickActions.map((action) => (
                <CommandItem key={action.href} onSelect={() => ouvrirAction(action.href)} className="gap-3 py-2">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.iconClass}`}>
                    <action.icon className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold text-secondary">{action.label}</span>
                    <span className="text-xs text-muted-foreground">{action.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Navigation">
              {navigationActions.map((action) => (
                <CommandItem key={action.href} onSelect={() => ouvrirAction(action.href)} className="gap-3 py-2">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.iconClass}`}>
                    <action.icon className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold text-secondary">{action.label}</span>
                    <span className="text-xs text-muted-foreground">{action.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
