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
      grant_status: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "REVOKED"
      participant_status:
        | "REGISTERED"
        | "VERIFIED"
        | "SUBMITTED"
        | "ADVANCED"
        | "ELIMINATED"
        | "WITHDRAWN"
        | "DISQUALIFIED"
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
      grant_status: ["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"],
      participant_status: [
        "REGISTERED",
        "VERIFIED",
        "SUBMITTED",
        "ADVANCED",
        "ELIMINATED",
        "WITHDRAWN",
        "DISQUALIFIED",
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
