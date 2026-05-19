/**
 * Supabase database schema types (PostgreSQL).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string;
          avatar_url: string;
          banner_url: string;
          links: Json;
          password_hash: string;
          followers_count: number;
          following_count: number;
          created_at: string;
          last_seen_at: string | null;
        };
        Insert: {
          id?: string;
          username: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string;
          banner_url?: string;
          links?: Json;
          password_hash: string;
          followers_count?: number;
          following_count?: number;
          created_at?: string;
          last_seen_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string;
          banner_url?: string;
          links?: Json;
          password_hash?: string;
          followers_count?: number;
          following_count?: number;
          created_at?: string;
          last_seen_at?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          media: Json;
          likes_count: number;
          reposts_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string | null;
          is_pinned: boolean;
          pinned_at: string | null;
          poll: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content?: string;
          media?: Json;
          likes_count?: number;
          reposts_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string | null;
          is_pinned?: boolean;
          pinned_at?: string | null;
          poll?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          media?: Json;
          likes_count?: number;
          reposts_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string | null;
          is_pinned?: boolean;
          pinned_at?: string | null;
          poll?: Json | null;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          parent_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          parent_id?: string | null;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reposts: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      poll_votes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          option_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          option_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          option_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: string;
          post_id: string | null;
          comment_id: string | null;
          emoji: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id: string;
          type: string;
          post_id?: string | null;
          comment_id?: string | null;
          emoji?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          actor_id?: string;
          type?: string;
          post_id?: string | null;
          comment_id?: string | null;
          emoji?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
