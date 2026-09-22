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
      attribution_touches: {
        Row: {
          city_id: string | null
          contest_id: string | null
          country_id: string | null
          creative: string | null
          id: string
          landing: string | null
          occurred_at: string
          platform: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          city_id?: string | null
          contest_id?: string | null
          country_id?: string | null
          creative?: string | null
          id?: string
          landing?: string | null
          occurred_at?: string
          platform?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          city_id?: string | null
          contest_id?: string | null
          country_id?: string | null
          creative?: string | null
          id?: string
          landing?: string | null
          occurred_at?: string
          platform?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attribution_touches_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_touches_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_touches_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_touches_user_id_fkey"
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
      booking_requests: {
        Row: {
          budget_amount: number | null
          city_id: string | null
          client_company: string | null
          client_user_id: string | null
          contact_name: string
          created_at: string
          currency: string | null
          email: string
          event_date: string | null
          event_type: string | null
          id: string
          lost_reason: string | null
          message: string | null
          owner_user_id: string | null
          phone: string | null
          status: string
          talent_id: string
          updated_at: string
        }
        Insert: {
          budget_amount?: number | null
          city_id?: string | null
          client_company?: string | null
          client_user_id?: string | null
          contact_name: string
          created_at?: string
          currency?: string | null
          email: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          lost_reason?: string | null
          message?: string | null
          owner_user_id?: string | null
          phone?: string | null
          status?: string
          talent_id: string
          updated_at?: string
        }
        Update: {
          budget_amount?: number | null
          city_id?: string | null
          client_company?: string | null
          client_user_id?: string | null
          contact_name?: string
          created_at?: string
          currency?: string | null
          email?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          lost_reason?: string | null
          message?: string | null
          owner_user_id?: string | null
          phone?: string | null
          status?: string
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_client_user_id_fkey"
            columns: ["client_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categories: {
        Row: {
          assignment: Database["public"]["Enums"]["category_assignment"]
          contest_id: string
          created_at: string
          description: string | null
          eligibility: Json
          id: string
          max_age: number | null
          merge_into: string | null
          min_age: number | null
          min_participants: number
          name: string
          order: number
          prize: Json
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          assignment?: Database["public"]["Enums"]["category_assignment"]
          contest_id: string
          created_at?: string
          description?: string | null
          eligibility?: Json
          id?: string
          max_age?: number | null
          merge_into?: string | null
          min_age?: number | null
          min_participants?: number
          name: string
          order?: number
          prize?: Json
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          assignment?: Database["public"]["Enums"]["category_assignment"]
          contest_id?: string
          created_at?: string
          description?: string | null
          eligibility?: Json
          id?: string
          max_age?: number | null
          merge_into?: string | null
          min_age?: number | null
          min_participants?: number
          name?: string
          order?: number
          prize?: Json
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_merge_into_fkey"
            columns: ["merge_into"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          enrollment_id: string
          id: string
          issued_at: string
          pdf_url: string | null
          serial: string
        }
        Insert: {
          enrollment_id: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          serial?: string
        }
        Update: {
          enrollment_id?: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          serial?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          created_at: string
          device_id: string | null
          gate: string | null
          id: string
          reason: string | null
          result: Database["public"]["Enums"]["checkin_result"]
          scanned_at: string
          staff_user_id: string | null
          ticket_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          gate?: string | null
          id?: string
          reason?: string | null
          result: Database["public"]["Enums"]["checkin_result"]
          scanned_at?: string
          staff_user_id?: string | null
          ticket_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          gate?: string | null
          id?: string
          reason?: string | null
          result?: Database["public"]["Enums"]["checkin_result"]
          scanned_at?: string
          staff_user_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_staff_user_id_fkey"
            columns: ["staff_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
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
      commercial_inventory: {
        Row: {
          contest_id: string | null
          contract_id: string | null
          created_at: string
          currency: string
          ends_at: string | null
          exclusivity: boolean
          id: string
          price: number
          scope_id: string | null
          scope_path: string | null
          scope_type: Database["public"]["Enums"]["scope_type"] | null
          season_id: string | null
          sponsor_id: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["inventory_commercial_status"]
          type: string
          updated_at: string
        }
        Insert: {
          contest_id?: string | null
          contract_id?: string | null
          created_at?: string
          currency?: string
          ends_at?: string | null
          exclusivity?: boolean
          id?: string
          price: number
          scope_id?: string | null
          scope_path?: string | null
          scope_type?: Database["public"]["Enums"]["scope_type"] | null
          season_id?: string | null
          sponsor_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["inventory_commercial_status"]
          type: string
          updated_at?: string
        }
        Update: {
          contest_id?: string | null
          contract_id?: string | null
          created_at?: string
          currency?: string
          ends_at?: string | null
          exclusivity?: boolean
          id?: string
          price?: number
          scope_id?: string | null
          scope_path?: string | null
          scope_type?: Database["public"]["Enums"]["scope_type"] | null
          season_id?: string | null
          sponsor_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["inventory_commercial_status"]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_inventory_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_inventory_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "sponsor_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_inventory_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_inventory_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      contests: {
        Row: {
          age_reference_date: string
          city_id: string | null
          country_id: string
          created_at: string
          created_by: string | null
          id: string
          landing_config: Json
          name: string
          prize: Json
          registration_closes_at: string | null
          registration_opens_at: string | null
          season_id: string
          slug: string
          status: Database["public"]["Enums"]["contest_status"]
          submission_deadline: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          age_reference_date: string
          city_id?: string | null
          country_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          landing_config?: Json
          name: string
          prize?: Json
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          season_id: string
          slug: string
          status?: Database["public"]["Enums"]["contest_status"]
          submission_deadline?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          age_reference_date?: string
          city_id?: string | null
          country_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          landing_config?: Json
          name?: string
          prize?: Json
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          season_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["contest_status"]
          submission_deadline?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contests_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contests_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
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
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          entitlement_id: string | null
          id: string
          progress_pct: number
          source: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          entitlement_id?: string | null
          id?: string
          progress_pct?: number
          source?: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          entitlement_id?: string | null
          id?: string
          progress_pct?: number
          source?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_entitlement_id_fkey"
            columns: ["entitlement_id"]
            isOneToOne: false
            referencedRelation: "entitlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          id: string
          order: number
          title: string
        }
        Insert: {
          course_id: string
          id?: string
          order: number
          title: string
        }
        Update: {
          course_id?: string
          id?: string
          order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_url: string | null
          created_at: string
          currency: string
          description: string | null
          duration_min: number | null
          id: string
          instructor_id: string | null
          language: string
          level: string
          price: number
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_min?: number | null
          id?: string
          instructor_id?: string | null
          language?: string
          level?: string
          price?: number
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_min?: number | null
          id?: string
          instructor_id?: string | null
          language?: string
          level?: string
          price?: number
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          actor_user_id: string | null
          body: string | null
          contact_id: string
          created_at: string
          direction: string | null
          id: string
          occurred_at: string
          source_event_id: string | null
          subject: string | null
          type: string
        }
        Insert: {
          actor_user_id?: string | null
          body?: string | null
          contact_id: string
          created_at?: string
          direction?: string | null
          id?: string
          occurred_at?: string
          source_event_id?: string | null
          subject?: string | null
          type: string
        }
        Update: {
          actor_user_id?: string | null
          body?: string | null
          contact_id?: string
          created_at?: string
          direction?: string | null
          id?: string
          occurred_at?: string
          source_event_id?: string | null
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contact_tags: {
        Row: {
          contact_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          city_id: string | null
          company: string | null
          country_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          owner_user_id: string | null
          phone: string | null
          source: string | null
          status: string
          updated_at: string
          user_id: string | null
          utm: Json
        }
        Insert: {
          city_id?: string | null
          company?: string | null
          country_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          owner_user_id?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          utm?: Json
        }
        Update: {
          city_id?: string | null
          company?: string | null
          country_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          owner_user_id?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          utm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunities: {
        Row: {
          amount: number | null
          city_id: string | null
          contact_id: string
          country_id: string | null
          created_at: string
          currency: string | null
          expected_close: string | null
          id: string
          lost_reason: string | null
          owner_user_id: string | null
          pipeline_id: string
          stage_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          city_id?: string | null
          contact_id: string
          country_id?: string | null
          created_at?: string
          currency?: string | null
          expected_close?: string | null
          id?: string
          lost_reason?: string | null
          owner_user_id?: string | null
          pipeline_id: string
          stage_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          city_id?: string | null
          contact_id?: string
          country_id?: string | null
          created_at?: string
          currency?: string | null
          expected_close?: string | null
          id?: string
          lost_reason?: string | null
          owner_user_id?: string | null
          pipeline_id?: string
          stage_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          created_at: string
          entity_type: Database["public"]["Enums"]["crm_entity"]
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          entity_type: Database["public"]["Enums"]["crm_entity"]
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          entity_type?: Database["public"]["Enums"]["crm_entity"]
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      crm_stages: {
        Row: {
          id: string
          name: string
          order: number
          pipeline_id: string
          probability: number | null
          sla_hours: number | null
        }
        Insert: {
          id?: string
          name: string
          order: number
          pipeline_id: string
          probability?: number | null
          sla_hours?: number | null
        }
        Update: {
          id?: string
          name?: string
          order?: number
          pipeline_id?: string
          probability?: number | null
          sla_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tags: {
        Row: {
          color: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      domain_events: {
        Row: {
          attempts: number
          contact_id: string | null
          dispatched_at: string | null
          id: string
          last_error: string | null
          name: string
          occurred_at: string
          payload: Json
          user_id: string | null
        }
        Insert: {
          attempts?: number
          contact_id?: string | null
          dispatched_at?: string | null
          id?: string
          last_error?: string | null
          name: string
          occurred_at?: string
          payload?: Json
          user_id?: string | null
        }
        Update: {
          attempts?: number
          contact_id?: string | null
          dispatched_at?: string | null
          id?: string
          last_error?: string | null
          name?: string
          occurred_at?: string
          payload?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          kind: string
          ref_id: string | null
          ref_type: string | null
          source_id: string | null
          source_type: string | null
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          kind: string
          ref_id?: string | null
          ref_type?: string | null
          source_id?: string | null
          source_type?: string | null
          starts_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          kind?: string
          ref_id?: string | null
          ref_type?: string | null
          source_id?: string | null
          source_type?: string | null
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          created_at: string
          id: string
          participant_id: string
          round_id: string
          status: string
          submitted_at: string | null
          updated_at: string
          video_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: string
          round_id: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          video_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: string
          round_id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entries_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          city_id: string | null
          contest_id: string | null
          country_id: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          name: string
          online_url: string | null
          sales_end: string | null
          sales_start: string | null
          slug: string
          starts_at: string
          status: string
          timezone: string
          type: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          capacity?: number | null
          city_id?: string | null
          contest_id?: string | null
          country_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          name: string
          online_url?: string | null
          sales_end?: string | null
          sales_start?: string | null
          slug: string
          starts_at: string
          status?: string
          timezone?: string
          type?: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          capacity?: number | null
          city_id?: string | null
          contest_id?: string | null
          country_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          name?: string
          online_url?: string | null
          sales_end?: string | null
          sales_start?: string | null
          slug?: string
          starts_at?: string
          status?: string
          timezone?: string
          type?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          amount_base: number | null
          approved_by: string | null
          category_id: string
          city_id: string | null
          contest_id: string | null
          cost_center: string
          country_id: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          event_id: string | null
          fx_rate: number
          id: string
          invoice_number: string | null
          paid_at: string | null
          payment_method: string | null
          receipt_url: string | null
          scope_path: string
          season_id: string | null
          tax: number
          vendor: string | null
        }
        Insert: {
          amount: number
          amount_base?: number | null
          approved_by?: string | null
          category_id: string
          city_id?: string | null
          contest_id?: string | null
          cost_center: string
          country_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          event_id?: string | null
          fx_rate?: number
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          scope_path: string
          season_id?: string | null
          tax?: number
          vendor?: string | null
        }
        Update: {
          amount?: number
          amount_base?: number | null
          approved_by?: string | null
          category_id?: string
          city_id?: string | null
          contest_id?: string | null
          cost_center?: string
          country_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          event_id?: string | null
          fx_rate?: number
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          scope_path?: string
          season_id?: string | null
          tax?: number
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          code: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["financial_kind"]
          name: string
          parent_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["financial_kind"]
          name: string
          parent_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["financial_kind"]
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          available: number | null
          id: string
          location_id: string
          low_stock_threshold: number
          on_hand: number
          reserved: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          available?: number | null
          id?: string
          location_id: string
          low_stock_threshold?: number
          on_hand?: number
          reserved?: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          available?: number | null
          id?: string
          location_id?: string
          low_stock_threshold?: number
          on_hand?: number
          reserved?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustments: {
        Row: {
          actor_user_id: string | null
          created_at: string
          delta: number
          id: string
          inventory_id: string
          reason: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          delta: number
          id?: string
          inventory_id: string
          reason: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          inventory_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_locations: {
        Row: {
          city_id: string | null
          country_id: string | null
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          id?: string
          name: string
          type?: string
        }
        Update: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_locations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_locations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          location_id: string
          qty: number
          released_at: string | null
          user_id: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          location_id: string
          qty: number
          released_at?: string | null
          user_id?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          location_id?: string
          qty?: number
          released_at?: string | null
          user_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_assignments: {
        Row: {
          created_at: string
          due_at: string | null
          entry_id: string
          id: string
          judge_id: string
          round_id: string
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          entry_id: string
          id?: string
          judge_id: string
          round_id: string
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          entry_id?: string
          id?: string
          judge_id?: string
          round_id?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_assignments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_assignments_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_assignments_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_scores: {
        Row: {
          assignment_id: string
          comment: string | null
          created_at: string
          criteria_scores: Json
          id: string
          locked_at: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          comment?: string | null
          created_at?: string
          criteria_scores?: Json
          id?: string
          locked_at?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          comment?: string | null
          created_at?: string
          criteria_scores?: Json
          id?: string
          locked_at?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_scores_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "judge_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      judges: {
        Row: {
          bio: string | null
          country_id: string | null
          created_at: string
          display_name: string
          id: string
          photo_url: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          country_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          country_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "judges_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_document_versions: {
        Row: {
          body_hash: string
          body_md: string
          created_at: string
          created_by: string | null
          document_id: string
          effective_from: string | null
          effective_to: string | null
          id: string
          status: Database["public"]["Enums"]["legal_version_status"]
          version: number
        }
        Insert: {
          body_hash?: string
          body_md: string
          created_at?: string
          created_by?: string | null
          document_id: string
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          status?: Database["public"]["Enums"]["legal_version_status"]
          version: number
        }
        Update: {
          body_hash?: string
          body_md?: string
          created_at?: string
          created_by?: string | null
          document_id?: string
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          status?: Database["public"]["Enums"]["legal_version_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "legal_document_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          created_at: string
          id: string
          jurisdiction: string
          name: string
          slug: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          jurisdiction: string
          name: string
          slug: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          jurisdiction?: string
          name?: string
          slug?: string
          type?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          enrollment_id: string
          id: string
          lesson_id: string
          seconds_watched: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          enrollment_id: string
          id?: string
          lesson_id: string
          seconds_watched?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          enrollment_id?: string
          id?: string
          lesson_id?: string
          seconds_watched?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          asset_ref: Json
          duration_s: number | null
          id: string
          is_preview: boolean
          module_id: string
          order: number
          title: string
          type: string
        }
        Insert: {
          asset_ref?: Json
          duration_s?: number | null
          id?: string
          is_preview?: boolean
          module_id: string
          order: number
          title: string
          type?: string
        }
        Update: {
          asset_ref?: Json
          duration_s?: number | null
          id?: string
          is_preview?: boolean
          module_id?: string
          order?: number
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_consents: {
        Row: {
          channel: Database["public"]["Enums"]["consent_channel"]
          contact_id: string
          granted: boolean
          granted_at: string
          id: string
          ip: unknown
          locale: string | null
          revoked_at: string | null
          source: string | null
        }
        Insert: {
          channel: Database["public"]["Enums"]["consent_channel"]
          contact_id: string
          granted: boolean
          granted_at?: string
          id?: string
          ip?: unknown
          locale?: string | null
          revoked_at?: string | null
          source?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["consent_channel"]
          contact_id?: string
          granted?: boolean
          granted_at?: string
          id?: string
          ip?: unknown
          locale?: string | null
          revoked_at?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_consents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_definitions: {
        Row: {
          created_at: string
          definition: string
          name: string
          owner_area: string | null
          slug: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          definition: string
          name: string
          owner_area?: string | null
          slug: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          definition?: string
          name?: string
          owner_area?: string | null
          slug?: string
          unit?: string | null
        }
        Relationships: []
      }
      metrics_daily: {
        Row: {
          city_id: string | null
          computed_at: string
          contest_id: string | null
          country_id: string | null
          date: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metric: string
          scope_path: string | null
          value: number
        }
        Insert: {
          city_id?: string | null
          computed_at?: string
          contest_id?: string | null
          country_id?: string | null
          date: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metric: string
          scope_path?: string | null
          value: number
        }
        Update: {
          city_id?: string | null
          computed_at?: string
          contest_id?: string | null
          country_id?: string | null
          date?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metric?: string
          scope_path?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_daily_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_daily_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_daily_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_daily_metric_fkey"
            columns: ["metric"]
            isOneToOne: false
            referencedRelation: "metric_definitions"
            referencedColumns: ["slug"]
          },
        ]
      }
      order_items: {
        Row: {
          discount: number
          fulfillment_status: string
          id: string
          metadata: Json
          order_id: string
          qty: number
          sellable_id: string | null
          sellable_type: string
          tax: number
          total: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          discount?: number
          fulfillment_status?: string
          id?: string
          metadata?: Json
          order_id: string
          qty: number
          sellable_id?: string | null
          sellable_type?: string
          tax?: number
          total: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          discount?: number
          fulfillment_status?: string
          id?: string
          metadata?: Json
          order_id?: string
          qty?: number
          sellable_id?: string | null
          sellable_type?: string
          tax?: number
          total?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city_id: string | null
          country_id: string | null
          created_at: string
          currency: string
          discount: number
          id: string
          number: string
          placed_at: string | null
          shipping: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string
          utm: Json
        }
        Insert: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          currency?: string
          discount?: number
          id?: string
          number?: string
          placed_at?: string | null
          shipping?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id: string
          utm?: Json
        }
        Update: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string
          currency?: string
          discount?: number
          id?: string
          number?: string
          placed_at?: string | null
          shipping?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string
          utm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "orders_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          age_at_reference: number | null
          age_verification: string
          category_id: string | null
          contest_id: string
          created_at: string
          eligibility_snapshot: Json
          id: string
          registered_at: string
          status: Database["public"]["Enums"]["participant_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          age_at_reference?: number | null
          age_verification?: string
          category_id?: string | null
          contest_id: string
          created_at?: string
          eligibility_snapshot?: Json
          id?: string
          registered_at?: string
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          age_at_reference?: number | null
          age_verification?: string
          category_id?: string | null
          contest_id?: string
          created_at?: string
          eligibility_snapshot?: Json
          id?: string
          registered_at?: string
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fee: number | null
          id: string
          method: string | null
          net: number | null
          order_id: string
          paid_at: string | null
          provider: string
          provider_payment_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          fee?: number | null
          id?: string
          method?: string | null
          net?: number | null
          order_id: string
          paid_at?: string | null
          provider?: string
          provider_payment_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fee?: number | null
          id?: string
          method?: string | null
          net?: number | null
          order_id?: string
          paid_at?: string | null
          provider?: string
          provider_payment_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      product_variants: {
        Row: {
          compare_price: number | null
          cost: number | null
          created_at: string
          currency: string
          id: string
          option_values: Json
          price: number
          product_id: string
          sku: string
          status: string
          updated_at: string
        }
        Insert: {
          compare_price?: number | null
          cost?: number | null
          created_at?: string
          currency?: string
          id?: string
          option_values?: Json
          price: number
          product_id: string
          sku: string
          status?: string
          updated_at?: string
        }
        Update: {
          compare_price?: number | null
          cost?: number | null
          created_at?: string
          currency?: string
          id?: string
          option_values?: Json
          price?: number
          product_id?: string
          sku?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          contest_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          requires_shipping: boolean
          season_id: string | null
          slug: string
          status: string
          type: string
          updated_at: string
          weight_g: number | null
        }
        Insert: {
          contest_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          requires_shipping?: boolean
          season_id?: string | null
          slug: string
          status?: string
          type?: string
          updated_at?: string
          weight_g?: number | null
        }
        Update: {
          contest_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          requires_shipping?: boolean
          season_id?: string | null
          slug?: string
          status?: string
          type?: string
          updated_at?: string
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
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
      refunds: {
        Row: {
          actor_user_id: string | null
          amount: number
          created_at: string
          id: string
          payment_id: string
          reason: string
          refunded_at: string | null
          status: string
        }
        Insert: {
          actor_user_id?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_id: string
          reason: string
          refunded_at?: string | null
          status?: string
        }
        Update: {
          actor_user_id?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_id?: string
          reason?: string
          refunded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
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
      release_acceptances: {
        Row: {
          accepted_at: string
          accepted_checkboxes: Json
          contest_id: string | null
          id: string
          ip: unknown
          locale: string | null
          participant_id: string | null
          user_agent: string | null
          user_id: string
          version_id: string
          video_id: string | null
        }
        Insert: {
          accepted_at?: string
          accepted_checkboxes?: Json
          contest_id?: string | null
          id?: string
          ip?: unknown
          locale?: string | null
          participant_id?: string | null
          user_agent?: string | null
          user_id: string
          version_id: string
          video_id?: string | null
        }
        Update: {
          accepted_at?: string
          accepted_checkboxes?: Json
          contest_id?: string | null
          id?: string
          ip?: unknown
          locale?: string | null
          participant_id?: string | null
          user_agent?: string | null
          user_id?: string
          version_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "release_acceptances_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_acceptances_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_acceptances_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "legal_document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_acceptances_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_entries: {
        Row: {
          amount: number
          amount_base: number | null
          city_id: string | null
          contest_id: string | null
          cost_center: string
          country_id: string
          created_at: string
          currency: string
          event_id: string | null
          fx_rate: number
          id: string
          net: number | null
          occurred_at: string
          order_id: string | null
          scope_path: string
          season_id: string | null
          source: Database["public"]["Enums"]["revenue_source"]
          tax: number
        }
        Insert: {
          amount: number
          amount_base?: number | null
          city_id?: string | null
          contest_id?: string | null
          cost_center: string
          country_id: string
          created_at?: string
          currency?: string
          event_id?: string | null
          fx_rate?: number
          id?: string
          net?: number | null
          occurred_at: string
          order_id?: string | null
          scope_path: string
          season_id?: string | null
          source: Database["public"]["Enums"]["revenue_source"]
          tax?: number
        }
        Update: {
          amount?: number
          amount_base?: number | null
          city_id?: string | null
          contest_id?: string | null
          cost_center?: string
          country_id?: string
          created_at?: string
          currency?: string
          event_id?: string | null
          fx_rate?: number
          id?: string
          net?: number | null
          occurred_at?: string
          order_id?: string | null
          scope_path?: string
          season_id?: string | null
          source?: Database["public"]["Enums"]["revenue_source"]
          tax?: number
        }
        Relationships: [
          {
            foreignKeyName: "revenue_entries_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_entries_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_entries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_entries_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
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
      round_results: {
        Row: {
          advanced: boolean
          audience_score: number | null
          config_snapshot: Json
          final_score: number
          id: string
          jury_score: number | null
          participant_id: string
          rank: number | null
          resolved_at: string
          round_id: string
        }
        Insert: {
          advanced?: boolean
          audience_score?: number | null
          config_snapshot: Json
          final_score: number
          id?: string
          jury_score?: number | null
          participant_id: string
          rank?: number | null
          resolved_at?: string
          round_id: string
        }
        Update: {
          advanced?: boolean
          audience_score?: number | null
          config_snapshot?: Json
          final_score?: number
          id?: string
          jury_score?: number | null
          participant_id?: string
          rank?: number | null
          resolved_at?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_results_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_results_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          contest_id: string
          created_at: string
          ends_at: string | null
          id: string
          name: string
          order: number
          scoring_config: Json
          starts_at: string | null
          status: string
          type: Database["public"]["Enums"]["round_type"]
          updated_at: string
          vote_rules: Json
        }
        Insert: {
          contest_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          name: string
          order: number
          scoring_config?: Json
          starts_at?: string | null
          status?: string
          type?: Database["public"]["Enums"]["round_type"]
          updated_at?: string
          vote_rules?: Json
        }
        Update: {
          contest_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          name?: string
          order?: number
          scoring_config?: Json
          starts_at?: string | null
          status?: string
          type?: Database["public"]["Enums"]["round_type"]
          updated_at?: string
          vote_rules?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rounds_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      score_criteria: {
        Row: {
          contest_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          order: number
          slug: string
          weight: number
        }
        Insert: {
          contest_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order?: number
          slug: string
          weight: number
        }
        Update: {
          contest_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order?: number
          slug?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "score_criteria_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          name: string
          series_id: string
          slug: string
          starts_at: string | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          name: string
          series_id: string
          slug: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          name?: string
          series_id?: string
          slug?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "seasons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          brand: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          status?: string
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
      sponsor_campaigns: {
        Row: {
          assets: Json
          contract_id: string | null
          created_at: string
          ends_at: string | null
          id: string
          name: string
          placements: string[]
          sponsor_id: string
          starts_at: string | null
          utm: Json
        }
        Insert: {
          assets?: Json
          contract_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          name: string
          placements?: string[]
          sponsor_id: string
          starts_at?: string | null
          utm?: Json
        }
        Update: {
          assets?: Json
          contract_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          name?: string
          placements?: string[]
          sponsor_id?: string
          starts_at?: string | null
          utm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_campaigns_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "sponsor_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_campaigns_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_contracts: {
        Row: {
          contest_id: string | null
          created_at: string
          currency: string
          document_url: string | null
          ends_at: string
          exclusivity: Json
          id: string
          season_id: string | null
          sponsor_id: string
          starts_at: string
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          contest_id?: string | null
          created_at?: string
          currency?: string
          document_url?: string | null
          ends_at: string
          exclusivity?: Json
          id?: string
          season_id?: string | null
          sponsor_id: string
          starts_at: string
          status?: string
          updated_at?: string
          value: number
        }
        Update: {
          contest_id?: string | null
          created_at?: string
          currency?: string
          document_url?: string | null
          ends_at?: string
          exclusivity?: Json
          id?: string
          season_id?: string | null
          sponsor_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_contracts_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_contracts_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_contracts_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_deliverables: {
        Row: {
          contract_id: string
          created_at: string
          delivered_at: string | null
          description: string
          due_at: string | null
          evidence_url: string | null
          id: string
          inventory_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          delivered_at?: string | null
          description: string
          due_at?: string | null
          evidence_url?: string | null
          id?: string
          inventory_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          delivered_at?: string | null
          description?: string
          due_at?: string | null
          evidence_url?: string | null
          id?: string
          inventory_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_deliverables_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "sponsor_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_deliverables_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "commercial_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_metrics: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          is_estimate: boolean
          method: string | null
          metric: string
          period_end: string
          period_start: string
          unit: string | null
          value: number
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          is_estimate: boolean
          method?: string | null
          metric: string
          period_end: string
          period_start: string
          unit?: string | null
          value: number
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          is_estimate?: boolean
          method?: string | null
          metric?: string
          period_end?: string
          period_start?: string
          unit?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_metrics_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "sponsor_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          category: string | null
          city_id: string | null
          company: string
          contact_name: string | null
          country_id: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          owner_user_id: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          city_id?: string | null
          company: string
          contact_name?: string | null
          country_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          owner_user_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          city_id?: string | null
          company?: string
          contact_name?: string | null
          country_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          owner_user_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json
          processed_at: string | null
          stripe_event_id: string
          type: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          payload: Json
          processed_at?: string | null
          stripe_event_id: string
          type: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          stripe_event_id?: string
          type?: string
        }
        Relationships: []
      }
      talent_availability: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          starts_at: string
          talent_id: string
          type: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          starts_at: string
          talent_id: string
          type?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          starts_at?: string
          talent_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_availability_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      talent_contracts: {
        Row: {
          booking_id: string
          commission_pct: number
          created_at: string
          currency: string
          document_url: string | null
          fee_amount: number
          id: string
          signed_at: string | null
          status: string
          talent_id: string
          terms: Json
          updated_at: string
        }
        Insert: {
          booking_id: string
          commission_pct?: number
          created_at?: string
          currency?: string
          document_url?: string | null
          fee_amount: number
          id?: string
          signed_at?: string | null
          status?: string
          talent_id: string
          terms?: Json
          updated_at?: string
        }
        Update: {
          booking_id?: string
          commission_pct?: number
          created_at?: string
          currency?: string
          document_url?: string | null
          fee_amount?: number
          id?: string
          signed_at?: string | null
          status?: string
          talent_id?: string
          terms?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_contracts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "booking_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_contracts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      talent_profiles: {
        Row: {
          bio: string | null
          booking_contact: string | null
          comedy_styles: string[]
          created_at: string
          languages: string[]
          legal_name: string | null
          manager_id: string | null
          markets: string[]
          media_kit_url: string | null
          public_visible: boolean
          representation: string | null
          set_durations: number[]
          stage_name: string
          status: Database["public"]["Enums"]["talent_status"]
          technical_rider: string | null
          travel_availability: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          booking_contact?: string | null
          comedy_styles?: string[]
          created_at?: string
          languages?: string[]
          legal_name?: string | null
          manager_id?: string | null
          markets?: string[]
          media_kit_url?: string | null
          public_visible?: boolean
          representation?: string | null
          set_durations?: number[]
          stage_name: string
          status?: Database["public"]["Enums"]["talent_status"]
          technical_rider?: string | null
          travel_availability?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          booking_contact?: string | null
          comedy_styles?: string[]
          created_at?: string
          languages?: string[]
          legal_name?: string | null
          manager_id?: string | null
          markets?: string[]
          media_kit_url?: string | null
          public_visible?: boolean
          representation?: string | null
          set_durations?: number[]
          stage_name?: string
          status?: Database["public"]["Enums"]["talent_status"]
          technical_rider?: string | null
          travel_availability?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["talent_status"] | null
          id: string
          reason: string | null
          talent_id: string
          to_status: Database["public"]["Enums"]["talent_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["talent_status"] | null
          id?: string
          reason?: string | null
          talent_id: string
          to_status: Database["public"]["Enums"]["talent_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["talent_status"] | null
          id?: string
          reason?: string | null
          talent_id?: string
          to_status?: Database["public"]["Enums"]["talent_status"]
        }
        Relationships: [
          {
            foreignKeyName: "talent_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_status_history_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          benefits: Json
          created_at: string
          currency: string
          event_id: string
          id: string
          kind: Database["public"]["Enums"]["ticket_kind"]
          name: string
          per_user_limit: number
          price: number
          quantity: number
          sales_end: string | null
          sales_start: string | null
          status: string
        }
        Insert: {
          benefits?: Json
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          kind?: Database["public"]["Enums"]["ticket_kind"]
          name: string
          per_user_limit?: number
          price: number
          quantity: number
          sales_end?: string | null
          sales_start?: string | null
          status?: string
        }
        Update: {
          benefits?: Json
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["ticket_kind"]
          name?: string
          per_user_limit?: number
          price?: number
          quantity?: number
          sales_end?: string | null
          sales_start?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          code: string
          created_at: string
          event_id: string
          holder_name: string | null
          id: string
          issued_at: string
          order_item_id: string | null
          qr_secret: string
          qr_version: number
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          event_id: string
          holder_name?: string | null
          id?: string
          issued_at?: string
          order_item_id?: string | null
          qr_secret?: string
          qr_version?: number
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          event_id?: string
          holder_name?: string | null
          id?: string
          issued_at?: string
          order_item_id?: string | null
          qr_secret?: string
          qr_version?: number
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_type_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_case_actions: {
        Row: {
          action: string
          actor_user_id: string | null
          case_id: string
          created_at: string
          id: string
          notes: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          case_id: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          case_id?: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_case_actions_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_case_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "trust_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_cases: {
        Row: {
          appeal_of: string | null
          assignee_user_id: string | null
          created_at: string
          description: string
          id: string
          object_id: string | null
          object_type: string | null
          priority: number
          reporter_user_id: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          sla_due_at: string | null
          status: Database["public"]["Enums"]["trust_case_status"]
          type: string
          updated_at: string
        }
        Insert: {
          appeal_of?: string | null
          assignee_user_id?: string | null
          created_at?: string
          description: string
          id?: string
          object_id?: string | null
          object_type?: string | null
          priority?: number
          reporter_user_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["trust_case_status"]
          type: string
          updated_at?: string
        }
        Update: {
          appeal_of?: string | null
          assignee_user_id?: string | null
          created_at?: string
          description?: string
          id?: string
          object_id?: string | null
          object_type?: string | null
          priority?: number
          reporter_user_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["trust_case_status"]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_cases_appeal_of_fkey"
            columns: ["appeal_of"]
            isOneToOne: false
            referencedRelation: "trust_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_cases_assignee_user_id_fkey"
            columns: ["assignee_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_cases_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_cases_resolved_by_fkey"
            columns: ["resolved_by"]
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
          birth_date: string | null
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
          birth_date?: string | null
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
          birth_date?: string | null
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
      venues: {
        Row: {
          address: string | null
          capacity: number | null
          city_id: string | null
          created_at: string
          id: string
          map_url: string | null
          name: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          city_id?: string | null
          created_at?: string
          id?: string
          map_url?: string | null
          name: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          city_id?: string | null
          created_at?: string
          id?: string
          map_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      video_reviews: {
        Row: {
          comment: string | null
          created_at: string
          decision: Database["public"]["Enums"]["review_decision"]
          id: string
          reviewer_id: string | null
          timecodes: Json
          video_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          decision: Database["public"]["Enums"]["review_decision"]
          id?: string
          reviewer_id?: string | null
          timecodes?: Json
          video_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["review_decision"]
          id?: string
          reviewer_id?: string | null
          timecodes?: Json
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_reviews_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category_id: string | null
          contest_id: string
          created_at: string
          description: string | null
          duration_s: number | null
          id: string
          master_url: string | null
          published_at: string | null
          rights_status: Database["public"]["Enums"]["rights_status"]
          round_id: string | null
          status: Database["public"]["Enums"]["video_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          contest_id: string
          created_at?: string
          description?: string | null
          duration_s?: number | null
          id?: string
          master_url?: string | null
          published_at?: string | null
          rights_status?: Database["public"]["Enums"]["rights_status"]
          round_id?: string | null
          status?: Database["public"]["Enums"]["video_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          contest_id?: string
          created_at?: string
          description?: string | null
          duration_s?: number | null
          id?: string
          master_url?: string | null
          published_at?: string | null
          rights_status?: Database["public"]["Enums"]["rights_status"]
          round_id?: string | null
          status?: Database["public"]["Enums"]["video_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vote_signals: {
        Row: {
          asn: string | null
          created_at: string
          device_fp_hash: string | null
          geo: string | null
          id: string
          ip_hash: string | null
          is_datacenter: boolean | null
          referrer: string | null
          user_agent: string | null
          vote_id: string
        }
        Insert: {
          asn?: string | null
          created_at?: string
          device_fp_hash?: string | null
          geo?: string | null
          id?: string
          ip_hash?: string | null
          is_datacenter?: boolean | null
          referrer?: string | null
          user_agent?: string | null
          vote_id: string
        }
        Update: {
          asn?: string | null
          created_at?: string
          device_fp_hash?: string | null
          geo?: string | null
          id?: string
          ip_hash?: string | null
          is_datacenter?: boolean | null
          referrer?: string | null
          user_agent?: string | null
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_signals_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          idempotency_key: string | null
          invalidated_by: string | null
          invalidated_reason: string | null
          participant_id: string
          round_id: string
          status: Database["public"]["Enums"]["vote_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          invalidated_by?: string | null
          invalidated_reason?: string | null
          participant_id: string
          round_id: string
          status?: Database["public"]["Enums"]["vote_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          invalidated_by?: string | null
          invalidated_reason?: string | null
          participant_id?: string
          round_id?: string
          status?: Database["public"]["Enums"]["vote_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_invalidated_by_fkey"
            columns: ["invalidated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aplicar_acceso_fundador: { Args: { p_user_id: string }; Returns: string }
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
      hash_de_texto: { Args: { t: string }; Returns: string }
      metricas_publicas: {
        Args: never
        Returns: {
          clave: string
          valor: number
        }[]
      }
      path_de_concurso: { Args: { p_contest_id: string }; Returns: string }
      path_de_usuario: { Args: { p_user_id: string }; Returns: string }
      puede_recibir_marketing: {
        Args: {
          p_channel: Database["public"]["Enums"]["consent_channel"]
          p_contact_id: string
        }
        Returns: boolean
      }
      roles_de_mis_grants: { Args: never; Returns: string[] }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      uuid_generate_v7: { Args: never; Returns: string }
    }
    Enums: {
      assignment_status:
        | "PENDING"
        | "IN_PROGRESS"
        | "SUBMITTED"
        | "EXCUSED"
        | "CONFLICT"
      category_assignment: "AUTO" | "SELF" | "ADMIN"
      checkin_result:
        | "OK"
        | "DUPLICATE"
        | "INVALID"
        | "WRONG_EVENT"
        | "VOID"
        | "OVERRIDE"
      consent_channel: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH"
      contest_status:
        | "DRAFT"
        | "SCHEDULED"
        | "OPEN"
        | "CLOSED"
        | "JUDGING"
        | "FINISHED"
        | "CANCELLED"
      crm_entity: "CONTESTANT" | "SPONSOR" | "TALENT" | "SUPPORT"
      finance_level: "NONE" | "LOCAL" | "CITY" | "COUNTRY" | "GLOBAL"
      financial_kind: "REVENUE" | "EXPENSE"
      grant_status: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "REVOKED"
      inventory_commercial_status:
        | "AVAILABLE"
        | "HELD"
        | "SOLD"
        | "DELIVERED"
        | "RETIRED"
      legal_version_status: "DRAFT" | "EFFECTIVE" | "SUPERSEDED"
      order_status:
        | "PENDING"
        | "PAID"
        | "FULFILLING"
        | "COMPLETED"
        | "CANCELLED"
        | "REFUNDED"
      participant_status:
        | "REGISTERED"
        | "VERIFIED"
        | "SUBMITTED"
        | "ADVANCED"
        | "ELIMINATED"
        | "WITHDRAWN"
        | "DISQUALIFIED"
      payment_status:
        | "REQUIRES_ACTION"
        | "PROCESSING"
        | "SUCCEEDED"
        | "FAILED"
        | "CANCELLED"
      revenue_source:
        | "TICKETS"
        | "STORE"
        | "ACADEMY"
        | "MEMBERSHIPS"
        | "SPONSORS"
        | "BOOKINGS"
        | "EXPERIENCES"
        | "LICENSING"
        | "TOURS"
        | "OTHER"
      review_decision: "APPROVED" | "CHANGES_REQUESTED" | "REJECTED"
      rights_status:
        | "PENDING"
        | "DECLARED"
        | "REVIEW_REQUIRED"
        | "CLEARED"
        | "RESTRICTED"
        | "EXPIRED"
        | "BLOCKED"
      round_type: "SUBMISSION" | "JURY" | "AUDIENCE" | "MIXED" | "LIVE"
      scope_type:
        | "GLOBAL"
        | "COUNTRY"
        | "REGION"
        | "CITY"
        | "CONTEST"
        | "EVENT"
        | "VENUE"
      talent_status:
        | "DRAFT"
        | "PENDING_REVIEW"
        | "ACTIVE"
        | "PAUSED"
        | "RETIRED"
        | "BLOCKED"
      ticket_kind:
        | "GENERAL"
        | "VIP"
        | "PREMIUM"
        | "EARLY_BIRD"
        | "VIRTUAL"
        | "PROMO"
        | "COMP"
      ticket_status: "VALID" | "USED" | "VOID" | "TRANSFERRED"
      trust_case_status:
        | "OPEN"
        | "UNDER_REVIEW"
        | "ACTION_REQUIRED"
        | "RESOLVED"
        | "REJECTED"
        | "APPEALED"
      video_status:
        | "DRAFT"
        | "UPLOADING"
        | "UPLOADED"
        | "VALIDATING"
        | "VALIDATION_FAILED"
        | "PENDING_RIGHTS"
        | "SUBMITTED"
        | "IN_REVIEW"
        | "CHANGES_REQUESTED"
        | "REJECTED"
        | "APPROVED"
        | "DISTRIBUTING"
        | "PUBLISHED"
        | "UNPUBLISHED"
        | "BLOCKED"
      vote_status: "VALID" | "SUSPECT" | "INVALIDATED" | "PENDING_REVIEW"
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
      assignment_status: [
        "PENDING",
        "IN_PROGRESS",
        "SUBMITTED",
        "EXCUSED",
        "CONFLICT",
      ],
      category_assignment: ["AUTO", "SELF", "ADMIN"],
      checkin_result: [
        "OK",
        "DUPLICATE",
        "INVALID",
        "WRONG_EVENT",
        "VOID",
        "OVERRIDE",
      ],
      consent_channel: ["EMAIL", "SMS", "WHATSAPP", "PUSH"],
      contest_status: [
        "DRAFT",
        "SCHEDULED",
        "OPEN",
        "CLOSED",
        "JUDGING",
        "FINISHED",
        "CANCELLED",
      ],
      crm_entity: ["CONTESTANT", "SPONSOR", "TALENT", "SUPPORT"],
      finance_level: ["NONE", "LOCAL", "CITY", "COUNTRY", "GLOBAL"],
      financial_kind: ["REVENUE", "EXPENSE"],
      grant_status: ["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"],
      inventory_commercial_status: [
        "AVAILABLE",
        "HELD",
        "SOLD",
        "DELIVERED",
        "RETIRED",
      ],
      legal_version_status: ["DRAFT", "EFFECTIVE", "SUPERSEDED"],
      order_status: [
        "PENDING",
        "PAID",
        "FULFILLING",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED",
      ],
      participant_status: [
        "REGISTERED",
        "VERIFIED",
        "SUBMITTED",
        "ADVANCED",
        "ELIMINATED",
        "WITHDRAWN",
        "DISQUALIFIED",
      ],
      payment_status: [
        "REQUIRES_ACTION",
        "PROCESSING",
        "SUCCEEDED",
        "FAILED",
        "CANCELLED",
      ],
      revenue_source: [
        "TICKETS",
        "STORE",
        "ACADEMY",
        "MEMBERSHIPS",
        "SPONSORS",
        "BOOKINGS",
        "EXPERIENCES",
        "LICENSING",
        "TOURS",
        "OTHER",
      ],
      review_decision: ["APPROVED", "CHANGES_REQUESTED", "REJECTED"],
      rights_status: [
        "PENDING",
        "DECLARED",
        "REVIEW_REQUIRED",
        "CLEARED",
        "RESTRICTED",
        "EXPIRED",
        "BLOCKED",
      ],
      round_type: ["SUBMISSION", "JURY", "AUDIENCE", "MIXED", "LIVE"],
      scope_type: [
        "GLOBAL",
        "COUNTRY",
        "REGION",
        "CITY",
        "CONTEST",
        "EVENT",
        "VENUE",
      ],
      talent_status: [
        "DRAFT",
        "PENDING_REVIEW",
        "ACTIVE",
        "PAUSED",
        "RETIRED",
        "BLOCKED",
      ],
      ticket_kind: [
        "GENERAL",
        "VIP",
        "PREMIUM",
        "EARLY_BIRD",
        "VIRTUAL",
        "PROMO",
        "COMP",
      ],
      ticket_status: ["VALID", "USED", "VOID", "TRANSFERRED"],
      trust_case_status: [
        "OPEN",
        "UNDER_REVIEW",
        "ACTION_REQUIRED",
        "RESOLVED",
        "REJECTED",
        "APPEALED",
      ],
      video_status: [
        "DRAFT",
        "UPLOADING",
        "UPLOADED",
        "VALIDATING",
        "VALIDATION_FAILED",
        "PENDING_RIGHTS",
        "SUBMITTED",
        "IN_REVIEW",
        "CHANGES_REQUESTED",
        "REJECTED",
        "APPROVED",
        "DISTRIBUTING",
        "PUBLISHED",
        "UNPUBLISHED",
        "BLOCKED",
      ],
      vote_status: ["VALID", "SUSPECT", "INVALIDATED", "PENDING_REVIEW"],
    },
  },
} as const
