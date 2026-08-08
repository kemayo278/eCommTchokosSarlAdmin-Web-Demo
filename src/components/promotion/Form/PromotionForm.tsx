"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactSelect, { components, type OptionProps } from "react-select";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { ProductThumbnail } from "@/components/product/Thumbnail/ProductThumbnail";
import { PageHeader, Button, SectionCard } from "@/components/ui/primitives";
import { Field, Select, Toggle, FormRow } from "@/components/ui/Field";
import axiosClient from "@/lib/api/axiosClient";
import { handleApiError } from "@/lib/api/handleApiError";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { fcfa } from "@/lib/format";
import type { Product } from "@/types/product";
import type { Coupon } from "@/types/coupon";

const PER_PAGE = 100;

interface ProductOption {
  value: number;
  label: string;
  image: string | null;
  category: string;
  price: number;
}

function OptionWithImage(props: OptionProps<ProductOption, true>) {
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-3">
        <ProductThumbnail src={props.data.image} name={props.data.label} size="h-8 w-8" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-secondary">{props.data.label}</p>
          <p className="text-xs text-slate-400">
            {props.data.category} · {fcfa(props.data.price)}
          </p>
        </div>
      </div>
    </components.Option>
  );
}

export default function PromotionForm({ couponId }: { couponId?: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = couponId !== undefined;

  // Loading
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  // Products
  const [products, setProducts] = useState<Product[]>([]);

  // Form fields
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [active, setActive] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoadingInitial(true);
    setInitError(null);

    const productsRequest = axiosClient
      .get<{ data: Product[]; meta: { last_page: number } }>("/v1/products", {
        params: { page: 1, per_page: PER_PAGE },
      })
      .then(async ({ data: first }) => {
        const lastPage = first.meta.last_page;
        if (lastPage <= 1) return first.data;
        const rest = await Promise.all(
          Array.from({ length: lastPage - 1 }, (_, i) =>
            axiosClient
              .get<{ data: Product[] }>("/v1/products", {
                params: { page: i + 2, per_page: PER_PAGE },
              })
              .then((r) => r.data.data)
          )
        );
        return [...first.data, ...rest.flat()];
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
      axiosClient.get<Coupon>(`/v1/coupons/${couponId}`),
    ])
      .then(([list, { data: coupon }]) => {
        setProducts(list);
        setCode(coupon.code);
        setType(coupon.type);
        setDiscountValue(String(coupon.value));
        setMinOrder(coupon.minOrderAmount ? String(coupon.minOrderAmount) : "");
        setMaxUses(coupon.maxUses ? String(coupon.maxUses) : "");
        setStartDate(coupon.startsAt ? coupon.startsAt.slice(0, 10) : "");
        setEndDate(coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "");
        setActive(coupon.isActive);
        setSelectedProductIds(coupon.products.map((p) => p.id));
      })
      .catch((err) => setInitError(handleApiError(err, "Impossible de charger la promotion")))
      .finally(() => setLoadingInitial(false));
  }, [fetchKey, couponId]);

  const options: ProductOption[] = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: p.name,
        image: p.primaryImage,
        category: p.category?.name ?? "",
        price: p.price,
      })),
    [products]
  );

  const selectedOptions = options.filter((o) => selectedProductIds.includes(o.value));
  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));

  function removeProduct(id: number) {
    setSelectedProductIds((ids) => ids.filter((x) => x !== id));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = "Le code est obligatoire.";
    if (!discountValue || Number(discountValue) <= 0)
      errs.value = "La valeur doit être un nombre positif.";
    if (type === "percentage" && Number(discountValue) > 100)
      errs.value = "Le pourcentage ne peut pas dépasser 100.";
    if (startDate && endDate && new Date(endDate) <= new Date(startDate))
      errs.expires_at = "La date de fin doit être postérieure à la date de début.";
    return errs;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);

    const appliesToAll = selectedProductIds.length === 0;

    const payload: Record<string, unknown> = {
      code: code.trim().toUpperCase(),
      type,
      value: Number(discountValue),
      is_active: active,
      applies_to_all_products: appliesToAll,
    };
    if (minOrder) payload.min_order_amount = Number(minOrder);
    if (maxUses) payload.max_uses = Number(maxUses);
    if (startDate) payload.starts_at = startDate;
    if (endDate) payload.expires_at = endDate;
    if (!appliesToAll) payload.product_ids = selectedProductIds;

    try {
      if (isEdit) {
        await axiosClient.put(`/v1/coupons/${couponId}`, payload);
        toast({ title: "Promotion mise à jour", description: `Le coupon « ${payload.code} » a été enregistré.` });
      } else {
        await axiosClient.post("/v1/coupons", payload);
        toast({ title: "Promotion créée", description: `Le coupon « ${payload.code} » a été créé avec succès.` });
      }
      router.push("/products/promotions");
    } catch (err: any) {
      setSubmitError(handleApiError(err, "Impossible d'enregistrer la promotion"));
      const serverErrors = err?.response?.data?.errors as Record<string, string[]> | undefined;
      if (serverErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(serverErrors).forEach(([key, msgs]) => {
          mapped[key] = msgs[0] ?? "";
        });
        setFieldErrors(mapped);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInitial) return <LoadingSpinner />;

  if (initError)
    return (
      <ErrorAlert
        message={initError}
        onRetry={() => {
          setInitError(null);
          setFetchKey((k) => k + 1);
        }}
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" href="/products/promotions" className="px-2.5!">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          titre={isEdit ? "Modifier la promotion" : "Nouvelle promotion"}
          sousTitre="Créez un coupon applicable à un ou plusieurs produits"
        />
      </div>

      {submitError && (
        <div className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {submitError}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* ── Coupon ── */}
          <SectionCard title="Coupon">
            <div className="space-y-4">
              <FormRow>
                <Field
                  label="Code du coupon"
                  value={code}
                  onChange={(v) => {
                    setCode(v.toUpperCase());
                    setFieldErrors((p) => ({ ...p, code: "" }));
                  }}
                  placeholder="RENTREE10"
                  required
                  error={fieldErrors.code}
                />
                <Select
                  label="Type de réduction"
                  value={type}
                  onChange={(v) => setType(v as "percentage" | "fixed")}
                  options={[
                    { valeur: "percentage", libelle: "Pourcentage (%)" },
                    { valeur: "fixed", libelle: "Montant fixe (FCFA)" },
                  ]}
                />
              </FormRow>

              <FormRow>
                <Field
                  label="Valeur"
                  value={discountValue}
                  onChange={(v) => {
                    setDiscountValue(v);
                    setFieldErrors((p) => ({ ...p, value: "" }));
                  }}
                  placeholder={type === "percentage" ? "10" : "1500"}
                  suffix={type === "percentage" ? "%" : "FCFA"}
                  type="number"
                  required
                  error={fieldErrors.value}
                />
                <Field
                  label="Montant minimum de commande"
                  value={minOrder}
                  onChange={setMinOrder}
                  placeholder="20000"
                  suffix="FCFA"
                  type="number"
                  error={fieldErrors.min_order_amount}
                />
              </FormRow>

              <FormRow>
                <Field
                  label="Nombre max d'utilisations"
                  value={maxUses}
                  onChange={setMaxUses}
                  placeholder="500"
                  type="number"
                  error={fieldErrors.max_uses}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    label="Début"
                    value={startDate}
                    onChange={setStartDate}
                    type="date"
                    error={fieldErrors.starts_at}
                  />
                  <Field
                    label="Fin"
                    value={endDate}
                    onChange={(v) => {
                      setEndDate(v);
                      setFieldErrors((p) => ({ ...p, expires_at: "" }));
                    }}
                    type="date"
                    error={fieldErrors.expires_at}
                  />
                </div>
              </FormRow>
            </div>
          </SectionCard>

          {/* ── Products ── */}
          <SectionCard title="Produits concernés">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-secondary">
                Ajouter des produits à la promotion
              </span>
              <ReactSelect<ProductOption, true>
                isMulti
                options={options}
                value={selectedOptions}
                onChange={(vals) => setSelectedProductIds(vals.map((v) => v.value))}
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

            {selectedProducts.length > 0 && (
              <ul className="mt-4 space-y-2">
                {selectedProducts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <ProductThumbnail src={p.primaryImage} name={p.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-secondary">{p.name}</p>
                      <p className="text-xs text-slate-400">
                        {p.category?.name} · {fcfa(p.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(p.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-danger-soft hover:text-danger"
                      aria-label={`Retirer ${p.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-xs text-slate-400">
              {selectedProductIds.length === 0
                ? "Aucun produit sélectionné : la promotion s'appliquera à toute la boutique."
                : `${selectedProductIds.length} produit(s) sélectionné(s).`}
            </p>
          </SectionCard>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          <SectionCard title="Statut">
            <Toggle
              label="Promotion active"
              description="Utilisable dès maintenant"
              actif={active}
              onChange={setActive}
            />
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
              "Créer la promotion"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
