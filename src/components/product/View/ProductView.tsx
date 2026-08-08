"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Package,
  Tag,
  Barcode,
  Weight,
  Star,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { PageHeader, Badge, SectionCard, Button } from "@/components/ui/primitives";
import axiosClient from "@/lib/api/axiosClient";
import type { Product } from "@/types/product";
import { fcfa } from "@/lib/format";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-400 shrink-0 w-36">{label}</span>
      <span className="text-sm font-medium text-secondary text-right">{children}</span>
    </div>
  );
}

export default function ProductView({ productId }: { productId?: number }) {
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    axiosClient
      .get<Product>(`/v1/products/${productId}`)
      .then(({ data }) => {
        setProduct(data);
        setActiveImage(data.primaryImage ?? data.images[0]?.imageUrl ?? null);
      })
      .catch(() => setError("Impossible de charger le produit."))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <LoadingSpinner />;
  
  if (error || !product) return <ErrorAlert message={error ?? "Produit introuvable."} />;

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        titre={product.name}
        sousTitre={`Réf. ${product.sku}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/products")}>
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
            <Button onClick={() => router.push(`/products/${productId}/edit`)}>
              <Edit className="h-4 w-4" /> Modifier
            </Button>
          </div>
        }
      />

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        {product.isActive ? (
          <Badge tone="primary"><CheckCircle className="h-3 w-3" /> Actif</Badge>
        ) : (
          <Badge tone="danger"><XCircle className="h-3 w-3" /> Inactif</Badge>
        )}
        {product.isFeatured && (
          <Badge tone="warn"><Star className="h-3 w-3" /> Mis en avant</Badge>
        )}
        {product.stockQuantity === 0 && (
          <Badge tone="danger">Rupture de stock</Badge>
        )}
        {product.stockQuantity > 0 && product.stockQuantity < 10 && (
          <Badge tone="warn">Stock faible</Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Images */}
          {product.images.length > 0 && (
            <SectionCard title="Images">
              <div className="space-y-3">
                {/* Main image */}
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center">
                  {activeImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeImage}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-slate-200" />
                  )}
                </div>
                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.images.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(img.imageUrl)}
                        className={`shrink-0 h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                          activeImage === img.imageUrl
                            ? "border-primary"
                            : "border-transparent"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Description */}
          {(product.shortDescription || product.description || product.longDescription) && (
            <SectionCard title="Description">
              <div className="space-y-3">
                {product.shortDescription && (
                  <p className="text-sm font-medium text-secondary">
                    {product.shortDescription}
                  </p>
                )}
                {product.description && (
                  <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                )}
                {product.longDescription && (
                  <>
                    <hr className="border-slate-100" />
                    <div
                      className="prose prose-sm max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{ __html: product.longDescription }}
                    />
                  </>
                )}
              </div>
            </SectionCard>
          )}

          {/* Variants */}
          {product.variants && (product.variants as unknown[]).length > 0 && (
            <SectionCard title={`Variantes (${(product.variants as unknown[]).length})`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-2 text-left font-semibold text-slate-400">Nom</th>
                      <th className="pb-2 text-left font-semibold text-slate-400">SKU</th>
                      <th className="pb-2 text-right font-semibold text-slate-400">Ajustement</th>
                      <th className="pb-2 text-right font-semibold text-slate-400">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(product.variants as Array<{ name: string; sku: string; priceAdjustment: number; stockQuantity: number }>).map((v, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 font-medium text-secondary">{v.name}</td>
                        <td className="py-2 text-slate-400">{v.sku}</td>
                        <td className="py-2 text-right">
                          {v.priceAdjustment > 0 ? "+" : ""}{fcfa(v.priceAdjustment)}
                        </td>
                        <td className="py-2 text-right">{v.stockQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── Right column ────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Pricing */}
          <SectionCard title="Prix">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-secondary">{fcfa(product.price)}</span>
                {discount && (
                  <Badge tone="primary">-{discount}%</Badge>
                )}
              </div>
              {product.comparePrice && (
                <p className="text-sm text-slate-400 line-through">{fcfa(product.comparePrice)}</p>
              )}
            </div>
          </SectionCard>

          {/* Inventory */}
          <SectionCard title="Inventaire">
            <InfoRow label="Stock">
              <span className={product.stockQuantity === 0 ? "text-danger" : product.stockQuantity < 10 ? "text-warn" : "text-secondary"}>
                {product.stockQuantity} unités
              </span>
            </InfoRow>
            <InfoRow label="SKU">
              <span className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-slate-400" />{product.sku}
              </span>
            </InfoRow>
            {product.barcode && (
              <InfoRow label="Code-barres">
                <span className="flex items-center gap-1.5">
                  <Barcode className="h-3.5 w-3.5 text-slate-400" />{product.barcode}
                </span>
              </InfoRow>
            )}
          </SectionCard>

          {/* Organisation */}
          <SectionCard title="Organisation">
            <InfoRow label="Catégorie">{product.category.name}</InfoRow>
            <InfoRow label="Slug">
              <span className="font-mono text-xs">{product.slug}</span>
            </InfoRow>
            {product.weight && (
              <InfoRow label="Poids">
                <span className="flex items-center gap-1.5">
                  <Weight className="h-3.5 w-3.5 text-slate-400" />{product.weight} g
                </span>
              </InfoRow>
            )}
            {product.dimensions && (
              <InfoRow label="Dimensions">
                {product.dimensions.width} × {product.dimensions.height} × {product.dimensions.length} cm
              </InfoRow>
            )}
          </SectionCard>

          {/* SEO */}
          {(product.metaTitle || product.metaDescription) && (
            <SectionCard title="SEO">
              {product.metaTitle && <InfoRow label="Meta titre">{product.metaTitle}</InfoRow>}
              {product.metaDescription && (
                <InfoRow label="Meta description">{product.metaDescription}</InfoRow>
              )}
            </SectionCard>
          )}

          {/* Dates */}
          <SectionCard title="Dates">
            <InfoRow label="Créé le">
              {new Date(product.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </InfoRow>
            <InfoRow label="Modifié le">
              {new Date(product.updatedAt).toLocaleDateString("fr-FR", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </InfoRow>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
