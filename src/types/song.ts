export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  uploaded_at: string;
  duration?: number;
  liked?: boolean;
} 