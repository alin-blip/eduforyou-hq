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
  public: {
    Tables: {
      ai_insights: {
        Row: {
          content: string
          entity_id: string | null
          generated_at: string
          generated_for: string | null
          id: string
          metadata: Json | null
          severity: string | null
          title: string
          type: Database["public"]["Enums"]["insight_type"]
        }
        Insert: {
          content: string
          entity_id?: string | null
          generated_at?: string
          generated_for?: string | null
          id?: string
          metadata?: Json | null
          severity?: string | null
          title: string
          type?: Database["public"]["Enums"]["insight_type"]
        }
        Update: {
          content?: string
          entity_id?: string | null
          generated_at?: string
          generated_for?: string | null
          id?: string
          metadata?: Json | null
          severity?: string | null
          title?: string
          type?: Database["public"]["Enums"]["insight_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmarks: {
        Row: {
          created_at: string
          id: string
          industry: string
          metric: string
          notes: string | null
          source: string | null
          unit: string | null
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string
          metric: string
          notes?: string | null
          source?: string | null
          unit?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string
          metric?: string
          notes?: string | null
          source?: string | null
          unit?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      deals: {
        Row: {
          company_name: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          currency: string
          entity_id: string | null
          expected_close: string | null
          id: string
          notes: string | null
          owner_id: string | null
          source: string | null
          stage_id: string | null
          status: Database["public"]["Enums"]["deal_status"]
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          entity_id?: string | null
          expected_close?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          source?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          entity_id?: string | null
          expected_close?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          source?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      debits: {
        Row: {
          created_at: string
          created_by: string | null
          creditor: string
          currency: string
          end_on: string | null
          entity_id: string | null
          id: string
          interest_rate: number | null
          monthly_payment: number
          next_payment_on: string | null
          notes: string | null
          principal: number
          remaining: number
          start_on: string
          status: Database["public"]["Enums"]["debit_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          creditor: string
          currency?: string
          end_on?: string | null
          entity_id?: string | null
          id?: string
          interest_rate?: number | null
          monthly_payment?: number
          next_payment_on?: string | null
          notes?: string | null
          principal?: number
          remaining?: number
          start_on?: string
          status?: Database["public"]["Enums"]["debit_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          creditor?: string
          currency?: string
          end_on?: string | null
          entity_id?: string | null
          id?: string
          interest_rate?: number | null
          monthly_payment?: number
          next_payment_on?: string | null
          notes?: string | null
          principal?: number
          remaining?: number
          start_on?: string
          status?: Database["public"]["Enums"]["debit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debits_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          budget_monthly: number | null
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          manager_id: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          budget_monthly?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          manager_id?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          budget_monthly?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          currency: string
          department_id: string | null
          description: string | null
          entity_id: string | null
          id: string
          is_recurring: boolean
          occurred_on: string
          status: Database["public"]["Enums"]["expense_status"]
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: string
          department_id?: string | null
          description?: string | null
          entity_id?: string | null
          id?: string
          is_recurring?: boolean
          occurred_on?: string
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: string
          department_id?: string | null
          description?: string | null
          entity_id?: string | null
          id?: string
          is_recurring?: boolean
          occurred_on?: string
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          counterparty: string
          created_at: string
          created_by: string | null
          currency: string
          due_on: string | null
          entity_id: string | null
          id: string
          issued_on: string
          kind: Database["public"]["Enums"]["invoice_kind"]
          notes: string | null
          number: string | null
          paid_on: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          counterparty: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_on?: string | null
          entity_id?: string | null
          id?: string
          issued_on?: string
          kind?: Database["public"]["Enums"]["invoice_kind"]
          notes?: string | null
          number?: string | null
          paid_on?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          counterparty?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_on?: string | null
          entity_id?: string | null
          id?: string
          issued_on?: string
          kind?: Database["public"]["Enums"]["invoice_kind"]
          notes?: string | null
          number?: string | null
          paid_on?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          created_at: string
          current_value: number | null
          due_date: string | null
          id: string
          metric_unit: string | null
          objective_id: string
          owner_id: string | null
          start_value: number | null
          status: Database["public"]["Enums"]["kr_status"]
          target_value: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          due_date?: string | null
          id?: string
          metric_unit?: string | null
          objective_id: string
          owner_id?: string | null
          start_value?: number | null
          status?: Database["public"]["Enums"]["kr_status"]
          target_value: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          due_date?: string | null
          id?: string
          metric_unit?: string | null
          objective_id?: string
          owner_id?: string | null
          start_value?: number | null
          status?: Database["public"]["Enums"]["kr_status"]
          target_value?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_items: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          key_result_id: string | null
          kind: Database["public"]["Enums"]["meeting_item_kind"]
          meeting_id: string
          objective_id: string | null
          owner_id: string | null
          position: number
          status: Database["public"]["Enums"]["meeting_item_status"]
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          key_result_id?: string | null
          kind?: Database["public"]["Enums"]["meeting_item_kind"]
          meeting_id: string
          objective_id?: string | null
          owner_id?: string | null
          position?: number
          status?: Database["public"]["Enums"]["meeting_item_status"]
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          key_result_id?: string | null
          kind?: Database["public"]["Enums"]["meeting_item_kind"]
          meeting_id?: string
          objective_id?: string | null
          owner_id?: string | null
          position?: number
          status?: Database["public"]["Enums"]["meeting_item_status"]
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_items_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_items_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          notes: string | null
          status: Database["public"]["Enums"]["participant_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: string | null
          cadence: Database["public"]["Enums"]["meeting_cadence"]
          created_at: string
          created_by: string | null
          decisions: string | null
          department_id: string | null
          duration_minutes: number
          entity_id: string | null
          facilitator_id: string | null
          id: string
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          cadence?: Database["public"]["Enums"]["meeting_cadence"]
          created_at?: string
          created_by?: string | null
          decisions?: string | null
          department_id?: string | null
          duration_minutes?: number
          entity_id?: string | null
          facilitator_id?: string | null
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          cadence?: Database["public"]["Enums"]["meeting_cadence"]
          created_at?: string
          created_by?: string | null
          decisions?: string | null
          department_id?: string | null
          duration_minutes?: number
          entity_id?: string | null
          facilitator_id?: string | null
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      objectives: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          due_date: string | null
          id: string
          level: Database["public"]["Enums"]["objective_level"]
          owner_id: string | null
          parent_id: string | null
          progress: number
          quarter: string
          start_date: string | null
          status: Database["public"]["Enums"]["objective_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          level?: Database["public"]["Enums"]["objective_level"]
          owner_id?: string | null
          parent_id?: string | null
          progress?: number
          quarter: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["objective_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          level?: Database["public"]["Enums"]["objective_level"]
          owner_id?: string | null
          parent_id?: string | null
          progress?: number
          quarter?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["objective_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objectives_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string
          entity_id: string | null
          id: string
          is_lost: boolean
          is_won: boolean
          name: string
          position: number
          probability: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          is_lost?: boolean
          is_won?: boolean
          name: string
          position?: number
          probability?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          is_lost?: boolean
          is_won?: boolean
          name?: string
          position?: number
          probability?: number
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: string | null
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          monthly_cost: number | null
          phone: string | null
          updated_at: string
          weekly_capacity_hours: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          monthly_cost?: number | null
          phone?: string | null
          updated_at?: string
          weekly_capacity_hours?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          monthly_cost?: number | null
          phone?: string | null
          updated_at?: string
          weekly_capacity_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      project_metrics: {
        Row: {
          delta_pct: number | null
          id: string
          label: string
          metric_key: string
          position: number
          project_id: string
          recorded_at: string
          trend: string | null
          unit: string | null
          updated_at: string
          value: number
        }
        Insert: {
          delta_pct?: number | null
          id?: string
          label: string
          metric_key: string
          position?: number
          project_id: string
          recorded_at?: string
          trend?: string | null
          unit?: string | null
          updated_at?: string
          value?: number
        }
        Update: {
          delta_pct?: number | null
          id?: string
          label?: string
          metric_key?: string
          position?: number
          project_id?: string
          recorded_at?: string
          trend?: string | null
          unit?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sync_log: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          metrics_synced: number
          source: string
          success: boolean
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metrics_synced?: number
          source?: string
          success?: boolean
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metrics_synced?: number
          source?: string
          success?: boolean
          triggered_by?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          edit_url: string | null
          entity_id: string | null
          icon: string | null
          id: string
          name: string
          owner_id: string | null
          position: number
          public_url: string | null
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          edit_url?: string | null
          entity_id?: string | null
          icon?: string | null
          id?: string
          name: string
          owner_id?: string | null
          position?: number
          public_url?: string | null
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          edit_url?: string | null
          entity_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          position?: number
          public_url?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          entity_id: string | null
          id: string
          notes: string | null
          occurred_on: string
          source: string | null
          status: Database["public"]["Enums"]["revenue_status"]
          stream: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          entity_id?: string | null
          id?: string
          notes?: string | null
          occurred_on?: string
          source?: string | null
          status?: Database["public"]["Enums"]["revenue_status"]
          stream: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          entity_id?: string | null
          id?: string
          notes?: string | null
          occurred_on?: string
          source?: string | null
          status?: Database["public"]["Enums"]["revenue_status"]
          stream?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_trees: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          description: string | null
          entity_id: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["tree_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          description?: string | null
          entity_id?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["tree_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          description?: string | null
          entity_id?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["tree_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_trees_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          department_id: string | null
          description: string | null
          due_date: string | null
          entity_id: string | null
          estimated_hours: number | null
          id: string
          key_result_id: string | null
          logged_hours: number | null
          objective_id: string | null
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          reporter_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          estimated_hours?: number | null
          id?: string
          key_result_id?: string | null
          logged_hours?: number | null
          objective_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          reporter_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          estimated_hours?: number | null
          id?: string
          key_result_id?: string | null
          logged_hours?: number | null
          objective_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          reporter_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vision: {
        Row: {
          bhag: string | null
          brand_promise: string | null
          core_values: Json | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          id: string
          milestones: Json | null
          mission: string | null
          story: string | null
          target_year: number | null
          updated_at: string
        }
        Insert: {
          bhag?: string | null
          brand_promise?: string | null
          core_values?: Json | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          id?: string
          milestones?: Json | null
          mission?: string | null
          story?: string | null
          target_year?: number | null
          updated_at?: string
        }
        Update: {
          bhag?: string | null
          brand_promise?: string | null
          core_values?: Json | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          id?: string
          milestones?: Json | null
          mission?: string | null
          story?: string | null
          target_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vision_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_department_performance: { Args: { _months?: number }; Returns: Json }
      get_departments_directory: {
        Args: never
        Returns: {
          color: string
          description: string
          icon: string
          id: string
          manager_id: string
          name: string
          slug: string
        }[]
      }
      get_finance_snapshot: { Args: { _months?: number }; Returns: Json }
      get_team_directory: {
        Args: never
        Returns: {
          avatar_url: string
          department_id: string
          full_name: string
          id: string
          job_title: string
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      sync_project_metrics: { Args: never; Returns: Json }
      sync_project_metrics_internal: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "ceo" | "executive" | "manager" | "member"
      deal_status: "open" | "won" | "lost"
      debit_status: "active" | "paid_off" | "defaulted"
      expense_category:
        | "salaries"
        | "ads_meta"
        | "ads_google"
        | "ads_other"
        | "software"
        | "rent"
        | "utilities"
        | "contractors"
        | "travel"
        | "marketing"
        | "other"
      expense_status: "planned" | "committed" | "paid"
      insight_type: "cfo" | "copilot" | "alert" | "recommendation"
      invoice_kind: "outgoing" | "incoming"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      kr_status: "not_started" | "in_progress" | "completed" | "blocked"
      meeting_cadence: "daily" | "weekly" | "monthly" | "quarterly"
      meeting_item_kind: "agenda" | "decision" | "action" | "blocker" | "note"
      meeting_item_status: "open" | "in_progress" | "done" | "cancelled"
      meeting_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      objective_level: "company" | "department" | "individual"
      objective_status:
        | "on_track"
        | "at_risk"
        | "off_track"
        | "completed"
        | "archived"
      participant_status: "invited" | "confirmed" | "attended" | "missed"
      project_status: "draft" | "live" | "paused" | "archived"
      revenue_status: "planned" | "confirmed" | "received"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "blocked" | "done"
      tree_type: "value" | "profit" | "kpi"
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
      app_role: ["ceo", "executive", "manager", "member"],
      deal_status: ["open", "won", "lost"],
      debit_status: ["active", "paid_off", "defaulted"],
      expense_category: [
        "salaries",
        "ads_meta",
        "ads_google",
        "ads_other",
        "software",
        "rent",
        "utilities",
        "contractors",
        "travel",
        "marketing",
        "other",
      ],
      expense_status: ["planned", "committed", "paid"],
      insight_type: ["cfo", "copilot", "alert", "recommendation"],
      invoice_kind: ["outgoing", "incoming"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      kr_status: ["not_started", "in_progress", "completed", "blocked"],
      meeting_cadence: ["daily", "weekly", "monthly", "quarterly"],
      meeting_item_kind: ["agenda", "decision", "action", "blocker", "note"],
      meeting_item_status: ["open", "in_progress", "done", "cancelled"],
      meeting_status: ["scheduled", "in_progress", "completed", "cancelled"],
      objective_level: ["company", "department", "individual"],
      objective_status: [
        "on_track",
        "at_risk",
        "off_track",
        "completed",
        "archived",
      ],
      participant_status: ["invited", "confirmed", "attended", "missed"],
      project_status: ["draft", "live", "paused", "archived"],
      revenue_status: ["planned", "confirmed", "received"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "blocked", "done"],
      tree_type: ["value", "profit", "kpi"],
    },
  },
} as const
