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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_grants: {
        Row: {
          actions: string[]
          created_at: string
          ends_at: string | null
          finance_level: Database["public"]["Enums"]["finance_level"]
          granted_by: string | null
          id: string
          reason: string | null
          role_id: string
          scope_id: string | null
          scope_path: string | null
          scope_type: Database["public"]["Enums"]["scope_type"]
          sections: string[]
          starts_at: string
          status: Database["public"]["Enums"]["grant_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          actions: string[]
          created_at?: string
          ends_at?: string | null
          finance_level?: Database["public"]["Enums"]["finance_level"]
          granted_by?: string | null
          id?: string
          reason?: string | null
          role_id: string
          scope_id?: string | null
          scope_path?: string | null
          scope_type: Database["public"]["Enums"]["scope_type"]
          sections: string[]
          starts_at?: string
          status?: Database["public"]["Enums"]["grant_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: string[]
          created_at?: string
          ends_at?: string | null
          finance_level?: Database["public"]["Enums"]["finance_level"]
          granted_by?: string | null
          id?: string
          reason?: string | null
          role_id?: string
          scope_id?: string | null
          scope_path?: string | null
          scope_type?: Database["public"]["Enums"]["scope_type"]
          sections?: string[]
          starts_at?: string
          status?: Database["public"]["Enums"]["grant_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_grants_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      access_history: {
        Row: {
          actor_id: string | null
          after: Json | null
          before: Json | null
          change_type: string
          created_at: string
          grant_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          change_type: string
          created_at?: string
          grant_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          change_type?: string
          created_at?: string
          grant_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_history_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "access_grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          hash: string | null
          id: number
          ip: unknown
          new_value: Json | null
          object_id: string | null
          object_type: string | null
          prev_hash: string | null
          previous_value: Json | null
          request_id: string | null
          result: string
          scope_id: string | null
          scope_path: string | null
          scope_type: Database["public"]["Enums"]["scope_type"] | null
          section: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          hash?: string | null
          id?: number
          ip?: unknown
          new_value?: Json | null
          object_id?: string | null
          object_type?: string | null
          prev_hash?: string | null
          previous_value?: Json | null
          request_id?: string | null
          result?: string
          scope_id?: string | null
          scope_path?: string | null
          scope_type?: Database["public"]["Enums"]["scope_type"] | null
          section: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          hash?: string | null
          id?: number
          ip?: unknown
          new_value?: Json | null
          object_id?: string | null
          object_type?: string | null
          prev_hash?: string | null
          previous_value?: Json | null
          request_id?: string | null
          result?: string
          scope_id?: string | null
          scope_path?: string | null
          scope_type?: Database["public"]["Enums"]["scope_type"] | null
          section?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country_id: string
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          path: string
          region_id: string | null
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          path: string
          region_id?: string | null
          slug: string
          timezone: string
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          path?: string
          region_id?: string | null
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          created_at: string
          currency_default: string
          id: string
          is_active: boolean
          iso2: string
          legal_jurisdiction: string
          locale_default: string
          name: string
          path: string
          tax_mode: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_default: string
          id?: string
          is_active?: boolean
          iso2: string
          legal_jurisdiction: string
          locale_default?: string
          name: string
          path: string
          tax_mode?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_default?: string
          id?: string
          is_active?: boolean
          iso2?: string
          legal_jurisdiction?: string
          locale_default?: string
          name?: string
          path?: string
          tax_mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          description: string | null
          id: string
          requires_mfa: boolean
          section: string
        }
        Insert: {
          action: string
          description?: string | null
          id?: string
          requires_mfa?: boolean
          section: string
        }
        Update: {
          action?: string
          description?: string | null
          id?: string
          requires_mfa?: boolean
          section?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          completeness: number
          created_at: string
          photo_url: string | null
          socials: Json
          stage_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          completeness?: number
          created_at?: string
          photo_url?: string | null
          socials?: Json
          stage_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          completeness?: number
          created_at?: string
          photo_url?: string | null
          socials?: Json
          stage_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          country_id: string
          created_at: string
          id: string
          name: string
          path: string
          slug: string
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          name: string
          path: string
          slug: string
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          name?: string
          path?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          default_actions: string[]
          default_sections: string[]
          denied_permissions: string[]
          description: string | null
          id: string
          is_system: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_actions?: string[]
          default_sections?: string[]
          denied_permissions?: string[]
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_actions?: string[]
          default_sections?: string[]
          denied_permissions?: string[]
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          scope_id: string | null
          scope_type: Database["public"]["Enums"]["scope_type"]
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          scope_id?: string | null
          scope_type?: Database["public"]["Enums"]["scope_type"]
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          scope_id?: string | null
          scope_type?: Database["public"]["Enums"]["scope_type"]
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_level_assignments: {
        Row: {
          granted_at: string
          id: string
          reason: string | null
          revoked_at: string | null
          user_id: string
          user_level_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          reason?: string | null
          revoked_at?: string | null
          user_id: string
          user_level_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          reason?: string | null
          revoked_at?: string | null
          user_id?: string
          user_level_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_level_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_level_assignments_user_level_id_fkey"
            columns: ["user_level_id"]
            isOneToOne: false
            referencedRelation: "user_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_levels: {
        Row: {
          benefits: Json
          created_at: string
          criteria: Json
          id: string
          name: string
          rank: number
          slug: string
          track: string
        }
        Insert: {
          benefits?: Json
          created_at?: string
          criteria?: Json
          id?: string
          name: string
          rank: number
          slug: string
          track: string
        }
        Update: {
          benefits?: Json
          created_at?: string
          criteria?: Json
          id?: string
          name?: string
          rank?: number
          slug?: string
          track?: string
        }
        Relationships: []
      }
      user_type_assignments: {
        Row: {
          assigned_at: string
          id: string
          source: string
          user_id: string
          user_type_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          source?: string
          user_id: string
          user_type_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          source?: string
          user_id?: string
          user_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_type_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_type_assignments_user_type_id_fkey"
            columns: ["user_type_id"]
            isOneToOne: false
            referencedRelation: "user_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_types: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          name: string
          requires_profile: boolean
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          name: string
          requires_profile?: boolean
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          name?: string
          requires_profile?: boolean
          slug?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          city_id: string | null
          country_id: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          email: string
          email_verified_at: string | null
          first_name: string | null
          handle: string | null
          id: string
          last_active_at: string | null
          last_name: string | null
          locale: string
          marketing_opt_in: boolean
          mfa_enabled: boolean
          phone: string | null
          phone_verified_at: string | null
          referral_code: string
          region_id: string | null
          status: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email: string
          email_verified_at?: string | null
          first_name?: string | null
          handle?: string | null
          id: string
          last_active_at?: string | null
          last_name?: string | null
          locale?: string
          marketing_opt_in?: boolean
          mfa_enabled?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          referral_code?: string
          region_id?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string
          email_verified_at?: string | null
          first_name?: string | null
          handle?: string | null
          id?: string
          last_active_at?: string | null
          last_name?: string | null
          locale?: string
          marketing_opt_in?: boolean
          mfa_enabled?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          referral_code?: string
          region_id?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finance_access: {
        Args: { p_path?: string; p_user_id?: string }
        Returns: Database["public"]["Enums"]["finance_level"]
      }
      has_permission: {
        Args: {
          p_action: string
          p_path?: string
          p_section: string
          p_user_id?: string
        }
        Returns: boolean
      }
      metricas_publicas: {
        Args: never
        Returns: {
          clave: string
          valor: number
        }[]
      }
      path_de_usuario: { Args: { p_user_id: string }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      uuid_generate_v7: { Args: never; Returns: string }
    }
    Enums: {
      finance_level: "NONE" | "LOCAL" | "CITY" | "COUNTRY" | "GLOBAL"
      grant_status: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "REVOKED"
      scope_type:
        | "GLOBAL"
        | "COUNTRY"
        | "REGION"
        | "CITY"
        | "CONTEST"
        | "EVENT"
        | "VENUE"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      finance_level: ["NONE", "LOCAL", "CITY", "COUNTRY", "GLOBAL"],
      grant_status: ["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"],
      scope_type: [
        "GLOBAL",
        "COUNTRY",
        "REGION",
        "CITY",
        "CONTEST",
        "EVENT",
        "VENUE",
      ],
    },
  },
} as const
