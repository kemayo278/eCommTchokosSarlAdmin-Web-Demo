"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  FolderTree,
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";
import ReactSelect from "react-select";
import { PageHeader, Button, SectionCard, Card } from "@/components/ui/primitives";
import { Field, Textarea, Toggle } from "@/components/ui/Field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import axiosClient from "@/lib/api/axiosClient";
import type { Category } from "@/types/category";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { handleApiError } from "@/lib/api/handleApiError";
import ErrorAlert from "@/components/ui/ErrorAlert";

type ParentOption = {
  value: string;
  label: string;
  depth: number;
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface Props {
  categoryId?: number;
}

export default function CategoryForm({ categoryId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = categoryId !== undefined;

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const slug = toSlug(name);

  const fetchCategories = async () => {
    const fetchAll = axiosClient
      .get<Category[]>("/v1/categories")
      .then(({ data }) => setAllCategories(data));

    if (isEdit) {
      Promise.all([
        fetchAll,
        axiosClient
          .get<Category>(`/v1/categories/${categoryId}`)
          .then(({ data }) => {
            setName(data.name);
            setDescription(data.description ?? "");
            setParentId(data.parentId !== null ? String(data.parentId) : "");
            setSortOrder(String(data.sortOrder));
            setIsActive(data.isActive);
            if (data.imageUrl) setImagePreview(data.imageUrl);
          }),
      ])
      .catch((err) => {
        const message = handleApiError(err, "Erreur lors du chargement de la catégorie.");
        setError(message);
      })
      .finally(() => setLoading(false));
    } else {
      fetchAll.finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [categoryId, isEdit]);

  const categoryTree = useMemo(() => {
    const childrenByParent = new Map<number | null, Category[]>();

    for (const category of allCategories) {
      const siblings = childrenByParent.get(category.parentId) ?? [];
      siblings.push(category);
      childrenByParent.set(category.parentId, siblings);
    }

    for (const siblings of childrenByParent.values()) {
      siblings.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    }

    const descendants = new Set<number>();
    if (isEdit && categoryId !== undefined) {
      const stack = [categoryId];
      while (stack.length > 0) {
        const currentId = stack.pop();
        if (currentId === undefined) continue;
        const children = childrenByParent.get(currentId) ?? [];
        for (const child of children) {
          if (descendants.has(child.id)) continue;
          descendants.add(child.id);
          stack.push(child.id);
        }
      }
    }

    const flattened: ParentOption[] = [];

    const walk = (parentId: number | null, depth: number) => {
      const children = childrenByParent.get(parentId) ?? [];
      for (const child of children) {
        if (child.id === categoryId || descendants.has(child.id)) {
          continue;
        }
        flattened.push({
          value: String(child.id),
          label: child.name,
          depth,
        });
        walk(child.id, depth + 1);
      }
    };

    walk(null, 0);

    return flattened;
  }, [allCategories, categoryId, isEdit]);

  const rootOption: ParentOption = {
    value: "",
    label: "Racine (aucun parent)",
    depth: 0,
  };

  const parentOptions = useMemo(() => [rootOption, ...categoryTree], [categoryTree]);

  const selectedParent = parentOptions.find((option) => option.value === parentId) ?? null;

  const parentPreview = allCategories.find((category) => String(category.id) === parentId);

  const formatParentLabel = (option: ParentOption) =>
    option.depth > 0 ? `${"  ".repeat(option.depth)}└─ ${option.label}` : option.label;

  useEffect(() => {
    if (saved) {
      setSaved(false);
    }
  }, [name, description, parentId, sortOrder, isActive]);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = "Le nom est obligatoire.";
    } else if (name.trim().length > 255) {
      errs.name = "Le nom ne doit pas dépasser 255 caractères.";
    }
    if (description.length > 5000) {
      errs.description = "La description ne doit pas dépasser 5 000 caractères.";
    }
    const order = sortOrder === "" ? 0 : Number(sortOrder);
    if (!Number.isInteger(order) || order < 0 || order > 999) {
      errs.sortOrder = "L'ordre doit être un entier entre 0 et 999.";
    }
    if (imageFile) {
      const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(imageFile.type)) {
        errs.image = "Format accepté : jpg, jpeg, png, webp, gif.";
      } else if (imageFile.size > 2048 * 1024) {
        errs.image = "L'image ne doit pas dépasser 2 Mo.";
      }
    }
    return errs;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setError(null);
    setSubmitting(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("slug", slug);
        formData.append("description", description || "");
        formData.append("parent_id", parentId ? String(parentId) : "");
        formData.append("is_active", isActive ? "1" : "0");
        formData.append("sort_order", sortOrder ? String(sortOrder) : "0");
        formData.append("image", imageFile);
        if (isEdit) {
          formData.append("_method", "PUT");
          await axiosClient.post(`/v1/categories/${categoryId}`, formData);
        } else {
          await axiosClient.post("/v1/categories", formData);
        }
      } else {
        const payload = {
          name,
          slug,
          description: description || null,
          parent_id: parentId ? Number(parentId) : null,
          image: removeImage ? null : undefined,
          is_active: isActive,
          sort_order: sortOrder ? Number(sortOrder) : 0,
        };
        if (isEdit) {
          await axiosClient.put(`/v1/categories/${categoryId}`, payload);
        } else {
          await axiosClient.post("/v1/categories", payload);
        }
      }
      toast({
        title: isEdit ? "Catégorie mise à jour" : "Catégorie créée",
        description: isEdit
          ? "Les modifications ont été enregistrées avec succès."
          : "La nouvelle catégorie a été enregistrée avec succès.",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 400);
    } catch (err: any) {
      const message = handleApiError(err);
      setError(message);
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await axiosClient.delete(`/v1/categories/${categoryId}`);
      setDeleteOpen(false);
      toast({
        title: "Catégorie supprimée",
        description: "La catégorie a été supprimée avec succès.",
      });
      router.push("/products/categories");
    } catch (err: any) {
      const message = handleApiError(err);
      setError(message);
      setDeleting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner/>;
  }

  if (error) {
    return (
      <ErrorAlert
        title="Erreur"
        message={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          fetchCategories();
          setTimeout(() => setLoading(false), 100);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" href="/products/categories" className="px-2.5!">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          titre={isEdit ? "Modifier la catégorie" : "Nouvelle catégorie"}
          sousTitre={
            isEdit
              ? `/${slug}`
              : "Créer une catégorie racine ou une sous-catégorie"
          }
        />

        {isEdit && (
          <div className="ml-auto">
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger className="flex items-center gap-2 rounded-xl border border-danger/30  px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white">
                <Trash2 className="h-4 w-4" />
                Supprimer
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Supprimer la catégorie</DialogTitle>
                  <DialogDescription>
                    Cette action est irréversible.{" "}
                    <strong>{name}</strong> et toutes ses sous-catégories
                    seront définitivement supprimées.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <button
                    onClick={() => setDeleteOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-bold text-white transition hover:opacity-80 disabled:opacity-60"
                  >
                    {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirmer
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Informations">
            <div className="space-y-4">
              <Field
                label="Nom de la catégorie"
                value={name}
                onChange={(v) => { setName(v); setFieldErrors((p) => ({ ...p, name: "" })); }}
                placeholder="Sacs à main"
                error={fieldErrors.name}
                required
              />
              {slug && (
                <p className="text-xs text-slate-400">Slug : /{slug}</p>
              )}
              <Textarea
                label="Description"
                value={description}
                onChange={(v) => { setDescription(v); setFieldErrors((p) => ({ ...p, description: "" })); }}
                rows={3}
                placeholder="Description de la catégorie"
                error={fieldErrors.description}
              />
              <Field
                label="Ordre d'affichage"
                value={sortOrder}
                onChange={(v) => { setSortOrder(v); setFieldErrors((p) => ({ ...p, sortOrder: "" })); }}
                placeholder="1"
                type="number"
                error={fieldErrors.sortOrder}
              />
            </div>
          </SectionCard>

          <SectionCard title="Hiérarchie">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-secondary">
                Catégorie parente
              </span>
              <ReactSelect<ParentOption, false>
                isClearable
                options={parentOptions.filter((option) => option.value !== "")}
                value={selectedParent?.value ? selectedParent : null}
                onChange={(option) => setParentId(option?.value ?? "")}
                placeholder="Racine (aucun parent)"
                noOptionsMessage={() => "Aucune catégorie parente"}
                classNamePrefix="rs"
                unstyled
                classNames={{
                  control: ({ isFocused }) =>
                    `rounded-xl border bg-white px-3 py-1 text-sm transition ${
                      isFocused
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-slate-200"
                    }`,
                  placeholder: () => "text-slate-400",
                  input: () => "text-sm",
                  singleValue: () => "text-secondary",
                  menu: () =>
                    "mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg",
                  menuList: () => "max-h-64 scroll-slim",
                  option: ({ isFocused, isSelected }) =>
                    `cursor-pointer px-3 py-2 ${
                      isSelected
                        ? "bg-primary-soft"
                        : isFocused
                        ? "bg-slate-50"
                        : ""
                    }`,
                  dropdownIndicator: () => "px-1 text-slate-400",
                  clearIndicator: () => "px-1 text-slate-400",
                  indicatorSeparator: () => "bg-slate-200",
                }}
                formatOptionLabel={(option) => (
                  <span className="block text-sm text-secondary">
                    {formatParentLabel(option)}
                  </span>
                )}
              />
            </label>
            <Card className="mt-4 bg-slate-50 p-4">
              {parentId ? (
                <div className="text-sm">
                  <p className="flex items-center gap-2 font-semibold text-secondary">
                    <FolderTree className="h-4 w-4 text-primary" />
                    {parentPreview?.name}
                  </p>
                  <p className="mt-1 pl-6 text-slate-500">
                    └─ {name || "Nouvelle sous-catégorie"}
                  </p>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <FolderTree className="h-4 w-4 text-slate-400" />
                  Catégorie racine (niveau supérieur)
                </p>
              )}
            </Card>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Visibilité">
            <Toggle
              label="Catégorie active"
              description="Visible sur la boutique"
              actif={isActive}
              onChange={setIsActive}
            />
          </SectionCard>

          <SectionCard title="Image">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpg,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-xl border border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="aspect-video w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-linear-to-t from-black/60 p-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/20 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
                  >
                    <ImagePlus className="h-3.5 w-3.5" /> Changer
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-danger/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-slate-400 transition hover:border-primary/50 hover:text-primary-dark"
              >
                <ImagePlus className="h-7 w-7" />
                <span className="text-sm font-semibold">Ajouter une image</span>
              </button>
            )}
            {fieldErrors.image && (
              <p className="mt-2 text-xs text-danger">{fieldErrors.image}</p>
            )}
          </SectionCard>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {saved ? (
              <><Check className="h-4 w-4" /> Enregistré</>
            ) : submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</>
            ) : isEdit ? (
              "Enregistrer les modifications"
            ) : (
              "Créer la catégorie"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
