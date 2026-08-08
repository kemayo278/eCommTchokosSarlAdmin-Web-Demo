"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { produits as allProducts } from "@/lib/data";
import { fcfa } from "@/lib/format";
import { ProductThumbnail } from "@/components/product/Thumbnail/ProductThumbnail";

const MAX_VISIBLE = 3;

export function PackProducts({
  packName,
  products,
}: {
  packName: string;
  products: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const overflow = products.length - MAX_VISIBLE;
  const visibleProducts = products.slice(0, MAX_VISIBLE);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-400">
        {products.length} product(s)
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {visibleProducts.map((product) => (
          <span
            key={product}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
          >
            {product}
          </span>
        ))}
        {overflow > 0 && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-dark transition hover:bg-primary/15"
          >
            +{overflow} · see more
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Products in pack ${packName}`}
        >
          <div
            className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="animate-rise relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="font-bold text-secondary">{packName}</p>
                <p className="text-xs text-slate-400">
                  {products.length} product(s) in this pack
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-secondary"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="scroll-slim space-y-2 overflow-y-auto p-5">
              {products.map((name) => {
                const info = allProducts.find((p) => p.nom === name);
                return (
                  <li
                    key={name}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <ProductThumbnail />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-secondary">
                        {name}
                      </p>
                      {info && (
                        <p className="text-xs text-slate-400">
                          {info.categorie} · {fcfa(info.prix)}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
