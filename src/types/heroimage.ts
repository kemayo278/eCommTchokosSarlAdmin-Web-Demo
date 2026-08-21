export interface HeroImage {
  id: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}