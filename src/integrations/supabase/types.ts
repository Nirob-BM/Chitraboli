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
      admin_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          status: string | null
        }
        Insert: {
          backup_type: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_image: string | null
          product_name: string
          product_price: number
          quantity: number
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_image?: string | null
          product_name: string
          product_price: number
          quantity?: number
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_category: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_category?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_category?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          subject?: string
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          created_at: string
          created_by: string | null
          customer_email: string
          customer_phone: string | null
          id: string
          note: string
          note_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_email: string
          customer_phone?: string | null
          id?: string
          note: string
          note_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_email?: string
          customer_phone?: string | null
          id?: string
          note?: string
          note_type?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          block_reason: string | null
          created_at: string
          email: string | null
          id: string
          is_blocked: boolean | null
          name: string | null
          phone: string | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          block_reason?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          name?: string | null
          phone?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          block_reason?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          name?: string | null
          phone?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_riders: {
        Row: {
          created_at: string
          current_status: string | null
          email: string | null
          id: string
          is_active: boolean | null
          license_number: string | null
          name: string
          phone: string
          profile_image_url: string | null
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          current_status?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          name: string
          phone: string
          profile_image_url?: string | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          current_status?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          name?: string
          phone?: string
          profile_image_url?: string | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      media_library: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          folder: string | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          folder?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          folder?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          is_visible: boolean | null
          label: string
          menu_location: string
          open_in_new_tab: boolean | null
          parent_id: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_visible?: boolean | null
          label: string
          menu_location?: string
          open_in_new_tab?: boolean | null
          parent_id?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_visible?: boolean | null
          label?: string
          menu_location?: string
          open_in_new_tab?: boolean | null
          parent_id?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email_enabled: boolean | null
          id: string
          is_enabled: boolean | null
          notification_type: string
          recipients: string[] | null
          sms_enabled: boolean | null
          template: Json | null
          updated_at: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          is_enabled?: boolean | null
          notification_type: string
          recipients?: string[] | null
          sms_enabled?: boolean | null
          template?: Json | null
          updated_at?: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          is_enabled?: boolean | null
          notification_type?: string
          recipients?: string[] | null
          sms_enabled?: boolean | null
          template?: Json | null
          updated_at?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          assigned_rider_id: string | null
          created_at: string
          customer_address: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_notes: string | null
          id: string
          items: Json
          payment_method: string | null
          rider_assigned_at: string | null
          session_id: string | null
          status: string
          total_amount: number
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_rider_id?: string | null
          created_at?: string
          customer_address: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_notes?: string | null
          id?: string
          items: Json
          payment_method?: string | null
          rider_assigned_at?: string | null
          session_id?: string | null
          status?: string
          total_amount: number
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_rider_id?: string | null
          created_at?: string
          customer_address?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivery_notes?: string | null
          id?: string
          items?: Json
          payment_method?: string | null
          rider_assigned_at?: string | null
          session_id?: string | null
          status?: string
          total_amount?: number
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_rider_id_fkey"
            columns: ["assigned_rider_id"]
            isOneToOne: false
            referencedRelation: "delivery_riders"
            referencedColumns: ["id"]
          },
        ]
      }
      page_content: {
        Row: {
          content: Json
          created_at: string
          display_order: number | null
          id: string
          is_visible: boolean | null
          page_slug: string
          section_key: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          page_slug: string
          section_key: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          page_slug?: string
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          colors: string[] | null
          created_at: string
          description: string | null
          facebook_post_id: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          images: string[] | null
          in_stock: boolean | null
          name: string
          price: number
          sizes: string[] | null
          sku: string | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          colors?: string[] | null
          created_at?: string
          description?: string | null
          facebook_post_id?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          name: string
          price: number
          sizes?: string[] | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          colors?: string[] | null
          created_at?: string
          description?: string | null
          facebook_post_id?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          name?: string
          price?: number
          sizes?: string[] | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          images: string[] | null
          product_id: string | null
          rating: number
          review_text: string
          reviewer_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          images?: string[] | null
          product_id?: string | null
          rating: number
          review_text: string
          reviewer_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          images?: string[] | null
          product_id?: string | null
          rating?: number
          review_text?: string
          reviewer_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rider_deliveries: {
        Row: {
          assigned_at: string
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          order_id: string
          picked_up_at: string | null
          rider_id: string
          status: string | null
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          picked_up_at?: string | null
          rider_id: string
          status?: string | null
        }
        Update: {
          assigned_at?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          picked_up_at?: string | null
          rider_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rider_deliveries_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "delivery_riders"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          label: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          setting_key: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
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
      track_order: {
        Args: { order_id: string; phone_number: string }
        Returns: {
          created_at: string
          customer_name: string
          id: string
          items: Json
          status: string
          total_amount: number
        }[]
      }
      user_has_ordered: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "super_admin"
        | "content_manager"
        | "order_manager"
        | "support_agent"
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
      app_role: [
        "admin",
        "user",
        "super_admin",
        "content_manager",
        "order_manager",
        "support_agent",
      ],
    },
  },
} as const
