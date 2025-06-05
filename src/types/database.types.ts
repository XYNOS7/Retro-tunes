export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      playlists: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      playlist_songs: {
        Row: {
          id: string
          playlist_id: string
          song_id: string
          song_title: string
          song_url: string
          created_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          song_id: string
          song_title: string
          song_url: string
          created_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          song_id?: string
          song_title?: string
          song_url?: string
          created_at?: string
        }
      }
      songs: {
        Row: {
          id: string
          title: string
          artist: string
          url: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          title: string
          artist?: string
          url: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          title?: string
          artist?: string
          url?: string
          uploaded_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 