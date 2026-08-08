"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactSelect, { components, type OptionProps } from "react-select";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";
import { ProductThumbnail } from "@/components/product/Thumbnail/ProductThumbnail";
import { PageHeader, Button, SectionCard } from "@/components/ui/primitives";
import { Field, Textarea, Select, Toggle, FormRow } from "@/components/ui/Field";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import type { Product } from "@/types/product";
import { fcfa } from "@/lib/format";
import { toast, useToast } from "@/hooks/use-toast";

interface ProductOption {
  value: number;
  label: string;
  category?: string;
  price?: number;
}

interface SelectedEntry {
  id: number;
  discountPercent: string;
  discountFixed: string;
}

function OptionWithImage(props: OptionProps<ProductOption, true>) {
  const opt = props.data;
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-3">
        <ProductThumbnail size="h-8 w-8" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-secondary">{opt.label}</p>
          {opt.category && <p className="text-xs text-slate-400">{opt.category}</p>}
        </div>
      </div>
    </components.Option>
  );
}

function isoToLocal(iso: string): string {
  return iso.slice(0, 16);
}

export default function PackForm({ packId }: { packId?: number }) {
  const router = useRouter();
  const isEdit = packId !== undefined;

  const { toast } = useToast();

  const [fetchKey, setFetchKey] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("pack");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [selectedEntries, setSelectedEntries] = useState<SelectedEntry[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const coverBlobUrl = useRef<string | null>(null);
  useEffect(() => () => { if (coverBlobUrl.current) URL.revokeObjectURL(coverBlobUrl.current); }, []);

  useEffect(() => {
    setLoadingInitial(true);
    setInitError(null);

    const PER_PAGE = 100;

    const productsRequest = axiosClient
      .get<{ data: Product[]; meta: { last_page: number } }>("/v1/products", {
        params: { page: 1, per_page: PER_PAGE },
      })
      .then(async ({ data: first }) => {
        const firstPage = first.data;
        const lastPage = first.meta.last_page;
        if (lastPage <= 1) return firstPage;
        const rest = await Promise.all(
          Array.from({ length: lastPage - 1 }, (_, i) =>
            axiosClient
              .get<{ data: Product[] }>("/v1/products", {
                params: { page: i + 2, per_page: PER_PAGE },
              })
              .then((r) => r.data.data)
          )
        );
        return [...firstPage, ...rest.flat()];
      });

    if (!isEdit) {
      productsRequest
        .then((list) => setProducts(list))
        .catch((err) => setInitError(handleApiError(err, "Impossible de charger les produits")))
        .finally(() => setLoadingInitial(false));
      return;
    }

    Promise.all([
      productsRequest,
      axiosClient.get<import("@/types/pack").Pack>(`/v1/packs/${packId}`),
    ])
      .then(([list, { data: pack }]) => {
        setProducts(list);
        setName(pack.name);
        setDescription(pack.description ?? "");
        setType(pack.type);
        setStartsAt(pack.startsAt ? isoToLocal(pack.startsAt) : "");
        setExpiresAt(pack.expiresAt ? isoToLocal(pack.expiresAt) : "");
        setIsActive(pack.isActive);
        setSortOrder(String(pack.sortOrder));
        setSelectedEntries(
          pack.products.map((pp) => ({
            id: pp.productId,
            discountPercent: pp.discountPercent != null ? String(pp.discountPercent) : "",
            discountFixed: pp.discountFixed != null ? String(pp.discountFixed) : "",
          }))
        );
        if (pack.coverImage) {
          setExistingCoverUrl(pack.coverImage);
          setCoverPreview(pack.coverImage);
        }
      })
      .catch((err) => setInitError(handleApiError(err, "Impossible de charger le pack")))
      .finally(() => setLoadingInitial(false));
  }, [fetchKey, packId]);

  const productOptions: ProductOption[] = products.map((p) => ({
    value: p.id,
    label: p.name,
    category: p.category?.name,
    price: p.price,
  }));

  const selectionValue = productOptions.filter((o) =>
    selectedEntries.some((e) => e.id === o.value)
  );

  function handleSelectionChange(vals: readonly ProductOption[]) {
    const newIds = vals.map((v) => v.value);
    setSelectedEntries((prev) => {
      const kept = prev.filter((e) => newIds.includes(e.id));
      const added = newIds
        .filter((id) => !prev.some((e) => e.id === id))
        .map((id) => ({ id, discountPercent: "", discountFixed: "" }));
      return [...kept, ...added];
    });
  }

  function removeProduct(id: number) {
    setSelectedEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function updateEntry(id: number, field: "discountPercent" | "discountFixed", value: string) {
    setSelectedEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverBlobUrl.current) URL.revokeObjectURL(coverBlobUrl.current);
    const url = URL.createObjectURL(file);
    coverBlobUrl.current = url;
    setCoverImage(file);
    setCoverPreview(url);
    e.target.value = "";
  }

  function removeCover() {
    if (coverBlobUrl.current) { URL.revokeObjectURL(coverBlobUrl.current); coverBlobUrl.current = null; }
    setCoverImage(null);
    setCoverPreview(null);
    setExistingCoverUrl(null);
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Le nom du pack est obligatoire.";
    else if (name.trim().length > 255) errs.name = "Le nom ne doit pas dépasser 255 caractères.";
    if (!coverPreview) errs.coverImage = "L'image de couverture est obligatoire.";
    if (expiresAt && startsAt && new Date(expiresAt) <= new Date(startsAt))
      errs.expiresAt = "La date d'expiration doit être postérieure à la date de début.";
    if (sortOrder !== "" && (isNaN(Number(sortOrder)) || Number(sortOrder) < 0 || !Number.isInteger(Number(sortOrder))))
      errs.sortOrder = "L'ordre doit être un entier positif ou nul.";
    return errs;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("type", type);
    formData.append("is_active", isActive ? "1" : "0");
    formData.append("sort_order", String(Number(sortOrder) || 0));
    if (description) formData.append("description", description);
    if (startsAt) formData.append("starts_at", startsAt);
    if (expiresAt) formData.append("expires_at", expiresAt);
    if (coverImage) formData.append("cover_image", coverImage);

    selectedEntries.forEach((entry, i) => {
      formData.append(`product_ids[${i}][id]`, String(entry.id));
      if (entry.discountPercent) formData.append(`product_ids[${i}][discount_percent]`, entry.discountPercent);
      if (entry.discountFixed) formData.append(`product_ids[${i}][discount_fixed]`, entry.discountFixed);
    });

    try {
      if (isEdit) {
        formData.append("_method", "PUT");
        await axiosClient.post(`/v1/packs/${packId}`, formData);
        toast({ title: "Pack mis à jour", description: `« ${name} » a été enregistré.` });
      } else {
        await axiosClient.post("/v1/packs", formData);
        toast({ title: "Pack créé", description: `« ${name} » a été créé avec succès.` });
      }
      router.push("/products/packs");
    } catch (err: any) {
      setSubmitError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInitial) return <LoadingSpinner />;

  if (initError)
    return (
      <ErrorAlert
        message={initError}
        onRetry={() => { setInitError(null); setFetchKey((k) => k + 1); }}
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" href="/products/packs" className="!px-2.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          titre={isEdit ? "Modifier le pack" : "Nouveau pack"}
          sousTitre="Regroupez plusieurs produits en une offre"
        />
      </div>

      {submitError && (
        <div className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {submitError}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        className="hidden"
        onChange={handleCoverChange}
      />

      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Informations">
            <div className="space-y-4">
              <Field
                label="Nom du pack"
                value={name}
                onChange={(v) => { setName(v); setFieldErrors((p) => ({ ...p, name: "" })); }}
                placeholder="Pack Rentrée Mode"
                required
                error={fieldErrors.name}
              />
              <Textarea
                label="Description"
                value={description}
                onChange={setDescription}
                rows={3}
                placeholder="Décrivez ce que contient le pack"
              />
            </div>
          </SectionCard>

          <SectionCard title="Produits du pack">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-secondary">
                Ajouter des produits
              </span>
              <ReactSelect<ProductOption, true>
                isMulti
                options={productOptions}
                value={selectionValue}
                onChange={handleSelectionChange}
                components={{ Option: OptionWithImage }}
                controlShouldRenderValue={false}
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                placeholder="Choisir un produit…"
                noOptionsMessage={() => "Aucun produit"}
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
                  menu: () =>
                    "mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg",
                  menuList: () => "max-h-64 scroll-slim",
                  option: ({ isFocused, isSelected }) =>
                    `cursor-pointer px-3 py-2 ${
                      isSelected ? "bg-primary-soft" : isFocused ? "bg-slate-50" : ""
                    }`,
                  dropdownIndicator: () => "text-slate-400 px-1",
                  clearIndicator: () => "text-slate-400 px-1",
                  indicatorSeparator: () => "bg-slate-200",
                }}
              />
            </label>

            {selectedEntries.length > 0 && (
              <ul className="mt-4 space-y-2">
                {selectedEntries.map((entry) => {
                  const product = products.find((p) => p.id === entry.id);
                  if (!product) return null;
                  return (
                    <li
                      key={entry.id}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-center gap-3">
                        <ProductThumbnail />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-secondary">
                            {product.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {product.category?.name} · {fcfa(product.price)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProduct(entry.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-danger-soft hover:text-danger"
                          aria-label={`Retirer ${product.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3">
                        <FormRow>
                          <Field
                            label="Remise %"
                            value={entry.discountPercent}
                            onChange={(v) => updateEntry(entry.id, "discountPercent", v)}
                            placeholder="0"
                            suffix="%"
                            type="number"
                          />
                          <Field
                            label="Remise fixe"
                            value={entry.discountFixed}
                            onChange={(v) => updateEntry(entry.id, "discountFixed", v)}
                            placeholder="0"
                            suffix="FCFA"
                            type="number"
                          />
                        </FormRow>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Planification">
            <FormRow>
              <Field
                label="Date de début"
                value={startsAt}
                onChange={(v) => { setStartsAt(v); setFieldErrors((p) => ({ ...p, startsAt: "" })); }}
                type="datetime-local"
              />
              <Field
                label="Date d'expiration"
                value={expiresAt}
                onChange={(v) => { setExpiresAt(v); setFieldErrors((p) => ({ ...p, expiresAt: "" })); }}
                type="datetime-local"
                error={fieldErrors.expiresAt}
              />
            </FormRow>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Paramètres">
            <div className="space-y-4">
              <Select
                label="Type"
                value={type}
                onChange={setType}
                options={[
                  { valeur: "pack", libelle: "Pack" },
                  { valeur: "flash_sale", libelle: "Vente flash" },
                ]}
              />
              <Field
                label="Ordre d'affichage"
                value={sortOrder}
                onChange={(v) => { setSortOrder(v); setFieldErrors((p) => ({ ...p, sortOrder: "" })); }}
                type="number"
                placeholder="0"
                error={fieldErrors.sortOrder}
              />
              <div className="border-t border-slate-100 pt-4">
                <Toggle
                  label="Pack actif"
                  description="Visible sur la boutique"
                  actif={isActive}
                  onChange={setIsActive}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Image de couverture">
            {coverPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreview}
                  alt="Aperçu de la couverture"
                  className="h-40 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-danger"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { fileInputRef.current?.click(); setFieldErrors((p) => ({ ...p, coverImage: "" })); }}
                className={`flex w-full flex-col items-center gap-2 rounded-xl border border-dashed bg-slate-50 py-8 transition ${
                  fieldErrors.coverImage
                    ? "border-danger text-danger"
                    : "border-slate-300 text-slate-400 hover:border-primary/50 hover:text-primary-dark"
                }`}
              >
                <ImagePlus className="h-7 w-7" />
                <span className="text-sm font-semibold">Ajouter une image</span>
                <span className="text-xs opacity-70">PNG, JPG, WEBP — max 2 Mo</span>
              </button>
            )}
            {fieldErrors.coverImage && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.coverImage}</p>
            )}
          </SectionCard>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…
              </>
            ) : isEdit ? (
              "Enregistrer les modifications"
            ) : (
              "Créer le pack"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
