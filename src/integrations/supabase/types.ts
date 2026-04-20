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
    }
    Enums: {
      app_role: "ceo" | "executive" | "manager" | "member"
      deal_status: "open" | "won" | "lost"
      insight_type: "cfo" | "copilot" | "alert" | "recommendation"
      kr_status: "not_started" | "in_progress" | "completed" | "blocked"
      objective_level: "company" | "department" | "individual"
      objective_status:
        | "on_track"
        | "at_risk"
        | "off_track"
        | "completed"
        | "archived"
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
      insight_type: ["cfo", "copilot", "alert", "recommendation"],
      kr_status: ["not_started", "in_progress", "completed", "blocked"],
      objective_level: ["company", "department", "individual"],
      objective_status: [
        "on_track",
        "at_risk",
        "off_track",
        "completed",
        "archived",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "blocked", "done"],
      tree_type: ["value", "profit", "kpi"],
    },
  },
} as const
