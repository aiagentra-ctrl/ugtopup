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
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          starts_at: string | null
          target: string
          target_emails: string[] | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          starts_at?: string | null
          target?: string
          target_emails?: string[] | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          starts_at?: string | null
          target?: string
          target_emails?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      archived_orders: {
        Row: {
          admin_remarks: string | null
          archived_at: string
          canceled_at: string | null
          cancellation_reason: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          credits_deducted: number | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          order_number: string
          package_name: string
          payment_method: string | null
          price: number
          processing_started_at: string | null
          product_category: string
          product_details: Json
          product_name: string
          quantity: number
          reviewed_by: string | null
          status: string
          transaction_id: string | null
          updated_at: string | null
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          admin_remarks?: string | null
          archived_at?: string
          canceled_at?: string | null
          cancellation_reason?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          credits_deducted?: number | null
          failed_at?: string | null
          failure_reason?: string | null
          id: string
          metadata?: Json | null
          order_number: string
          package_name: string
          payment_method?: string | null
          price: number
          processing_started_at?: string | null
          product_category: string
          product_details?: Json
          product_name: string
          quantity: number
          reviewed_by?: string | null
          status: string
          transaction_id?: string | null
          updated_at?: string | null
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          admin_remarks?: string | null
          archived_at?: string
          canceled_at?: string | null
          cancellation_reason?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          credits_deducted?: number | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          order_number?: string
          package_name?: string
          payment_method?: string | null
          price?: number
          processing_started_at?: string | null
          product_category?: string
          product_details?: Json
          product_name?: string
          quantity?: number
          reviewed_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      banner_slides: {
        Row: {
          created_at: string
          cta_text: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_text?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_text?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_conversations: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          platform: string
          role: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          platform?: string
          role: string
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          platform?: string
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      chatbot_feedback: {
        Row: {
          bot_response: string | null
          comment: string | null
          created_at: string
          id: string
          message_id: string
          rating: string
          session_id: string
          user_message: string | null
        }
        Insert: {
          bot_response?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          message_id: string
          rating: string
          session_id: string
          user_message?: string | null
        }
        Update: {
          bot_response?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          message_id?: string
          rating?: string
          session_id?: string
          user_message?: string | null
        }
        Relationships: []
      }
      chatbot_settings: {
        Row: {
          ai_model: string
          ai_provider: string
          ai_system_prompt: string | null
          button1_enabled: boolean | null
          button1_label: string | null
          button2_enabled: boolean | null
          button2_label: string | null
          button3_enabled: boolean | null
          button3_label: string | null
          created_at: string
          custom_api_key_name: string | null
          custom_api_url: string | null
          gmail_fallback_email: string | null
          gmail_fallback_enabled: boolean | null
          id: string
          is_enabled: boolean
          order_track_prompt: string | null
          payment_help_message: string | null
          updated_at: string
          webhook_url: string | null
          welcome_message: string | null
        }
        Insert: {
          ai_model?: string
          ai_provider?: string
          ai_system_prompt?: string | null
          button1_enabled?: boolean | null
          button1_label?: string | null
          button2_enabled?: boolean | null
          button2_label?: string | null
          button3_enabled?: boolean | null
          button3_label?: string | null
          created_at?: string
          custom_api_key_name?: string | null
          custom_api_url?: string | null
          gmail_fallback_email?: string | null
          gmail_fallback_enabled?: boolean | null
          id?: string
          is_enabled?: boolean
          order_track_prompt?: string | null
          payment_help_message?: string | null
          updated_at?: string
          webhook_url?: string | null
          welcome_message?: string | null
        }
        Update: {
          ai_model?: string
          ai_provider?: string
          ai_system_prompt?: string | null
          button1_enabled?: boolean | null
          button1_label?: string | null
          button2_enabled?: boolean | null
          button2_label?: string | null
          button3_enabled?: boolean | null
          button3_label?: string | null
          created_at?: string
          custom_api_key_name?: string | null
          custom_api_url?: string | null
          gmail_fallback_email?: string | null
          gmail_fallback_enabled?: boolean | null
          id?: string
          is_enabled?: boolean
          order_track_prompt?: string | null
          payment_help_message?: string | null
          updated_at?: string
          webhook_url?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
      cleanup_logs: {
        Row: {
          cleanup_type: string
          created_at: string
          details: string | null
          id: string
          records_affected: number | null
        }
        Insert: {
          cleanup_type: string
          created_at?: string
          details?: string | null
          id?: string
          records_affected?: number | null
        }
        Update: {
          cleanup_type?: string
          created_at?: string
          details?: string | null
          id?: string
          records_affected?: number | null
        }
        Relationships: []
      }
      cleanup_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean | null
          last_run_at: string | null
          setting_key: string
          setting_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          setting_key: string
          setting_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          setting_key?: string
          setting_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      coupon_rules: {
        Row: {
          applicable_categories: string[] | null
          applicable_products: string[] | null
          conditions: Json
          coupon_code: string | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount_amount: number | null
          max_total_uses: number | null
          max_uses_per_user: number | null
          name: string
          rule_type: string
          starts_at: string | null
          total_used: number | null
          updated_at: string
        }
        Insert: {
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          conditions?: Json
          coupon_code?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_total_uses?: number | null
          max_uses_per_user?: number | null
          name: string
          rule_type?: string
          starts_at?: string | null
          total_used?: number | null
          updated_at?: string
        }
        Update: {
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          conditions?: Json
          coupon_code?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_total_uses?: number | null
          max_uses_per_user?: number | null
          name?: string
          rule_type?: string
          starts_at?: string | null
          total_used?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          applicable_categories: string[] | null
          applicable_products: string[] | null
          code: string
          created_at: string
          discount_percent: number
          discount_type: string
          discount_value: number
          expires_at: string
          id: string
          is_used: boolean
          max_discount_amount: number | null
          max_uses: number
          min_order_amount: number
          source: string
          source_id: string | null
          use_count: number
          used_at: string | null
          used_on_order_id: string | null
          user_id: string
        }
        Insert: {
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          code: string
          created_at?: string
          discount_percent: number
          discount_type?: string
          discount_value?: number
          expires_at: string
          id?: string
          is_used?: boolean
          max_discount_amount?: number | null
          max_uses?: number
          min_order_amount?: number
          source?: string
          source_id?: string | null
          use_count?: number
          used_at?: string | null
          used_on_order_id?: string | null
          user_id: string
        }
        Update: {
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          code?: string
          created_at?: string
          discount_percent?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string
          id?: string
          is_used?: boolean
          max_discount_amount?: number | null
          max_uses?: number
          min_order_amount?: number
          source?: string
          source_id?: string | null
          use_count?: number
          used_at?: string | null
          used_on_order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_used_on_order_id_fkey"
            columns: ["used_on_order_id"]
            isOneToOne: false
            referencedRelation: "product_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_maintenance_log: {
        Row: {
          created_at: string
          description: string
          feature_area: string
          hours_spent: number
          id: string
          month: string
        }
        Insert: {
          created_at?: string
          description: string
          feature_area: string
          hours_spent?: number
          id?: string
          month: string
        }
        Update: {
          created_at?: string
          description?: string
          feature_area?: string
          hours_spent?: number
          id?: string
          month?: string
        }
        Relationships: []
      }
      developer_service_pricing: {
        Row: {
          billing_start_date: string
          category: string
          created_at: string
          currency: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          monthly_price: number
          service_name: string
          updated_at: string
        }
        Insert: {
          billing_start_date?: string
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          monthly_price?: number
          service_name: string
          updated_at?: string
        }
        Update: {
          billing_start_date?: string
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          monthly_price?: number
          service_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      dynamic_products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          discount_price: number | null
          display_order: number
          features: Json | null
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          offer_badge_color: string | null
          offer_badge_text: string | null
          offer_id: string | null
          plans: Json | null
          price: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_price?: number | null
          display_order?: number
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          offer_badge_color?: string | null
          offer_badge_text?: string | null
          offer_id?: string | null
          plans?: Json | null
          price?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_price?: number | null
          display_order?: number
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          offer_badge_color?: string | null
          offer_badge_text?: string | null
          offer_id?: string | null
          plans?: Json | null
          price?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynamic_products_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          category: string
          created_at: string
          depends_on: string | null
          description: string | null
          disabled_message: string | null
          feature_key: string
          feature_name: string
          id: string
          is_enabled: boolean
          monthly_cost_note: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          depends_on?: string | null
          description?: string | null
          disabled_message?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_enabled?: boolean
          monthly_cost_note?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          depends_on?: string | null
          description?: string | null
          disabled_message?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean
          monthly_cost_note?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      game_page_descriptions: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          page_slug: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          page_slug: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          page_slug?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      game_product_prices: {
        Row: {
          created_at: string | null
          currency: string | null
          display_order: number | null
          game: string
          id: string
          is_active: boolean | null
          is_api_product: boolean | null
          package_id: string
          package_name: string
          package_type: string
          price: number
          quantity: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          display_order?: number | null
          game: string
          id?: string
          is_active?: boolean | null
          is_api_product?: boolean | null
          package_id: string
          package_name: string
          package_type: string
          price: number
          quantity: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          display_order?: number | null
          game?: string
          id?: string
          is_active?: boolean | null
          is_api_product?: boolean | null
          package_id?: string
          package_name?: string
          package_type?: string
          price?: number
          quantity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      liana_orders: {
        Row: {
          api_request_sent: boolean | null
          api_response: Json | null
          api_transaction_id: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          ign: string | null
          liana_product_id: number
          order_id: string
          order_response: Json | null
          order_sent_at: string | null
          retry_count: number | null
          status: string | null
          updated_at: string | null
          user_id: string
          verification_completed_at: string | null
          verification_response: Json | null
          verification_sent_at: string | null
          zone_id: string
        }
        Insert: {
          api_request_sent?: boolean | null
          api_response?: Json | null
          api_transaction_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ign?: string | null
          liana_product_id: number
          order_id: string
          order_response?: Json | null
          order_sent_at?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          verification_completed_at?: string | null
          verification_response?: Json | null
          verification_sent_at?: string | null
          zone_id: string
        }
        Update: {
          api_request_sent?: boolean | null
          api_response?: Json | null
          api_transaction_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ign?: string | null
          liana_product_id?: number
          order_id?: string
          order_response?: Json | null
          order_sent_at?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_completed_at?: string | null
          verification_response?: Json | null
          verification_sent_at?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liana_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "product_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_active: boolean
          message: string
          notification_type: string
          target_emails: string[] | null
          target_type: Database["public"]["Enums"]["notification_target_type"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          message: string
          notification_type?: string
          target_emails?: string[] | null
          target_type?: Database["public"]["Enums"]["notification_target_type"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          message?: string
          notification_type?: string
          target_emails?: string[] | null
          target_type?: Database["public"]["Enums"]["notification_target_type"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          animation_type: string | null
          background_gradient: string | null
          badge_color: string | null
          badge_text: string | null
          badge_text_color: string | null
          created_at: string
          custom_icon_url: string | null
          description: string | null
          design_template: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          offer_type: string
          product_link: string | null
          seasonal_theme: string | null
          show_on_homepage: boolean
          show_on_product_page: boolean
          subtitle: string | null
          timer_enabled: boolean
          timer_end_date: string | null
          timer_start_date: string | null
          timer_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          animation_type?: string | null
          background_gradient?: string | null
          badge_color?: string | null
          badge_text?: string | null
          badge_text_color?: string | null
          created_at?: string
          custom_icon_url?: string | null
          description?: string | null
          design_template?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          offer_type?: string
          product_link?: string | null
          seasonal_theme?: string | null
          show_on_homepage?: boolean
          show_on_product_page?: boolean
          subtitle?: string | null
          timer_enabled?: boolean
          timer_end_date?: string | null
          timer_start_date?: string | null
          timer_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          animation_type?: string | null
          background_gradient?: string | null
          badge_color?: string | null
          badge_text?: string | null
          badge_text_color?: string | null
          created_at?: string
          custom_icon_url?: string | null
          description?: string | null
          design_template?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          offer_type?: string
          product_link?: string | null
          seasonal_theme?: string | null
          show_on_homepage?: boolean
          show_on_product_page?: boolean
          subtitle?: string | null
          timer_enabled?: boolean
          timer_end_date?: string | null
          timer_start_date?: string | null
          timer_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string
          traffic_source: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id: string
          traffic_source?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string
          traffic_source?: string
          user_agent?: string | null
          user_id?: string | null
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
      payment_transactions: {
        Row: {
          amount: number
          api_response: Json | null
          api_transaction_id: string | null
          completed_at: string | null
          created_at: string | null
          credits: number
          currency: string | null
          id: string
          identifier: string
          metadata: Json | null
          payment_gateway: string | null
          redirect_url: string | null
          status: string | null
          updated_at: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          amount: number
          api_response?: Json | null
          api_transaction_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits: number
          currency?: string | null
          id?: string
          identifier: string
          metadata?: Json | null
          payment_gateway?: string | null
          redirect_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          amount?: number
          api_response?: Json | null
          api_transaction_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits?: number
          currency?: string | null
          id?: string
          identifier?: string
          metadata?: Json | null
          payment_gateway?: string | null
          redirect_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
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
          failed_at: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          order_number: string
          package_name: string
          payment_method: string | null
          price: number
          processing_started_at: string | null
          product_category: Database["public"]["Enums"]["product_category"]
          product_details: Json
          product_name: string
          quantity: number
          reviewed_by: string | null
          status: Database["public"]["Enums"]["order_status"]
          transaction_id: string | null
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
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          order_number: string
          package_name: string
          payment_method?: string | null
          price: number
          processing_started_at?: string | null
          product_category: Database["public"]["Enums"]["product_category"]
          product_details?: Json
          product_name: string
          quantity: number
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          transaction_id?: string | null
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
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          order_number?: string
          package_name?: string
          payment_method?: string | null
          price?: number
          processing_started_at?: string | null
          product_category?: Database["public"]["Enums"]["product_category"]
          product_details?: Json
          product_name?: string
          quantity?: number
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          transaction_id?: string | null
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
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          username: string | null
          winnings_balance: number
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          provider?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          username?: string | null
          winnings_balance?: number
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          provider?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          username?: string | null
          winnings_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_analytics: {
        Row: {
          coupon_id: string | null
          coupon_rule_id: string | null
          created_at: string
          discount_amount: number
          event_type: string
          final_price: number | null
          id: string
          offer_id: string | null
          order_id: string | null
          original_price: number | null
          user_id: string
        }
        Insert: {
          coupon_id?: string | null
          coupon_rule_id?: string | null
          created_at?: string
          discount_amount?: number
          event_type?: string
          final_price?: number | null
          id?: string
          offer_id?: string | null
          order_id?: string | null
          original_price?: number | null
          user_id: string
        }
        Update: {
          coupon_id?: string | null
          coupon_rule_id?: string | null
          created_at?: string
          discount_amount?: number
          event_type?: string
          final_price?: number | null
          id?: string
          offer_id?: string | null
          order_id?: string | null
          original_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_analytics_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_analytics_coupon_rule_id_fkey"
            columns: ["coupon_rule_id"]
            isOneToOne: false
            referencedRelation: "coupon_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_analytics_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_analytics_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "product_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          min_order_amount: number
          referee_coupon_validity_days: number
          referee_discount_percent: number
          referrer_coupon_validity_days: number
          referrer_discount_percent: number
          reward_after: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          min_order_amount?: number
          referee_coupon_validity_days?: number
          referee_discount_percent?: number
          referrer_coupon_validity_days?: number
          referrer_discount_percent?: number
          reward_after?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          min_order_amount?: number
          referee_coupon_validity_days?: number
          referee_discount_percent?: number
          referrer_coupon_validity_days?: number
          referrer_discount_percent?: number
          reward_after?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referee_first_order_id: string | null
          referee_id: string
          referrer_id: string
          rewarded: boolean
          rewarded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referee_first_order_id?: string | null
          referee_id: string
          referrer_id: string
          rewarded?: boolean
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referee_first_order_id?: string | null
          referee_id?: string
          referrer_id?: string
          rewarded?: boolean
          rewarded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_first_order_id_fkey"
            columns: ["referee_first_order_id"]
            isOneToOne: false
            referencedRelation: "product_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_milestones: {
        Row: {
          coupon_validity_days: number
          created_at: string
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean
          order_count: number
          updated_at: string
        }
        Insert: {
          coupon_validity_days?: number
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          order_count: number
          updated_at?: string
        }
        Update: {
          coupon_validity_days?: number
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          order_count?: number
          updated_at?: string
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
      subscriptions: {
        Row: {
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          next_run_at: string | null
          package_name: string
          price: number
          product_category: string
          product_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          next_run_at?: string | null
          package_name: string
          price: number
          product_category: string
          product_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          next_run_at?: string | null
          package_name?: string
          price?: number
          product_category?: string
          product_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          closed_at: string | null
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_daily_reports: {
        Row: {
          active_users: number | null
          created_at: string | null
          database_stats: Json | null
          failed_orders: number | null
          id: string
          pending_orders: number | null
          report_date: string
          total_chatbot_interactions: number | null
          total_credit_requests: number | null
          total_orders: number | null
          total_revenue: number | null
        }
        Insert: {
          active_users?: number | null
          created_at?: string | null
          database_stats?: Json | null
          failed_orders?: number | null
          id?: string
          pending_orders?: number | null
          report_date: string
          total_chatbot_interactions?: number | null
          total_credit_requests?: number | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Update: {
          active_users?: number | null
          created_at?: string | null
          database_stats?: Json | null
          failed_orders?: number | null
          id?: string
          pending_orders?: number | null
          report_date?: string
          total_chatbot_interactions?: number | null
          total_credit_requests?: number | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_role?: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          coins_won: number
          id: string
          joined_at: string
          result: Database["public"]["Enums"]["participant_result"]
          tournament_id: string
          user_id: string
        }
        Insert: {
          coins_won?: number
          id?: string
          joined_at?: string
          result?: Database["public"]["Enums"]["participant_result"]
          tournament_id: string
          user_id: string
        }
        Update: {
          coins_won?: number
          id?: string
          joined_at?: string
          result?: Database["public"]["Enums"]["participant_result"]
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_reports: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          match_name: string
          reason: string
          status: Database["public"]["Enums"]["report_status"]
          tournament_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          match_name: string
          reason: string
          status?: Database["public"]["Enums"]["report_status"]
          tournament_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          match_name?: string
          reason?: string
          status?: Database["public"]["Enums"]["report_status"]
          tournament_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_reports_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_withdrawals: {
        Row: {
          account_detail: string
          admin_remarks: string | null
          amount_coins: number
          amount_npr: number
          created_at: string
          id: string
          method: string
          processed_at: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_email: string
          user_id: string
        }
        Insert: {
          account_detail: string
          admin_remarks?: string | null
          amount_coins: number
          amount_npr: number
          created_at?: string
          id?: string
          method: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_email: string
          user_id: string
        }
        Update: {
          account_detail?: string
          admin_remarks?: string | null
          amount_coins?: number
          amount_npr?: number
          created_at?: string
          id?: string
          method?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          created_at: string
          created_by: string
          current_players: number
          description: string | null
          entry_fee: number
          finished_at: string | null
          game: string
          game_mode: string
          id: string
          max_players: number
          name: string
          password: string
          prize: number
          room_id: string
          room_status: string
          starts_at: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_players?: number
          description?: string | null
          entry_fee?: number
          finished_at?: string | null
          game: string
          game_mode?: string
          id?: string
          max_players?: number
          name: string
          password: string
          prize?: number
          room_id: string
          room_status?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_players?: number
          description?: string | null
          entry_fee?: number
          finished_at?: string | null
          game?: string
          game_mode?: string
          id?: string
          max_players?: number
          name?: string
          password?: string
          prize?: number
          room_id?: string
          room_status?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      visitor_sessions: {
        Row: {
          id: string
          is_bounce: boolean
          last_active_at: string
          page_count: number
          referrer: string | null
          session_id: string
          started_at: string
          traffic_source: string
          user_id: string | null
        }
        Insert: {
          id?: string
          is_bounce?: boolean
          last_active_at?: string
          page_count?: number
          referrer?: string | null
          session_id: string
          started_at?: string
          traffic_source?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          is_bounce?: boolean
          last_active_at?: string
          page_count?: number
          referrer?: string | null
          session_id?: string
          started_at?: string
          traffic_source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      voucher_codes: {
        Row: {
          added_at: string
          code: string
          game: string
          id: string
          order_id: string | null
          package_id: string | null
          product_name: string
          status: string
          used_at: string | null
        }
        Insert: {
          added_at?: string
          code: string
          game: string
          id?: string
          order_id?: string | null
          package_id?: string | null
          product_name: string
          status?: string
          used_at?: string | null
        }
        Update: {
          added_at?: string
          code?: string
          game?: string
          id?: string
          order_id?: string | null
          package_id?: string | null
          product_name?: string
          status?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voucher_codes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "product_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_activity_logs: {
        Row: {
          action: string
          api_response: Json | null
          api_status: string | null
          balance_after: number | null
          balance_before: number | null
          coins_used: number | null
          created_at: string
          error_message: string | null
          id: string
          liana_order_id: string | null
          order_id: string | null
          order_number: string | null
        }
        Insert: {
          action: string
          api_response?: Json | null
          api_status?: string | null
          balance_after?: number | null
          balance_before?: number | null
          coins_used?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          liana_order_id?: string | null
          order_id?: string | null
          order_number?: string | null
        }
        Update: {
          action?: string
          api_response?: Json | null
          api_status?: string | null
          balance_after?: number | null
          balance_before?: number | null
          coins_used?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          liana_order_id?: string | null
          order_id?: string | null
          order_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_activity_logs_liana_order_id_fkey"
            columns: ["liana_order_id"]
            isOneToOne: false
            referencedRelation: "liana_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_activity_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "product_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_config: {
        Row: {
          api_key: string | null
          connected_number: string | null
          connection_status: string
          created_at: string
          id: string
          instance_name: string
          is_enabled: boolean
          server_url: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_key?: string | null
          connected_number?: string | null
          connection_status?: string
          created_at?: string
          id?: string
          instance_name?: string
          is_enabled?: boolean
          server_url?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_key?: string | null
          connected_number?: string | null
          connection_status?: string
          created_at?: string
          id?: string
          instance_name?: string
          is_enabled?: boolean
          server_url?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      whatsapp_message_flows: {
        Row: {
          created_at: string
          error_message: string | null
          flow_id: string
          id: string
          phone_number: string | null
          request_payload: Json | null
          response_payload: Json | null
          session_id: string | null
          stage: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          flow_id: string
          id?: string
          phone_number?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          session_id?: string | null
          stage: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          flow_id?: string
          id?: string
          phone_number?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          session_id?: string | null
          stage?: string
          status?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          direction: string
          error_message: string | null
          id: string
          message: string
          metadata: Json | null
          phone_number: string
          session_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          direction: string
          error_message?: string | null
          id?: string
          message: string
          metadata?: Json | null
          phone_number: string
          session_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          phone_number?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
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
      apply_referral: { Args: { p_referral_code: string }; Returns: Json }
      approve_payment_request: {
        Args: { admin_remarks_text?: string; request_id: string }
        Returns: Json
      }
      assign_voucher_code: {
        Args: { p_game: string; p_order_id: string; p_package_id: string }
        Returns: string
      }
      cancel_order: {
        Args: { cancellation_reason_text: string; order_id: string }
        Returns: Json
      }
      complete_ml_order: {
        Args: {
          p_api_response: Json
          p_api_transaction_id?: string
          p_liana_order_id: string
          p_order_id: string
        }
        Returns: Json
      }
      confirm_order: {
        Args: { admin_remarks_text?: string; order_id: string }
        Returns: Json
      }
      create_user_notification: {
        Args: {
          p_message: string
          p_notification_type?: string
          p_title: string
          p_user_id: string
        }
        Returns: undefined
      }
      delete_payment_request: { Args: { request_id: string }; Returns: Json }
      fail_ml_order: {
        Args: {
          p_api_response?: Json
          p_error_message: string
          p_liana_order_id: string
          p_order_id: string
        }
        Returns: Json
      }
      finish_tournament: {
        Args: { p_tournament_id: string; p_winner_user_id: string }
        Returns: Json
      }
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
      get_storage_usage: { Args: never; Returns: Json }
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
      is_developer: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      join_tournament: { Args: { p_tournament_id: string }; Returns: Json }
      leave_tournament: { Args: { p_tournament_id: string }; Returns: Json }
      place_order:
        | {
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
              failed_at: string | null
              failure_reason: string | null
              id: string
              metadata: Json | null
              order_number: string
              package_name: string
              payment_method: string | null
              price: number
              processing_started_at: string | null
              product_category: Database["public"]["Enums"]["product_category"]
              product_details: Json
              product_name: string
              quantity: number
              reviewed_by: string | null
              status: Database["public"]["Enums"]["order_status"]
              transaction_id: string | null
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
        | {
            Args: {
              p_coupon_code?: string
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
              failed_at: string | null
              failure_reason: string | null
              id: string
              metadata: Json | null
              order_number: string
              package_name: string
              payment_method: string | null
              price: number
              processing_started_at: string | null
              product_category: Database["public"]["Enums"]["product_category"]
              product_details: Json
              product_name: string
              quantity: number
              reviewed_by: string | null
              status: Database["public"]["Enums"]["order_status"]
              transaction_id: string | null
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
      process_payment_completion: {
        Args: {
          p_api_response: Json
          p_gateway: string
          p_identifier: string
          p_transaction_id: string
        }
        Returns: Json
      }
      process_payment_failure: {
        Args: { p_api_response: Json; p_identifier: string; p_status: string }
        Returns: Json
      }
      refresh_dashboard_stats: { Args: never; Returns: undefined }
      reject_payment_request: {
        Args: { admin_remarks_text: string; request_id: string }
        Returns: Json
      }
      start_tournament: { Args: { p_tournament_id: string }; Returns: Json }
      try_assign_voucher: {
        Args: { p_game: string; p_order_id: string; p_package_id: string }
        Returns: Json
      }
      validate_coupon: {
        Args: {
          p_coupon_code: string
          p_order_amount: number
          p_product_category?: string
        }
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
      app_role: "admin" | "user" | "super_admin" | "sub_admin" | "developer"
      notification_target_type: "all" | "specific"
      order_status:
        | "pending"
        | "confirmed"
        | "canceled"
        | "processing"
        | "completed"
      participant_result: "pending" | "won" | "lost"
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
      report_status: "review" | "resolved" | "rejected"
      tournament_status: "upcoming" | "live" | "finished" | "canceled"
      withdrawal_status: "pending" | "processed" | "rejected"
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
      app_role: ["admin", "user", "super_admin", "sub_admin", "developer"],
      notification_target_type: ["all", "specific"],
      order_status: [
        "pending",
        "confirmed",
        "canceled",
        "processing",
        "completed",
      ],
      participant_result: ["pending", "won", "lost"],
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
      report_status: ["review", "resolved", "rejected"],
      tournament_status: ["upcoming", "live", "finished", "canceled"],
      withdrawal_status: ["pending", "processed", "rejected"],
    },
  },
} as const
