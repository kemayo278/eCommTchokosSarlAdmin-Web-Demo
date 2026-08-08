"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactSelect from "react-select";
import { ArrowLeft, ChevronDown, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { PageHeader, Button, SectionCard } from "@/components/ui/primitives";
import { Field, Textarea, Toggle, FormRow } from "@/components/ui/Field";
import RichTextEditor from "@/components/ui/rich-text-editor";
import axiosClient from "@/lib/api/axiosClient";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { handleApiError } from "@/lib/api/handleApiError";
import { selectStyles } from "@/lib/selectStyles";
import type { SelectOption } from "@/lib/selectStyles";

interface Variant {
  id?: number;
  name: string;
  sku: string;
  priceAdjustment: string;
  stockQuantity: string;
}

type ImageEntry =
  | { kind: "existing"; id: number; url: string }
  | { kind: "new"; file: File; url: string };

export default function ProductForm({ productId }: { productId?: number }) {
  const router = useRouter();
  const isEdit = productId !== undefined;

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [stock, setStock] = useState("");
  const [weight, setWeight] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [removedVariantIds, setRemovedVariantIds] = useState<number[]>([]);
  const [variantsOpen, setVariantsOpen] = useState(!isEdit);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const blobUrls = useRef<Set<string>>(new Set());
  useEffect(() => () => blobUrls.current.forEach(URL.revokeObjectURL), []);

  const dragIndex = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  useEffect(() => {
    const catRequest = axiosClient.get<Category[]>("/v1/categories");

    if (isEdit) {
      Promise.all([catRequest, axiosClient.get<Product>(`/v1/products/${productId}`)])
        .then(([catRes, prodRes]) => {
          setCategories(catRes.data);
          const p = prodRes.data;
          setName(p.name);
          setSku(p.sku);
          setBarcode(p.barcode ?? "");
          setCategoryId(p.categoryId);
          setPrice(String(p.price));
          setComparePrice(p.comparePrice ? String(p.comparePrice) : "");
          setStock(String(p.stockQuantity));
          setWeight(p.weight ? String(p.weight) : "");
          setShortDescription(p.shortDescription ?? "");
          setDescription(p.description ?? "");
          setLongDescription(p.longDescription ?? "");
          setMetaTitle(p.metaTitle ?? "");
          setMetaDescription(p.metaDescription ?? "");
          setActive(p.isActive);
          setFeatured(p.isFeatured);
          setImageEntries(
            [...p.images]
              .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
              .map((img) => ({ kind: "existing" as const, id: img.id, url: img.imageUrl }))
          );
          setVariants(
            (p.variants ?? []).map((v) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              priceAdjustment: String(v.priceAdjustment),
              stockQuantity: String(v.stockQuantity),
            }))
          );
        })
        .catch((err) => {
        const message = handleApiError(err, "Erreur lors du chargement des catégories");
        setInitError(message);
      })
        .finally(() => setLoadingInitial(false));
    } else {
      catRequest
        .then(({ data }) => {
          setCategories(data);
          if (data.length > 0) setCategoryId(data[0].id);
        })
        .catch((err) => {
          const message = handleApiError(err, "Erreur lors du chargement des catégories");
          setInitError(message);
        })
        .finally(() => setLoadingInitial(false));
    }
  }, [productId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const entries: ImageEntry[] = files.map((file) => {
      const url = URL.createObjectURL(file);
      blobUrls.current.add(url);
      return { kind: "new", file, url };
    });
    setImageEntries((prev) => [...prev, ...entries]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    const entry = imageEntries[index];
    if (entry.kind === "existing") {
      setRemovedImageIds((prev) => [...prev, entry.id]);
    } else {
      URL.revokeObjectURL(entry.url);
      blobUrls.current.delete(entry.url);
    }
    setImageEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(index);
  };
  const handleDrop = (dropIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === dropIdx) { setDragOverIdx(null); return; }
    setImageEntries((prev) => {
      const next = [...prev];
      [next[from], next[dropIdx]] = [next[dropIdx], next[from]];
      return next;
    });
    dragIndex.current = null;
    setDragOverIdx(null);
  };
  const handleDragEnd = () => { dragIndex.current = null; setDragOverIdx(null); };

  const addVariant = () =>
    setVariants((prev) => [
      ...prev,
      { name: "", sku: "", priceAdjustment: "0", stockQuantity: "0" },
    ]);
  const updateVariant = (i: number, field: keyof Variant, val: string) =>
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: val } : v))
    );
  const removeVariant = (i: number) => {
    const v = variants[i];
    if (v.id) setRemovedVariantIds((prev) => [...prev, v.id!]);
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  };

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};

    if (!categoryId) {
      errs.categoryId = "La catégorie est obligatoire.";
    }
    if (!name.trim()) {
      errs.name = "Le nom est obligatoire.";
    } else if (name.trim().length > 255) {
      errs.name = "Le nom ne doit pas dépasser 255 caractères.";
    }
    if (shortDescription.length > 500) {
      errs.shortDescription = "La description courte ne doit pas dépasser 500 caractères.";
    }
    if (description.length > 10000) {
      errs.description = "La description ne doit pas dépasser 10 000 caractères.";
    }
    if (longDescription.length > 30000) {
      errs.longDescription = "La description longue ne doit pas dépasser 30 000 caractères.";
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      errs.price = "Le prix est obligatoire et doit être ≥ 0.";
    }
    if (comparePrice) {
      if (isNaN(Number(comparePrice)) || Number(comparePrice) < 0) {
        errs.comparePrice = "Le prix barré doit être un nombre ≥ 0.";
      } else if (price && Number(comparePrice) <= Number(price)) {
        errs.comparePrice = "Le prix barré doit être supérieur au prix.";
      }
    }
    if (!sku.trim()) {
      errs.sku = "Le SKU est obligatoire.";
    } else if (sku.trim().length > 100) {
      errs.sku = "Le SKU ne doit pas dépasser 100 caractères.";
    }
    if (barcode && barcode.length > 100) {
      errs.barcode = "Le code-barres ne doit pas dépasser 100 caractères.";
    }
    if (stock === "" || isNaN(Number(stock)) || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
      errs.stock = "La quantité est obligatoire et doit être un entier ≥ 0.";
    }
    if (weight && (isNaN(Number(weight)) || Number(weight) < 0)) {
      errs.weight = "Le poids doit être un nombre ≥ 0.";
    }
    if (metaTitle && metaTitle.length > 255) {
      errs.metaTitle = "Le méta titre ne doit pas dépasser 255 caractères.";
    }
    if (metaDescription && metaDescription.length > 500) {
      errs.metaDescription = "La méta description ne doit pas dépasser 500 caractères.";
    }
    if (imageEntries.length === 0) {
      errs.images = "Au moins une image est obligatoire.";
    } else {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      for (const entry of imageEntries) {
        if (entry.kind === "new") {
          if (!allowedTypes.includes(entry.file.type)) {
            errs.images = "Format accepté : jpg, jpeg, png, webp, gif.";
            break;
          } else if (entry.file.size > 2048 * 1024) {
            errs.images = "Une image ne doit pas dépasser 2 Mo.";
            break;
          }
        }
      }
    }
    variants.forEach((v, i) => {
      if (!v.name.trim()) {
        errs[`variant_${i}_name`] = "Le nom est obligatoire.";
      } else if (v.name.trim().length > 255) {
        errs[`variant_${i}_name`] = "Le nom ne doit pas dépasser 255 caractères.";
      }
      if (!v.sku.trim()) {
        errs[`variant_${i}_sku`] = "Le SKU est obligatoire.";
      } else if (v.sku.trim().length > 100) {
        errs[`variant_${i}_sku`] = "Le SKU ne doit pas dépasser 100 caractères.";
      }
      if (v.priceAdjustment && (isNaN(Number(v.priceAdjustment)) || Number(v.priceAdjustment) < -999999 || Number(v.priceAdjustment) > 999999)) {
        errs[`variant_${i}_priceAdjustment`] = "L'ajustement doit être entre -999 999 et 999 999.";
      }
      if (v.stockQuantity === "" || isNaN(Number(v.stockQuantity)) || !Number.isInteger(Number(v.stockQuantity)) || Number(v.stockQuantity) < 0) {
        errs[`variant_${i}_stockQuantity`] = "Le stock doit être un entier ≥ 0.";
      }
    });

    return errs;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append("category_id", String(categoryId));
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("price", String(Number(price)));
    formData.append("sku", sku);
    formData.append("stock_quantity", String(Number(stock)));
    formData.append("is_active", active ? "1" : "0");
    formData.append("is_featured", featured ? "1" : "0");
    if (description) formData.append("description", description);
    if (longDescription) formData.append("long_description", longDescription);
    if (shortDescription) formData.append("short_description", shortDescription);
    if (comparePrice) formData.append("compare_price", String(Number(comparePrice)));
    if (barcode) formData.append("barcode", barcode);
    if (weight) formData.append("weight", String(Number(weight)));
    if (metaTitle) formData.append("meta_title", metaTitle);
    if (metaDescription) formData.append("meta_description", metaDescription);

    imageEntries
      .filter((e): e is Extract<ImageEntry, { kind: "new" }> => e.kind === "new")
      .forEach((e) => formData.append("images[]", e.file));
    removedImageIds.forEach((id) => formData.append("removed_image_ids[]", String(id)));
    if (!hasNewImages && imageEntries[0]?.kind === "existing") {
      formData.append("primary_image_id", String(imageEntries[0].id));
    }

    removedVariantIds.forEach((id) => formData.append("removed_variant_ids[]", String(id)));
    variants.forEach((v, i) => {
      if (v.id) {
        formData.append(`variants[${i}][id]`, String(v.id));
      }
      formData.append(`variants[${i}][name]`, v.name);
      formData.append(`variants[${i}][sku]`, v.sku);
      formData.append(`variants[${i}][price_adjustment]`, String(Number(v.priceAdjustment)));
      formData.append(`variants[${i}][stock_quantity]`, String(Number(v.stockQuantity)));
      formData.append(`variants[${i}][is_active]`, "1");
    });

    try {
      if (isEdit) {
        formData.append("_method", "PUT");
        await axiosClient.post(`/v1/products/${productId}`, formData);
      } else {
        await axiosClient.post("/v1/products", formData);
      }
      router.push("/products");
    } catch (err: any) {
      const message = handleApiError(err);
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInitial) return <LoadingSpinner />;

  if (initError)
    return <ErrorAlert message={initError} onRetry={() => {
      setInitError(null);
    }} />;

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const totalImages = imageEntries.length;

  const hasNewImages = imageEntries.some((e) => e.kind === "new");
  const primaryBadgeIndex = hasNewImages
    ? imageEntries.findIndex((e) => e.kind === "new")
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" href="/products" className="!px-2.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          titre={isEdit ? "Modifier le produit" : "Ajouter un produit"}
          sousTitre="Renseignez les informations du produit"
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
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Informations générales">
            <div className="space-y-4">
              <Field
                label="Nom du produit"
                value={name}
                onChange={(v) => { setName(v); setFieldErrors((p) => ({ ...p, name: "" })); }}
                placeholder="Sac à main cuir premium"
                required
                error={fieldErrors.name}
              />
              {slug && (
                <p className="text-xs text-slate-400">Slug : /products/{slug}</p>
              )}
              <Textarea
                label="Description courte"
                value={shortDescription}
                onChange={(v) => { setShortDescription(v); setFieldErrors((p) => ({ ...p, shortDescription: "" })); }}
                rows={2}
                placeholder="Résumé affiché sur la fiche produit"
                error={fieldErrors.shortDescription}
              />
              <Textarea
                label="Description complète"
                value={description}
                onChange={(v) => { setDescription(v); setFieldErrors((p) => ({ ...p, description: "" })); }}
                placeholder="Détails, matières, entretien…"
                error={fieldErrors.description}
              />
              <RichTextEditor
                label="Description longue"
                value={longDescription}
                onChange={(v) => { setLongDescription(v); setFieldErrors((p) => ({ ...p, longDescription: "" })); }}
                placeholder="Contenu étendu : guide d'utilisation, histoire du produit…"
                error={fieldErrors.longDescription}
              />
            </div>
          </SectionCard>

          <SectionCard title="Prix & stock">
            <div className="space-y-4">
              <FormRow>
                <Field
                  label="Prix"
                  value={price}
                  onChange={(v) => { setPrice(v); setFieldErrors((p) => ({ ...p, price: "" })); }}
                  placeholder="18900"
                  suffix="FCFA"
                  type="number"
                  required
                  error={fieldErrors.price}
                />
                <Field
                  label="Prix barré (optionnel)"
                  value={comparePrice}
                  onChange={(v) => { setComparePrice(v); setFieldErrors((p) => ({ ...p, comparePrice: "" })); }}
                  placeholder="24000"
                  suffix="FCFA"
                  type="number"
                  error={fieldErrors.comparePrice}
                />
              </FormRow>
              <FormRow>
                <Field
                  label="Quantité en stock"
                  value={stock}
                  onChange={(v) => { setStock(v); setFieldErrors((p) => ({ ...p, stock: "" })); }}
                  placeholder="34"
                  type="number"
                  required
                  error={fieldErrors.stock}
                />
                <Field
                  label="Poids"
                  value={weight}
                  onChange={(v) => { setWeight(v); setFieldErrors((p) => ({ ...p, weight: "" })); }}
                  placeholder="0.5"
                  suffix="kg"
                  type="number"
                  error={fieldErrors.weight}
                />
              </FormRow>
              <FormRow>
                <Field
                  label="SKU"
                  value={sku}
                  onChange={(v) => { setSku(v); setFieldErrors((p) => ({ ...p, sku: "" })); }}
                  placeholder="SAC-001"
                  required
                  error={fieldErrors.sku}
                />
                <Field
                  label="Code-barres"
                  value={barcode}
                  onChange={(v) => { setBarcode(v); setFieldErrors((p) => ({ ...p, barcode: "" })); }}
                  placeholder="6001234567890"
                  error={fieldErrors.barcode}
                />
              </FormRow>
            </div>
          </SectionCard>

          <SectionCard
            title={`Variantes${variants.length > 0 ? ` (${variants.length})` : ""}`}
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-soft"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => setVariantsOpen((o) => !o)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-secondary"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${variantsOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
            }
          >
            {variantsOpen && (variants.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                Aucune variante. Cliquez sur « Ajouter » pour en créer une.
              </p>
            ) : (
              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">
                        Variante {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Nom"
                        value={v.name}
                        onChange={(val) => { updateVariant(i, "name", val); setFieldErrors((p) => ({ ...p, [`variant_${i}_name`]: "" })); }}
                        placeholder="128 Go - Noir"
                        required
                        error={fieldErrors[`variant_${i}_name`]}
                      />
                      <Field
                        label="SKU"
                        value={v.sku}
                        onChange={(val) => { updateVariant(i, "sku", val); setFieldErrors((p) => ({ ...p, [`variant_${i}_sku`]: "" })); }}
                        placeholder="PDT-128-BLK"
                        required
                        error={fieldErrors[`variant_${i}_sku`]}
                      />
                      <Field
                        label="Ajustement prix"
                        value={v.priceAdjustment}
                        onChange={(val) => { updateVariant(i, "priceAdjustment", val); setFieldErrors((p) => ({ ...p, [`variant_${i}_priceAdjustment`]: "" })); }}
                        suffix="FCFA"
                        type="number"
                        placeholder="0"
                        error={fieldErrors[`variant_${i}_priceAdjustment`]}
                      />
                      <Field
                        label="Stock"
                        value={v.stockQuantity}
                        onChange={(val) => { updateVariant(i, "stockQuantity", val); setFieldErrors((p) => ({ ...p, [`variant_${i}_stockQuantity`]: "" })); }}
                        type="number"
                        placeholder="0"
                        required
                        error={fieldErrors[`variant_${i}_stockQuantity`]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Référencement (SEO)">
            <div className="space-y-4">
              <Field
                label="Meta titre"
                value={metaTitle}
                onChange={(v) => { setMetaTitle(v); setFieldErrors((p) => ({ ...p, metaTitle: "" })); }}
                placeholder="Sac à main cuir premium — Tchokos"
                error={fieldErrors.metaTitle}
              />
              <Textarea
                label="Meta description"
                value={metaDescription}
                onChange={(v) => { setMetaDescription(v); setFieldErrors((p) => ({ ...p, metaDescription: "" })); }}
                rows={2}
                placeholder="Description pour les moteurs de recherche"
                error={fieldErrors.metaDescription}
              />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Organisation">
            <div className="space-y-4">
              <div>
                <span className="text-sm font-semibold text-secondary">
                  Catégorie<span className="ml-0.5 text-danger">*</span>
                </span>
                <div className="mt-1.5">
                  <ReactSelect<SelectOption, false>
                    value={categoryOptions.find((o) => o.value === categoryId) ?? null}
                    onChange={(opt) => { setCategoryId(opt?.value ?? null); setFieldErrors((p) => ({ ...p, categoryId: "" })); }}
                    options={categoryOptions}
                    placeholder="Sélectionner une catégorie"
                    noOptionsMessage={() => "Aucune catégorie"}
                    styles={selectStyles}
                  />
                  {fieldErrors.categoryId && (
                    <p className="mt-1 text-xs text-danger">{fieldErrors.categoryId}</p>
                  )}
                </div>
              </div>
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <Toggle
                  label="Produit actif"
                  description="Visible sur la boutique"
                  actif={active}
                  onChange={setActive}
                />
                <Toggle
                  label="Mettre en vedette"
                  description="Affiché en page d'accueil"
                  actif={featured}
                  onChange={setFeatured}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title={`Images${totalImages > 0 ? ` (${totalImages})` : ""}`}>
            <div className="grid grid-cols-2 gap-2">
              {imageEntries.map((entry, index) => (
                <div
                  key={entry.kind === "existing" ? `ex-${entry.id}` : `new-${entry.url}`}
                  draggable
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver(index)}
                  onDrop={handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={`relative aspect-square cursor-grab overflow-hidden rounded-xl border-2 bg-slate-50 transition-all active:cursor-grabbing active:opacity-50 ${
                    dragOverIdx === index && dragIndex.current !== index
                      ? "border-primary scale-105 shadow-lg"
                      : "border-slate-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.url}
                    alt=""
                    className="h-full w-full object-cover pointer-events-none"
                  />
                  {index === primaryBadgeIndex && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      Principale
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-danger"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-primary/50 hover:bg-primary-soft/20 hover:text-primary-dark"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-semibold">
                  {totalImages === 0 ? "Ajouter des images" : "Ajouter"}
                </span>
              </button>
            </div>
            {totalImages === 0 && (
              <p className="mt-2 text-center text-xs text-slate-400">
                PNG, JPG jusqu'à 2 Mo
              </p>
            )}
            {fieldErrors.images && (
              <p className="mt-2 text-xs text-danger">{fieldErrors.images}</p>
            )}
          </SectionCard>

          <button
            type="submit"
            disabled={submitting || !categoryId}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : isEdit ? (
              "Mettre à jour"
            ) : (
              "Enregistrer le produit"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
