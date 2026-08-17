export interface InfluencerUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  roles: string[];
}

export interface Influencer {
  id: number;
  userId: number;
  user: InfluencerUser;
  commissionPerUser: number;
  minPurchaseForReferral: number;
  totalPoints: number;
  isActive: boolean;
  coupons?: InfluencerCoupon[];
  createdAt: string;
}

export interface InfluencerCoupon {
  id: number;
  code: string;
  value: number | null;
  minOrderAmount: number | null;
  maxUses: number | null;
  expiresAt: string | null;
  usedCount: number;
  isActive: boolean;
}

export interface InfluencerStats {
  total_influencers: number;
  active_influencers: number;
  total_points_awarded: number;
  pending_payouts: number;
  total_paid: number;
}

export interface PayoutRequest {
  id: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
  };
  pointsConverted: number;
  amountFcfa: number;
  paymentMethod: string;
  paymentDetails: string | null;
  status: "pending" | "completed" | "cancelled";
  processedAt: string | null;
  processedBy: unknown | null;
  notes: string | null;
  createdAt: string;
}
