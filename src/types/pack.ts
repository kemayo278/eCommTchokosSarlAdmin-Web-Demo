import type { Product } from "@/types/product";

export interface PackProduct {
  id: number;
  packId: number;
  productId: number;
  product: Product;
  discountPercent: number | null;
  discountFixed: number | null;
  isActive: number;
  sortOrder: number;
  createdAt: string;
}

export interface Pack {
  id: number;
  name: string;
  description: string | null;
  coverImage: string | null;
  type: "pack" | "flash_sale";
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  isCurrentlyActive: boolean;
  sortOrder: number;
  products: PackProduct[];
  productsCount: number;
  createdAt: string;
  updatedAt: string;
}
