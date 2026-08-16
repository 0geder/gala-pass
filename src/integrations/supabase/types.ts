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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          boarded: boolean
          boarding_staff: string | null
          boarding_time: string | null
          bus_number: string | null
          id: string
          return_staff: string | null
          return_time: string | null
          returned: boolean
          ticket_id: string
          updated_at: string
        }
        Insert: {
          boarded?: boolean
          boarding_staff?: string | null
          boarding_time?: string | null
          bus_number?: string | null
          id?: string
          return_staff?: string | null
          return_time?: string | null
          returned?: boolean
          ticket_id: string
          updated_at?: string
        }
        Update: {
          boarded?: boolean
          boarding_staff?: string | null
          boarding_time?: string | null
          bus_number?: string | null
          id?: string
          return_staff?: string | null
          return_time?: string | null
          returned?: boolean
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      attendees: {
        Row: {
          created_at: string
          dietary_requirement: string | null
          email: string
          event_id: string
          first_name: string
          form_submission_id: string | null
          id: string
          student_number: string
          surname: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dietary_requirement?: string | null
          email: string
          event_id: string
          first_name: string
          form_submission_id?: string | null
          id?: string
          student_number: string
          surname: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dietary_requirement?: string | null
          email?: string
          event_id?: string
          first_name?: string
          form_submission_id?: string | null
          id?: string
          student_number?: string
          surname?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          email_body: string
          email_domain: string
          email_from: string | null
          email_subject: string
          event_date: string | null
          google_sheet_url: string | null
          id: string
          is_active: boolean
          name: string
          subtitle: string | null
          theme: string | null
          ticket_prefix: string
          ticket_price: number | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          email_body?: string
          email_domain?: string
          email_from?: string | null
          email_subject?: string
          event_date?: string | null
          google_sheet_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          subtitle?: string | null
          theme?: string | null
          ticket_prefix?: string
          ticket_price?: number | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          email_body?: string
          email_domain?: string
          email_from?: string | null
          email_subject?: string
          event_date?: string | null
          google_sheet_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          subtitle?: string | null
          theme?: string | null
          ticket_prefix?: string
          ticket_price?: number | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          attendee_id: string
          email_sent_at: string | null
          event_id: string
          id: string
          issued_at: string
          qr_token: string
          status: string
          ticket_number: string
          ticket_url: string | null
        }
        Insert: {
          attendee_id: string
          email_sent_at?: string | null
          event_id: string
          id?: string
          issued_at?: string
          qr_token: string
          status?: string
          ticket_number: string
          ticket_url?: string | null
        }
        Update: {
          attendee_id?: string
          email_sent_at?: string | null
          event_id?: string
          id?: string
          issued_at?: string
          qr_token?: string
          status?: string
          ticket_number?: string
          ticket_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: true
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
      app_role: "admin" | "staff"
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
      app_role: ["admin", "staff"],
    },
  },
} as const
