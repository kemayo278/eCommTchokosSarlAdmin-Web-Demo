export interface ProductImage {
  id: number;
  image: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  sku: string;
  priceAdjustment: number;
  stockQuantity: number;
  isActive: boolean;
}

export interface Product {
  id: number;
  categoryId: number;
  category: {
    id: number;
    name: string;
    slug: string;
    parentId: number | null;
  };
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  price: number;
  comparePrice: number | null;
  sku: string;
  barcode: string | null;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  weight: number | null;
  dimensions: { width: number; height: number; length: number } | null;
  images: ProductImage[];
  primaryImage: string | null;
  variants: ProductVariant[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}
