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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          actor_email: string | null
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      payment_request_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_status: Database["public"]["Enums"]["payment_status"] | null
          old_status: Database["public"]["Enums"]["payment_status"] | null
          payment_request_id: string | null
          remarks: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["payment_status"] | null
          old_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_request_id?: string | null
          remarks?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["payment_status"] | null
          old_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_request_id?: string | null
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_request_history_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          admin_remarks: string | null
          amount: number
          created_at: string | null
          credits: number
          id: string
          remarks: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_path: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string | null
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          admin_remarks?: string | null
          amount: number
          created_at?: string | null
          credits: number
          id?: string
          remarks?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string | null
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          admin_remarks?: string | null
          amount?: number
          created_at?: string | null
          credits?: number
          id?: string
          remarks?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string | null
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      product_orders: {
        Row: {
          admin_remarks: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          credits_deducted: number | null
          id: string
          metadata: Json | null
          order_number: string
          package_name: string
          payment_method: string | null
          price: number
          product_category: Database["public"]["Enums"]["product_category"]
          product_details: Json
          product_name: string
          quantity: number
          reviewed_by: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string | null
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          admin_remarks?: string | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          credits_deducted?: number | null
          id?: string
          metadata?: Json | null
          order_number: string
          package_name: string
          payment_method?: string | null
          price: number
          product_category: Database["public"]["Enums"]["product_category"]
          product_details?: Json
          product_name: string
          quantity: number
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string | null
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          admin_remarks?: string | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          credits_deducted?: number | null
          id?: string
          metadata?: Json | null
          order_number?: string
          package_name?: string
          payment_method?: string | null
          price?: number
          product_category?: Database["public"]["Enums"]["product_category"]
          product_details?: Json
          product_name?: string
          quantity?: number
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string | null
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          metadata: Json | null
          name: string
          original_price: number | null
          price: number
          product_id: string
          quantity: number | null
          stock_status: string | null
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          original_price?: number | null
          price: number
          product_id: string
          quantity?: number | null
          stock_status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          original_price?: number | null
          price?: number
          product_id?: string
          quantity?: number | null
          stock_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number
          created_at: string
          email: string
          full_name: string | null
          id: string
          provider: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          provider?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          provider?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_dashboard_stats: {
        Row: {
          canceled_orders: number | null
          confirmed_orders: number | null
          confirmed_payment_requests: number | null
          last_updated: string | null
          new_users_last_month: number | null
          pending_orders: number | null
          pending_payment_requests: number | null
          rejected_payment_requests: number | null
          total_balance_remaining: number | null
          total_credits_added: number | null
          total_credits_spent: number | null
          total_orders: number | null
          total_revenue: number | null
          total_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_payment_request: {
        Args: { admin_remarks_text?: string; request_id: string }
        Returns: Json
      }
      cancel_order: {
        Args: { cancellation_reason_text: string; order_id: string }
        Returns: Json
      }
      confirm_order: {
        Args: { admin_remarks_text?: string; order_id: string }
        Returns: Json
      }
      delete_payment_request: { Args: { request_id: string }; Returns: Json }
      get_dashboard_stats: {
        Args: never
        Returns: {
          canceled_orders: number
          confirmed_orders: number
          confirmed_payment_requests: number
          last_updated: string
          new_users_last_month: number
          pending_orders: number
          pending_payment_requests: number
          rejected_payment_requests: number
          total_balance_remaining: number
          total_credits_added: number
          total_credits_spent: number
          total_orders: number
          total_revenue: number
          total_users: number
        }[]
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      place_order: {
        Args: {
          p_package_name: string
          p_payment_method?: string
          p_price: number
          p_product_category: Database["public"]["Enums"]["product_category"]
          p_product_details: Json
          p_product_name: string
          p_quantity: number
        }
        Returns: {
          admin_remarks: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          credits_deducted: number | null
          id: string
          metadata: Json | null
          order_number: string
          package_name: string
          payment_method: string | null
          price: number
          product_category: Database["public"]["Enums"]["product_category"]
          product_details: Json
          product_name: string
          quantity: number
          reviewed_by: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string | null
          user_email: string
          user_id: string
          user_name: string | null
        }
        SetofOptions: {
          from: "*"
          to: "product_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_dashboard_stats: { Args: never; Returns: undefined }
      reject_payment_request: {
        Args: { admin_remarks_text: string; request_id: string }
        Returns: Json
      }
    }
    Enums: {
      activity_type:
        | "payment_approved"
        | "payment_rejected"
        | "order_confirmed"
        | "order_canceled"
        | "credit_added"
        | "credit_deducted"
        | "user_created"
        | "role_changed"
        | "admin_action"
        | "system_action"
        | "order_created"
      app_role: "admin" | "user" | "super_admin" | "sub_admin"
      order_status:
        | "pending"
        | "confirmed"
        | "canceled"
        | "processing"
        | "completed"
      payment_status: "pending" | "confirmed" | "rejected"
      product_category:
        | "freefire"
        | "tiktok"
        | "netflix"
        | "garena"
        | "youtube"
        | "smilecoin"
        | "chatgpt"
        | "unipin"
        | "other"
        | "mobile_legends"
        | "roblox"
        | "design"
        | "pubg"
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
      activity_type: [
        "payment_approved",
        "payment_rejected",
        "order_confirmed",
        "order_canceled",
        "credit_added",
        "credit_deducted",
        "user_created",
        "role_changed",
        "admin_action",
        "system_action",
        "order_created",
      ],
      app_role: ["admin", "user", "super_admin", "sub_admin"],
      order_status: [
        "pending",
        "confirmed",
        "canceled",
        "processing",
        "completed",
      ],
      payment_status: ["pending", "confirmed", "rejected"],
      product_category: [
        "freefire",
        "tiktok",
        "netflix",
        "garena",
        "youtube",
        "smilecoin",
        "chatgpt",
        "unipin",
        "other",
        "mobile_legends",
        "roblox",
        "design",
        "pubg",
      ],
    },
  },
} as const
