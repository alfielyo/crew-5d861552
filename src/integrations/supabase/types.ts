export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          id: string
          run_date_id: string
          status: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          run_date_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          run_date_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_run_date_id_fkey"
            columns: ["run_date_id"]
            isOneToOne: false
            referencedRelation: "run_dates"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          run_group_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          run_group_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          run_group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_run_group_id_fkey"
            columns: ["run_group_id"]
            isOneToOne: false
            referencedRelation: "run_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_runs: {
        Row: {
          error_message: string | null
          groups_created: number
          id: string
          run_date_id: string
          status: string
          triggered_at: string
        }
        Insert: {
          error_message?: string | null
          groups_created?: number
          id?: string
          run_date_id: string
          status?: string
          triggered_at?: string
        }
        Update: {
          error_message?: string | null
          groups_created?: number
          id?: string
          run_date_id?: string
          status?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_runs_run_date_id_fkey"
            columns: ["run_date_id"]
            isOneToOne: true
            referencedRelation: "run_dates"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          fitness_level: string | null
          full_name: string | null
          has_consented: boolean
          has_onboarded: boolean
          id: string
          location_area: string | null
          location_city: string | null
          location_country: string | null
          personality_answers: Json | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          fitness_level?: string | null
          full_name?: string | null
          has_consented?: boolean
          has_onboarded?: boolean
          id: string
          location_area?: string | null
          location_city?: string | null
          location_country?: string | null
          personality_answers?: Json | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          fitness_level?: string | null
          full_name?: string | null
          has_consented?: boolean
          has_onboarded?: boolean
          id?: string
          location_area?: string | null
          location_city?: string | null
          location_country?: string | null
          personality_answers?: Json | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          created_at: string
          distance_km: number
          id: string
          map_image_url: string | null
          meeting_point: string
          name: string
          post_run_cafe: string
          run_date_id: string
          waypoints: Json
        }
        Insert: {
          created_at?: string
          distance_km?: number
          id?: string
          map_image_url?: string | null
          meeting_point?: string
          name?: string
          post_run_cafe?: string
          run_date_id: string
          waypoints?: Json
        }
        Update: {
          created_at?: string
          distance_km?: number
          id?: string
          map_image_url?: string | null
          meeting_point?: string
          name?: string
          post_run_cafe?: string
          run_date_id?: string
          waypoints?: Json
        }
        Relationships: [
          {
            foreignKeyName: "routes_run_date_id_fkey"
            columns: ["run_date_id"]
            isOneToOne: true
            referencedRelation: "run_dates"
            referencedColumns: ["id"]
          },
        ]
      }
      run_dates: {
        Row: {
          created_at: string
          date: string
          id: string
          meeting_point: string
          price_pence: number
          status: string
          time: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          meeting_point?: string
          price_pence?: number
          status?: string
          time?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          meeting_point?: string
          price_pence?: number
          status?: string
          time?: string
        }
        Relationships: []
      }
      run_group_members: {
        Row: {
          id: string
          run_group_id: string
          user_id: string
        }
        Insert: {
          id?: string
          run_group_id: string
          user_id: string
        }
        Update: {
          id?: string
          run_group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_group_members_run_group_id_fkey"
            columns: ["run_group_id"]
            isOneToOne: false
            referencedRelation: "run_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      run_groups: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          name: string
          run_date_id: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          name: string
          run_date_id: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          name?: string
          run_date_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_groups_run_date_id_fkey"
            columns: ["run_date_id"]
            isOneToOne: false
            referencedRelation: "run_dates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
