export interface Coupon {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  appliesToAllProducts: boolean;
  influencerId: number | null;
  products: { id: number; name: string }[];
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CouponMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface CouponsResponse {
  data: Coupon[];
  meta: CouponMeta;
}
