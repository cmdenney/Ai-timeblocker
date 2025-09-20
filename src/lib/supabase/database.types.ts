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
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          timezone: string
          working_hours: Json | null
          preferences: Json | null
          google_access_token: string | null
          google_refresh_token: string | null
          google_calendar_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          working_hours?: Json | null
          preferences?: Json | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_calendar_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          working_hours?: Json | null
          preferences?: Json | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_calendar_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          is_all_day: boolean
          location: string | null
          category: string
          priority: string
          color: string | null
          recurrence_rule: string | null
          recurrence_pattern: string | null
          attendees: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          is_all_day?: boolean
          location?: string | null
          category?: string
          priority?: string
          color?: string | null
          recurrence_rule?: string | null
          recurrence_pattern?: string | null
          attendees?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          is_all_day?: boolean
          location?: string | null
          category?: string
          priority?: string
          color?: string | null
          recurrence_rule?: string | null
          recurrence_pattern?: string | null
          attendees?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          metadata: Json | null
          created_at: string
          updated_at: string
          last_message_at: string
          message_count: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          last_message_at?: string
          message_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          last_message_at?: string
          message_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          content?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_threads: {
        Row: {
          id: string
          session_id: string
          parent_id: string | null
          title: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
          is_collapsed: boolean
        }
        Insert: {
          id?: string
          session_id: string
          parent_id?: string | null
          title?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          is_collapsed?: boolean
        }
        Update: {
          id?: string
          session_id?: string
          parent_id?: string | null
          title?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          is_collapsed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_threads_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          }
        ]
      }
      nlp_analyses: {
        Row: {
          id: string
          user_id: string
          input_text: string
          analysis_result: Json
          confidence_score: number
          processing_time: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_text: string
          analysis_result: Json
          confidence_score: number
          processing_time: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_text?: string
          analysis_result?: Json
          confidence_score?: number
          processing_time?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nlp_analyses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_patterns: {
        Row: {
          id: string
          user_id: string
          pattern_type: string
          pattern_data: Json
          confidence: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pattern_type: string
          pattern_data: Json
          confidence: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pattern_type?: string
          pattern_data?: Json
          confidence?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_patterns_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      event_category: "work" | "personal" | "meeting" | "break" | "focus" | "other"
      event_priority: "low" | "medium" | "high" | "urgent"
      message_role: "user" | "assistant" | "system"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
