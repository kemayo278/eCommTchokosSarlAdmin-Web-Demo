export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  roles: string[];
  emailVerifiedAt: string | null;
  referralCode: string | null;
  hasUnlockedReferral: number;
  mustChangePassword: boolean;
  maxSelfAssignDeliveries: number;
  zones: { id: number; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface UserMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface UsersResponse {
  data: User[];
  meta: UserMeta;
}

export interface LoginResponse {
  user: User;
  token: string;
  must_change_password: boolean;
}
