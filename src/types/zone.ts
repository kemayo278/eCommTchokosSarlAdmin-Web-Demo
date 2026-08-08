export interface Zone {
  id: number;
  name: string;
  description: string | null;
  deliveryCost: number | null;
  isActive: boolean;
  livreursCount: number;
  createdAt: string;
  updatedAt: string;
}
