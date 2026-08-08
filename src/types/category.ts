export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  image: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
