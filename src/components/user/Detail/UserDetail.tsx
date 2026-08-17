"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { PageHeader, Button, SectionCard } from "@/components/ui/primitives";
import { BadgeActif } from "@/components/ui/statuts";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import type { User as UserType } from "@/types/user";
import type { Zone } from "@/types/zone";

type Role = "admin" | "manager" | "developpeur" | "livreur";

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "developpeur", label: "Développeur" },
  { value: "livreur", label: "Livreur" },
];

const ROLE_NEEDS_POSITION: Role[] = ["admin", "manager", "developpeur"];

interface Props {
  userId: number;
}

export default function UserDetail({ userId }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [position, setPosition] = useState("");
  const [maxSelfAssign, setMaxSelfAssign] = useState("");
  const [selectedZones, setSelectedZones] = useState<number[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Reset password
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    axiosClient
      .get<UserType>(`/v1/admin/users/${userId}`)
      .then(({ data }) => {
        setUser(data);
        syncForm(data);
      })
      .catch((err) => setError(handleApiError(err, "Impossible de charger l'utilisateur")))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (role === "livreur") {
      axiosClient
        .get<Zone[]>("/v1/zones")
        .then(({ data }) => setZones(data))
        .catch(() => {});
    }
  }, [role]);

  function syncForm(u: UserType) {
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone ?? "");
    const r = (u.roles.find((x) => ROLES.some((ro) => ro.value === x)) ?? "admin") as Role;
    setRole(r);
    setMaxSelfAssign(u.maxSelfAssignDeliveries ? String(u.maxSelfAssignDeliveries) : "");
    setSelectedZones(u.zones?.map((z) => z.id) ?? []);
  }

  function fieldClass(key: string) {
    return `h-10 w-full rounded-xl border px-3 text-sm text-secondary placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-primary/20 ${
      fieldErrors[key]
        ? "border-danger focus:border-danger"
        : "border-slate-200 focus:border-primary"
    }`;
  }

  function toggleZone(id: number) {
    setSelectedZones((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        email,
        phone: phone || null,
        role,
      };
      if (ROLE_NEEDS_POSITION.includes(role) && position) payload.position = position;
      if (role === "livreur") {
        if (maxSelfAssign) payload.max_self_assign_deliveries = Number(maxSelfAssign);
        payload.zone_ids = selectedZones;
      }
      const { data } = await axiosClient.put<UserType>(`/v1/admin/users/${userId}`, payload);
      setUser(data);
      syncForm(data);
      toast({ title: "Modifications enregistrées", description: `« ${data.name} » a été mis à jour.` });
    } catch (err: unknown) {
      const anyErr = err as any;
      if (anyErr?.response?.status === 422 && anyErr.response.data?.errors) {
        const apiErrors: Record<string, string[]> = anyErr.response.data.errors;
        setFieldErrors(Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v[0]])));
      } else {
        toast({ title: "Erreur", description: handleApiError(err), variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    setResetting(true);
    try {
      const { data } = await axiosClient.post<{ temporary_password: string }>(
        `/v1/admin/users/${userId}/reset-password`
      );
      setNewPassword(data.temporary_password);
      setCopied(false);
    } catch (err) {
      toast({ title: "Erreur", description: handleApiError(err), variant: "destructive" });
      setResetOpen(false);
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await axiosClient.delete(`/v1/admin/users/${userId}`);
      toast({ title: "Utilisateur supprimé" });
      router.replace("/settings/users");
    } catch (err) {
      toast({ title: "Erreur", description: handleApiError(err), variant: "destructive" });
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  function copyPassword() {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <LoadingSpinner />;
  if (error || !user) return <ErrorAlert message={error ?? "Utilisateur introuvable"} />;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" href="/settings/users" className="px-2.5!">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader titre={user.name} sousTitre={user.email} />
        <div className="ml-auto">
          <BadgeActif actif={user.isActive} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Left: edit form ── */}
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Informations personnelles">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Nom complet <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={`${fieldClass("name")} pl-9`}
                  />
                </div>
                {fieldErrors.name && <p className="mt-1 text-xs text-danger">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Email <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`${fieldClass("email")} pl-9`}
                  />
                </div>
                {fieldErrors.email && <p className="mt-1 text-xs text-danger">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Téléphone{" "}
                  <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${fieldClass("phone")} pl-9`}
                  />
                </div>
                {fieldErrors.phone && <p className="mt-1 text-xs text-danger">{fieldErrors.phone}</p>}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Rôle & accès">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-secondary">
                  Rôle <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setRole(r.value);
                        setSelectedZones([]);
                        setPosition("");
                      }}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        role === r.value
                          ? "border-primary bg-primary-soft text-primary-dark"
                          : "border-slate-200 bg-surface text-slate-500 hover:border-primary/40 hover:text-secondary"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {fieldErrors.role && <p className="mt-1 text-xs text-danger">{fieldErrors.role}</p>}
              </div>

              {ROLE_NEEDS_POSITION.includes(role) && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-secondary">
                    Poste{" "}
                    <span className="font-normal text-slate-400">(optionnel)</span>
                  </label>
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder={`ex: Responsable ${role}`}
                    className={fieldClass("position")}
                  />
                  {fieldErrors.position && (
                    <p className="mt-1 text-xs text-danger">{fieldErrors.position}</p>
                  )}
                </div>
              )}

              {role === "livreur" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-secondary">
                      Max livraisons auto-assignées{" "}
                      <span className="font-normal text-slate-400">(optionnel)</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={maxSelfAssign}
                      onChange={(e) => setMaxSelfAssign(e.target.value)}
                      className={fieldClass("max_self_assign_deliveries")}
                    />
                    {fieldErrors.max_self_assign_deliveries && (
                      <p className="mt-1 text-xs text-danger">
                        {fieldErrors.max_self_assign_deliveries}
                      </p>
                    )}
                  </div>

                  {zones.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-secondary">
                        Zones de livraison{" "}
                        <span className="font-normal text-slate-400">(optionnel)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {zones.map((z) => (
                          <button
                            key={z.id}
                            type="button"
                            onClick={() => toggleZone(z.id)}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                              selectedZones.includes(z.id)
                                ? "border-primary bg-primary-soft text-primary-dark"
                                : "border-slate-200 bg-surface text-slate-500 hover:border-primary/40"
                            }`}
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            {z.name}
                          </button>
                        ))}
                      </div>
                      {fieldErrors.zone_ids && (
                        <p className="mt-1 text-xs text-danger">{fieldErrors.zone_ids}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>

          <Button
            type="button"
            variant="secondary"
            href="/settings/users"
            className="w-full justify-center"
          >
            Annuler
          </Button>

          <div className="my-2 border-t border-slate-100" />

          {/* ── Reset password ── */}
          <Dialog
            open={resetOpen}
            onOpenChange={(o) => {
              setResetOpen(o);
              if (!o) setNewPassword(null);
            }}
          >
            <DialogTrigger className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-surface text-sm font-semibold text-secondary transition hover:bg-slate-50">
              <KeyRound className="h-4 w-4" />
              Réinitialiser le mot de passe
            </DialogTrigger>

            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
              </DialogHeader>

              {newPassword ? (
                <div className="space-y-4 pt-1">
                  <p className="text-xs text-slate-400">
                    Copiez le mot de passe temporaire et partagez-le avec l'utilisateur.
                    Il devra le changer à sa prochaine connexion.
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="flex-1 font-mono text-sm font-semibold tracking-wide text-secondary">
                      {newPassword}
                    </span>
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copié !" : "Copier"}
                    </button>
                  </div>
                  <DialogFooter>
                    <DialogClose className="flex h-9 w-full items-center justify-center rounded-xl bg-primary text-xs font-bold text-white transition hover:opacity-90">
                      Fermer
                    </DialogClose>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <p className="text-sm text-slate-500">
                    Un nouveau mot de passe temporaire sera généré pour{" "}
                    <span className="font-semibold text-secondary">{user.name}</span>.
                    L'ancien mot de passe sera invalidé immédiatement.
                  </p>
                  <DialogFooter>
                    <DialogClose className="flex h-9 items-center rounded-xl border border-slate-200 px-4 text-xs font-semibold text-secondary transition hover:bg-slate-50">
                      Annuler
                    </DialogClose>
                    <button
                      type="button"
                      disabled={resetting}
                      onClick={handleResetPassword}
                      className="flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {resetting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Réinitialiser
                    </button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* ── Delete ── */}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger-soft text-sm font-semibold text-danger transition hover:bg-danger/10">
              <Trash2 className="h-4 w-4" />
              Supprimer
            </DialogTrigger>

            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Supprimer l'utilisateur</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-500">
                Êtes-vous sûr de vouloir supprimer{" "}
                <span className="font-semibold text-secondary">{user.name}</span> ?
                Cette action est irréversible.
              </p>
              <DialogFooter>
                <DialogClose className="flex h-9 items-center rounded-xl border border-slate-200 px-4 text-xs font-semibold text-secondary transition hover:bg-slate-50">
                  Annuler
                </DialogClose>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex h-9 items-center gap-2 rounded-xl bg-danger px-4 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirmer la suppression
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Account info */}
          <div className="mt-2 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-400">
            <p className="font-semibold text-secondary">Compte</p>
            <div className="flex justify-between gap-2">
              <span>Créé le</span>
              <span className="font-medium text-secondary">
                {new Date(user.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Modifié le</span>
              <span className="font-medium text-secondary">
                {new Date(user.updatedAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Email vérifié</span>
              <span className={`font-medium ${user.emailVerifiedAt ? "text-primary" : "text-slate-400"}`}>
                {user.emailVerifiedAt ? "Oui" : "Non"}
              </span>
            </div>
            {user.mustChangePassword && (
              <p className="mt-1.5 rounded-lg bg-warn-soft px-2 py-1 text-center font-semibold text-warn">
                Doit changer son mot de passe
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
