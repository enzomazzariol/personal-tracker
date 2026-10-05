export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      areas: {
        Row: {
          color: string
          id: string
          kind: string | null
          name: string
          sort: number
          user_id: string
        }
        Insert: {
          color?: string
          id: string
          kind?: string | null
          name: string
          sort?: number
          user_id?: string
        }
        Update: {
          color?: string
          id?: string
          kind?: string | null
          name?: string
          sort?: number
          user_id?: string
        }
        Relationships: []
      }
      block_tasks: {
        Row: {
          block_id: string
          done: boolean
          id: string
          sort: number
          title: string
          user_id: string
        }
        Insert: {
          block_id: string
          done?: boolean
          id?: string
          sort?: number
          title: string
          user_id?: string
        }
        Update: {
          block_id?: string
          done?: boolean
          id?: string
          sort?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_tasks_block_id_user_id_fkey"
            columns: ["block_id", "user_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      blocks: {
        Row: {
          actual_minutes: number
          area_id: string
          date: string
          end_time: string
          id: string
          project_id: string | null
          start_time: string
          started_at: string | null
          status: string
          tag: string
          title: string
          user_id: string
          why: string
        }
        Insert: {
          actual_minutes?: number
          area_id: string
          date: string
          end_time: string
          id?: string
          project_id?: string | null
          start_time: string
          started_at?: string | null
          status?: string
          tag?: string
          title: string
          user_id?: string
          why?: string
        }
        Update: {
          actual_minutes?: number
          area_id?: string
          date?: string
          end_time?: string
          id?: string
          project_id?: string | null
          start_time?: string
          started_at?: string | null
          status?: string
          tag?: string
          title?: string
          user_id?: string
          why?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_project_id_user_id_fkey"
            columns: ["project_id", "user_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "blocks_project_id_user_id_fkey"
            columns: ["project_id", "user_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "blocks_user_id_area_id_fkey"
            columns: ["user_id", "area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          created_at: string
          finished_on: string | null
          id: string
          notes: string
          pages: number | null
          started_on: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          author?: string
          created_at?: string
          finished_on?: string | null
          id?: string
          notes?: string
          pages?: number | null
          started_on?: string | null
          status?: string
          title: string
          user_id?: string
        }
        Update: {
          author?: string
          created_at?: string
          finished_on?: string | null
          id?: string
          notes?: string
          pages?: number | null
          started_on?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_milestones: {
        Row: {
          done: boolean
          done_at: string | null
          goal_id: string
          id: string
          sort: number
          title: string
          user_id: string
        }
        Insert: {
          done?: boolean
          done_at?: string | null
          goal_id: string
          id?: string
          sort?: number
          title: string
          user_id?: string
        }
        Update: {
          done?: boolean
          done_at?: string | null
          goal_id?: string
          id?: string
          sort?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_user_id_fkey"
            columns: ["goal_id", "user_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          period: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          period: string
          status?: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          period?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applied_on: string | null
          company: string
          created_at: string
          follow_up_on: string | null
          id: string
          notes: string
          role: string
          status: string
          url: string
          user_id: string
        }
        Insert: {
          applied_on?: string | null
          company: string
          created_at?: string
          follow_up_on?: string | null
          id?: string
          notes?: string
          role?: string
          status?: string
          url?: string
          user_id?: string
        }
        Update: {
          applied_on?: string | null
          company?: string
          created_at?: string
          follow_up_on?: string | null
          id?: string
          notes?: string
          role?: string
          status?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      journal: {
        Row: {
          body: string
          date: string
          mood: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          date: string
          mood?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string
          date?: string
          mood?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          body: string
          created_at: string
          id: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          area_id: string | null
          client: string
          created_at: string
          due_date: string | null
          id: string
          name: string
          status: string
          user_id: string
        }
        Insert: {
          area_id?: string | null
          client?: string
          created_at?: string
          due_date?: string | null
          id?: string
          name: string
          status?: string
          user_id?: string
        }
        Update: {
          area_id?: string | null
          client?: string
          created_at?: string
          due_date?: string | null
          id?: string
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_area_id_fkey"
            columns: ["user_id", "area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      reading_log: {
        Row: {
          book_id: string
          created_at: string
          date: string
          id: string
          pages: number
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          date?: string
          id?: string
          pages: number
          user_id?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          date?: string
          id?: string
          pages?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_log_book_id_user_id_fkey"
            columns: ["book_id", "user_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          done: boolean
          id: string
          remind_at: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          remind_at: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          remind_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      study_topics: {
        Row: {
          id: string
          mastered_at: string | null
          sort: number
          status: string
          title: string
          track_id: string
          user_id: string
        }
        Insert: {
          id?: string
          mastered_at?: string | null
          sort?: number
          status?: string
          title: string
          track_id: string
          user_id?: string
        }
        Update: {
          id?: string
          mastered_at?: string | null
          sort?: number
          status?: string
          title?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_topics_track_id_user_id_fkey"
            columns: ["track_id", "user_id"]
            isOneToOne: false
            referencedRelation: "study_tracks"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      study_tracks: {
        Row: {
          created_at: string
          id: string
          name: string
          sort: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort?: number
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          area_id: string | null
          created_at: string
          done: boolean
          done_at: string | null
          due_date: string | null
          id: string
          kind: string
          project_id: string | null
          repeat: string | null
          repeat_from: string | null
          title: string
          user_id: string
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          done?: boolean
          done_at?: string | null
          due_date?: string | null
          id?: string
          kind?: string
          project_id?: string | null
          repeat?: string | null
          repeat_from?: string | null
          title: string
          user_id?: string
        }
        Update: {
          area_id?: string | null
          created_at?: string
          done?: boolean
          done_at?: string | null
          due_date?: string | null
          id?: string
          kind?: string
          project_id?: string | null
          repeat?: string | null
          repeat_from?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_user_id_fkey"
            columns: ["project_id", "user_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "tasks_project_id_user_id_fkey"
            columns: ["project_id", "user_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "tasks_repeat_from_user_id_fkey"
            columns: ["repeat_from", "user_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "tasks_user_id_area_id_fkey"
            columns: ["user_id", "area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      weeks: {
        Row: {
          goal: string
          number: number
          review_notes: string
          reviewed_at: string | null
          start_date: string
          user_id: string
          wins: string[]
        }
        Insert: {
          goal?: string
          number: number
          review_notes?: string
          reviewed_at?: string | null
          start_date: string
          user_id?: string
          wins?: string[]
        }
        Update: {
          goal?: string
          number?: number
          review_notes?: string
          reviewed_at?: string | null
          start_date?: string
          user_id?: string
          wins?: string[]
        }
        Relationships: []
      }
    }
    Views: {
      project_summary: {
        Row: {
          area_id: string | null
          client: string | null
          created_at: string | null
          due_date: string | null
          id: string | null
          minutes: number | null
          name: string | null
          open_tasks: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          area_id?: string | null
          client?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string | null
          minutes?: never
          name?: string | null
          open_tasks?: never
          status?: string | null
          user_id?: string | null
        }
        Update: {
          area_id?: string | null
          client?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string | null
          minutes?: never
          name?: string | null
          open_tasks?: never
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_area_id_fkey"
            columns: ["user_id", "area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
    }
    Functions: {
      as_user: { Args: { mail: string }; Returns: undefined }
      copy_week: {
        Args: { from_monday: string; to_monday: string }
        Returns: number
      }
      next_due: { Args: { last: string; repeat: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const

