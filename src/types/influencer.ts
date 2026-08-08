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
  influencer: {
    id: number;
    name: string;
    email: string;
  };
  amount: number;
  status: "pending" | "completed" | "cancelled";
  notes: string | null;
  createdAt: string;
}
