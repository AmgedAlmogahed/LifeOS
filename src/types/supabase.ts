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
      agent_reports: {
        Row: {
          body: string
          client_id: string | null
          created_at: string
          id: string
          is_resolved: boolean
          project_id: string | null
          report_type: string
          resolved_at: string | null
          severity: string
          title: string
        }
        Insert: {
          body?: string
          client_id?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean
          project_id?: string | null
          report_type?: string
          resolved_at?: string | null
          severity?: string
          title: string
        }
        Update: {
          body?: string
          client_id?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean
          project_id?: string | null
          report_type?: string
          resolved_at?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          level: Database["public"]["Enums"]["audit_level"]
          message: string
          project_id: string | null
          source: string
          timestamp: string
        }
        Insert: {
          id?: string
          level?: Database["public"]["Enums"]["audit_level"]
          message: string
          project_id?: string | null
          source?: string
          timestamp?: string
        }
        Update: {
          id?: string
          level?: Database["public"]["Enums"]["audit_level"]
          message?: string
          project_id?: string | null
          source?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          brand_accent: string | null
          brand_assets_url: string | null
          brand_primary: string | null
          brand_secondary: string | null
          created_at: string
          email: string | null
          health_score: number
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          brand_accent?: string | null
          brand_assets_url?: string | null
          brand_primary?: string | null
          brand_secondary?: string | null
          created_at?: string
          email?: string | null
          health_score?: number
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          brand_accent?: string | null
          brand_assets_url?: string | null
          brand_primary?: string | null
          brand_secondary?: string | null
          created_at?: string
          email?: string | null
          health_score?: number
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      communication_logs: {
        Row: {
          channel: Database["public"]["Enums"]["comm_channel"]
          client_id: string
          id: string
          sentiment_score: number | null
          summary: string
          timestamp: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["comm_channel"]
          client_id: string
          id?: string
          sentiment_score?: number | null
          summary: string
          timestamp?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["comm_channel"]
          client_id?: string
          id?: string
          sentiment_score?: number | null
          summary?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_amendments: {
        Row: {
          changes_json: Json | null
          contract_id: string
          created_at: string
          effective_date: string | null
          id: string
          status: Database["public"]["Enums"]["contract_amendment_status"]
          summary: string
        }
        Insert: {
          changes_json?: Json | null
          contract_id: string
          created_at?: string
          effective_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["contract_amendment_status"]
          summary: string
        }
        Update: {
          changes_json?: Json | null
          contract_id?: string
          created_at?: string
          effective_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["contract_amendment_status"]
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_amendments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string
          created_at: string
          end_date: string | null
          id: string
          opportunity_id: string | null
          pdf_url: string | null
          price_offer_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          terms_md: string | null
          title: string
          total_value: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          opportunity_id?: string | null
          pdf_url?: string | null
          price_offer_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          terms_md?: string | null
          title?: string
          total_value?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          opportunity_id?: string | null
          pdf_url?: string | null
          price_offer_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          terms_md?: string | null
          title?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_price_offer_id_fkey"
            columns: ["price_offer_id"]
            isOneToOne: false
            referencedRelation: "price_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          ai_recommendation_text: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          plan_date: string
          plan_notes: string | null
          reflection_notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_recommendation_text?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          plan_date: string
          plan_notes?: string | null
          reflection_notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_recommendation_text?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          plan_date?: string
          plan_notes?: string | null
          reflection_notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deployments: {
        Row: {
          client_id: string | null
          created_at: string
          environment: Database["public"]["Enums"]["deploy_env"]
          id: string
          label: string
          last_checked_at: string | null
          metadata: Json | null
          project_id: string
          status: string
          url: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          environment?: Database["public"]["Enums"]["deploy_env"]
          id?: string
          label?: string
          last_checked_at?: string | null
          metadata?: Json | null
          project_id: string
          status?: string
          url?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          environment?: Database["public"]["Enums"]["deploy_env"]
          id?: string
          label?: string
          last_checked_at?: string | null
          metadata?: Json | null
          project_id?: string
          status?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deployments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          project_id: string
          session_notes: string | null
          started_at: string
          tasks_completed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          project_id: string
          session_notes?: string | null
          started_at: string
          tasks_completed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          project_id?: string
          session_notes?: string | null
          started_at?: string
          tasks_completed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_rules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          pattern: string
          severity: Database["public"]["Enums"]["audit_level"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          pattern: string
          severity?: Database["public"]["Enums"]["audit_level"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pattern?: string
          severity?: Database["public"]["Enums"]["audit_level"]
          updated_at?: string
        }
        Relationships: []
      }
      health_snapshots: {
        Row: {
          components: Json | null
          created_at: string
          dimension: string
          id: string
          score: number
          snapshot_date: string
          user_id: string
        }
        Insert: {
          components?: Json | null
          created_at?: string
          dimension: string
          id?: string
          score: number
          snapshot_date: string
          user_id: string
        }
        Update: {
          components?: Json | null
          created_at?: string
          dimension?: string
          id?: string
          score?: number
          snapshot_date?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          due_date: string | null
          id: string
          pdf_url: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          client_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          pdf_url?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          pdf_url?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leverage_logs: {
        Row: {
          description: string
          hours_saved: number
          id: string
          project_id: string | null
          task_id: string | null
          timestamp: string
        }
        Insert: {
          description: string
          hours_saved?: number
          id?: string
          project_id?: string | null
          task_id?: string | null
          timestamp?: string
        }
        Update: {
          description?: string
          hours_saved?: number
          id?: string
          project_id?: string | null
          task_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "leverage_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leverage_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      lifecycles: {
        Row: {
          completed_at: string | null
          created_at: string
          current_stage: Database["public"]["Enums"]["lifecycle_stage"]
          id: string
          project_id: string
          stage_history: Json
          started_at: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_stage?: Database["public"]["Enums"]["lifecycle_stage"]
          id?: string
          project_id: string
          stage_history?: Json
          started_at?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_stage?: Database["public"]["Enums"]["lifecycle_stage"]
          id?: string
          project_id?: string
          stage_history?: Json
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifecycles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          created_at: string
          date: string
          expectations_md: string | null
          id: string
          outcomes_md: string | null
          project_id: string | null
          summary_md: string | null
          title: string
        }
        Insert: {
          created_at?: string
          date?: string
          expectations_md?: string | null
          id?: string
          outcomes_md?: string | null
          project_id?: string | null
          summary_md?: string | null
          title: string
        }
        Update: {
          created_at?: string
          date?: string
          expectations_md?: string | null
          id?: string
          outcomes_md?: string | null
          project_id?: string | null
          summary_md?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          estimated_value: number
          expected_close: string | null
          id: string
          lost_reason: string | null
          probability: number
          service_type: Database["public"]["Enums"]["service_type"]
          stage: Database["public"]["Enums"]["opportunity_stage"]
          title: string
          updated_at: string
          won_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          estimated_value?: number
          expected_close?: string | null
          id?: string
          lost_reason?: string | null
          probability?: number
          service_type?: Database["public"]["Enums"]["service_type"]
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          title: string
          updated_at?: string
          won_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          estimated_value?: number
          expected_close?: string | null
          id?: string
          lost_reason?: string | null
          probability?: number
          service_type?: Database["public"]["Enums"]["service_type"]
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          title?: string
          updated_at?: string
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          timestamp: string
          transaction_ref: string | null
        }
        Insert: {
          amount?: number
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          timestamp?: string
          transaction_ref?: string | null
        }
        Update: {
          amount?: number
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          timestamp?: string
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      price_offers: {
        Row: {
          client_id: string
          created_at: string
          id: string
          items: Json
          notes: string | null
          opportunity_id: string | null
          status: Database["public"]["Enums"]["offer_status"]
          title: string
          total_value: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          opportunity_id?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          title?: string
          total_value?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          opportunity_id?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          title?: string
          total_value?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_offers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_offers_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      project_assets: {
        Row: {
          asset_type: string
          created_at: string
          id: string
          label: string
          project_id: string
          url: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          id?: string
          label: string
          project_id: string
          url: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          id?: string
          label?: string
          project_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: Database["public"]["Enums"]["project_category"] | null
          client_id: string | null
          contract_id: string | null
          created_at: string
          description: string | null
          id: string
          is_frozen: boolean
          last_audit_at: string | null
          name: string
          progress: number
          service_type: Database["public"]["Enums"]["service_type"] | null
          specs_md: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["project_category"] | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_frozen?: boolean
          last_audit_at?: string | null
          name: string
          progress?: number
          service_type?: Database["public"]["Enums"]["service_type"] | null
          specs_md?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["project_category"] | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_frozen?: boolean
          last_audit_at?: string | null
          name?: string
          progress?: number
          service_type?: Database["public"]["Enums"]["service_type"] | null
          specs_md?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_captures: {
        Row: {
          created_at: string
          created_task_id: string | null
          id: string
          processed_at: string | null
          raw_text: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_task_id?: string | null
          id?: string
          processed_at?: string | null
          raw_text: string
          source?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_task_id?: string | null
          id?: string
          processed_at?: string | null
          raw_text?: string
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_captures_created_task_id_fkey"
            columns: ["created_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          base_price: number
          complexity_multiplier: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          service_type: Database["public"]["Enums"]["service_type"]
          unit: string
        }
        Insert: {
          base_price?: number
          complexity_multiplier?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          service_type?: Database["public"]["Enums"]["service_type"]
          unit?: string
        }
        Update: {
          base_price?: number
          complexity_multiplier?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          unit?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      tasks: {
        Row: {
          agent_context: Json | null
          category: Database["public"]["Enums"]["task_category"] | null
          committed_date: string | null
          completed_at: string | null
          created_at: string
          delegated_to: string | null
          delegation_notes: string | null
          delegation_status: string | null
          due_date: string | null
          id: string
          is_recurring: boolean | null
          metadata: Json | null
          migrated_from: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          recurrence_rule: string | null
          reminder_sent: boolean | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
        }
        Insert: {
          agent_context?: Json | null
          category?: Database["public"]["Enums"]["task_category"] | null
          committed_date?: string | null
          completed_at?: string | null
          created_at?: string
          delegated_to?: string | null
          delegation_notes?: string | null
          delegation_status?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          migrated_from?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          recurrence_rule?: string | null
          reminder_sent?: boolean | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Update: {
          agent_context?: Json | null
          category?: Database["public"]["Enums"]["task_category"] | null
          committed_date?: string | null
          completed_at?: string | null
          created_at?: string
          delegated_to?: string | null
          delegation_notes?: string | null
          delegation_status?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          migrated_from?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          recurrence_rule?: string | null
          reminder_sent?: boolean | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_migrated_from_fkey"
            columns: ["migrated_from"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_secrets: {
        Row: {
          created_at: string
          description: string | null
          encrypted_value: string
          id: string
          last_rotated_at: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          encrypted_value: string
          id?: string
          last_rotated_at?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          encrypted_value?: string
          id?: string
          last_rotated_at?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      amendment_status: "Draft" | "Signed"
      audit_level: "Critical" | "Warning" | "Info"
      comm_channel: "WhatsApp" | "Email" | "Call" | "Meeting"
      contract_amendment_status: "Draft" | "Signed"
      contract_status:
        | "Draft"
        | "Pending Signature"
        | "Active"
        | "Completed"
        | "Terminated"
      deploy_env: "Vercel" | "Railway" | "Alibaba" | "AWS" | "Other"
      invoice_status: "Pending" | "Paid" | "Overdue" | "Cancelled"
      lifecycle_stage:
        | "Requirements"
        | "Building"
        | "Testing"
        | "Deploying"
        | "Maintenance"
      offer_status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired"
      opportunity_stage:
        | "Draft"
        | "Price Offer Sent"
        | "Negotiating"
        | "Won"
        | "Lost"
      payment_method: "Transfer" | "Card" | "Cash"
      project_category: "Business" | "Personal" | "Social" | "Research"
      project_status:
        | "Backlog"
        | "Understand"
        | "Document"
        | "Freeze"
        | "Implement"
        | "Verify"
      service_type: "Cloud" | "Web" | "Design" | "Marketing"
      task_category: "Business" | "Personal" | "Social" | "Research" | "Habit"
      task_priority: "Critical" | "High" | "Medium" | "Low"
      task_status: "Todo" | "In Progress" | "Done" | "Blocked"
      task_type: "Architectural" | "Implementation" | "Audit" | "Maintenance"
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
      amendment_status: ["Draft", "Signed"],
      audit_level: ["Critical", "Warning", "Info"],
      comm_channel: ["WhatsApp", "Email", "Call", "Meeting"],
      contract_amendment_status: ["Draft", "Signed"],
      contract_status: [
        "Draft",
        "Pending Signature",
        "Active",
        "Completed",
        "Terminated",
      ],
      deploy_env: ["Vercel", "Railway", "Alibaba", "AWS", "Other"],
      invoice_status: ["Pending", "Paid", "Overdue", "Cancelled"],
      lifecycle_stage: [
        "Requirements",
        "Building",
        "Testing",
        "Deploying",
        "Maintenance",
      ],
      offer_status: ["Draft", "Sent", "Accepted", "Rejected", "Expired"],
      opportunity_stage: [
        "Draft",
        "Price Offer Sent",
        "Negotiating",
        "Won",
        "Lost",
      ],
      payment_method: ["Transfer", "Card", "Cash"],
      project_category: ["Business", "Personal", "Social", "Research"],
      project_status: [
        "Backlog",
        "Understand",
        "Document",
        "Freeze",
        "Implement",
        "Verify",
      ],
      service_type: ["Cloud", "Web", "Design", "Marketing"],
      task_category: ["Business", "Personal", "Social", "Research", "Habit"],
      task_priority: ["Critical", "High", "Medium", "Low"],
      task_status: ["Todo", "In Progress", "Done", "Blocked"],
      task_type: ["Architectural", "Implementation", "Audit", "Maintenance"],
    },
  },
} as const

