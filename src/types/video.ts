export interface Video {
  id: number;
  title: string;
  description: string | null;
  sourceType: "youtube" | "tiktok" | "upload";
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  url: string | null;
  thumbnail: string | null;
  isStory: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface VideosResponse {
  data: Video[];
  meta: VideoMeta;
}
