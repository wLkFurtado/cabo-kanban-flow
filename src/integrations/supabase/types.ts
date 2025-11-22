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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      board_lists: {
        Row: {
          board_id: string
          color: string | null
          created_at: string | null
          id: string
          position: number
          title: string
          updated_at: string | null
        }
        Insert: {
          board_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          position: number
          title: string
          updated_at?: string | null
        }
        Update: {
          board_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          position?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_lists_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_members: {
        Row: {
          board_id: string
          created_at: string | null
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string | null
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_members_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          owner_id: string
          title: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["board_visibility"] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          owner_id: string
          title: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["board_visibility"] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["board_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "boards_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_comments: {
        Row: {
          card_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_custom_values: {
        Row: {
          card_id: string
          created_at: string | null
          custom_field_id: string
          id: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          card_id: string
          created_at?: string | null
          custom_field_id: string
          id?: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          card_id?: string
          created_at?: string | null
          custom_field_id?: string
          id?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "card_custom_values_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_custom_values_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      card_labels: {
        Row: {
          card_id: string
          color: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          card_id: string
          color: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          card_id?: string
          color?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_labels_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_members: {
        Row: {
          card_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_members_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          completed: boolean | null
          cover_color: string | null
          cover_images: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          list_id: string
          position: number
          priority: Database["public"]["Enums"]["card_priority"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          cover_color?: string | null
          cover_images?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          list_id: string
          position: number
          priority?: Database["public"]["Enums"]["card_priority"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          cover_color?: string | null
          cover_images?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          list_id?: string
          position?: number
          priority?: Database["public"]["Enums"]["card_priority"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "board_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          board_id: string
          created_at: string | null
          field_type: string
          id: string
          name: string
          options: Json | null
          position: number
          required: boolean | null
        }
        Insert: {
          board_id: string
          created_at?: string | null
          field_type: string
          id?: string
          name: string
          options?: Json | null
          position: number
          required?: boolean | null
        }
        Update: {
          board_id?: string
          created_at?: string | null
          field_type?: string
          id?: string
          name?: string
          options?: Json | null
          position?: number
          required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          response: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          response?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string
          id: string
          location: string | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date: string
          id?: string
          location?: string | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          location?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      institutional_contacts: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          instituicao: string
          responsavel: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          instituicao: string
          responsavel: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          instituicao?: string
          responsavel?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institutional_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          address: string
          age: string
          birth_date: string
          cnh_category: string | null
          course_certificates_url: string | null
          cpf: string
          created_at: string
          curriculum_url: string | null
          document_urls: string[] | null
          education: string
          email: string
          expected_salary: string | null
          full_name: string
          gender: string
          has_cnh: string
          has_transport: string
          holidays_available: string
          id: string
          marital_status: string
          nationality: string
          phone: string
          positions: string[]
          proof_of_residence_url: string | null
          relevant_courses: string | null
          rg: string
          rg_document_url: string | null
          saturday_afternoon: boolean | null
          saturday_morning: boolean | null
          saturday_night: boolean | null
          sunday_afternoon: boolean | null
          sunday_morning: boolean | null
          sunday_night: boolean | null
          webhook_sent: boolean | null
          webhook_sent_at: string | null
          weekday_afternoon: boolean | null
          weekday_morning: boolean | null
          weekday_night: boolean | null
        }
        Insert: {
          address: string
          age: string
          birth_date: string
          cnh_category?: string | null
          course_certificates_url?: string | null
          cpf: string
          created_at?: string
          curriculum_url?: string | null
          document_urls?: string[] | null
          education: string
          email: string
          expected_salary?: string | null
          full_name: string
          gender: string
          has_cnh: string
          has_transport: string
          holidays_available: string
          id?: string
          marital_status: string
          nationality: string
          phone: string
          positions: string[]
          proof_of_residence_url?: string | null
          relevant_courses?: string | null
          rg: string
          rg_document_url?: string | null
          saturday_afternoon?: boolean | null
          saturday_morning?: boolean | null
          saturday_night?: boolean | null
          sunday_afternoon?: boolean | null
          sunday_morning?: boolean | null
          sunday_night?: boolean | null
          webhook_sent?: boolean | null
          webhook_sent_at?: string | null
          weekday_afternoon?: boolean | null
          weekday_morning?: boolean | null
          weekday_night?: boolean | null
        }
        Update: {
          address?: string
          age?: string
          birth_date?: string
          cnh_category?: string | null
          course_certificates_url?: string | null
          cpf?: string
          created_at?: string
          curriculum_url?: string | null
          document_urls?: string[] | null
          education?: string
          email?: string
          expected_salary?: string | null
          full_name?: string
          gender?: string
          has_cnh?: string
          has_transport?: string
          holidays_available?: string
          id?: string
          marital_status?: string
          nationality?: string
          phone?: string
          positions?: string[]
          proof_of_residence_url?: string | null
          relevant_courses?: string | null
          rg?: string
          rg_document_url?: string | null
          saturday_afternoon?: boolean | null
          saturday_morning?: boolean | null
          saturday_night?: boolean | null
          sunday_afternoon?: boolean | null
          sunday_morning?: boolean | null
          sunday_night?: boolean | null
          webhook_sent?: boolean | null
          webhook_sent_at?: string | null
          weekday_afternoon?: boolean | null
          weekday_morning?: boolean | null
          weekday_night?: boolean | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_chat_histories_malu: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      pautas_events: {
        Row: {
          cor: string | null
          created_at: string | null
          criado_por: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          local: string | null
          prioridade: Database["public"]["Enums"]["event_priority"] | null
          recorrencia: Database["public"]["Enums"]["event_recurrence"] | null
          responsavel_id: string | null
          source_event_id: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          tipo: Database["public"]["Enums"]["event_type"]
          titulo: string
          updated_at: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          criado_por: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          local?: string | null
          prioridade?: Database["public"]["Enums"]["event_priority"] | null
          recorrencia?: Database["public"]["Enums"]["event_recurrence"] | null
          responsavel_id?: string | null
          source_event_id?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          tipo: Database["public"]["Enums"]["event_type"]
          titulo: string
          updated_at?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          criado_por?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          local?: string | null
          prioridade?: Database["public"]["Enums"]["event_priority"] | null
          recorrencia?: Database["public"]["Enums"]["event_recurrence"] | null
          responsavel_id?: string | null
          source_event_id?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          tipo?: Database["public"]["Enums"]["event_type"]
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pautas_events_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pautas_events_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pautas_events_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      pautas_participants: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pautas_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "pautas_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pautas_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          date: string
          email: string
          guests: number
          id: string
          name: string
          periodo: string
          phone: string
          special_requests: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          date: string
          email: string
          guests: number
          id?: string
          name: string
          periodo: string
          phone: string
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          email?: string
          guests?: number
          id?: string
          name?: string
          periodo?: string
          phone?: string
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      roadmap_suggestions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_votes: {
        Row: {
          created_at: string | null
          suggestion_id: string
          user_id: string
          vote: number
        }
        Insert: {
          created_at?: string | null
          suggestion_id: string
          user_id: string
          vote?: number
        }
        Update: {
          created_at?: string | null
          suggestion_id?: string
          user_id?: string
          vote?: number
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "roadmap_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          scopes: string[]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          scopes?: string[]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          scopes?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_board_safe: {
        Args: {
          board_description?: string
          board_owner_id?: string
          board_title: string
          board_visibility?: Database["public"]["Enums"]["board_visibility"]
        }
        Returns: {
          created_at: string
          description: string
          id: string
          owner_id: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["board_visibility"]
        }[]
      }
      event_is_accessible: { Args: { _event_id: string }; Returns: boolean }
      get_card_board_id: { Args: { p_card_id: string }; Returns: string }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_reservations_status: {
        Args: { target_date: string }
        Returns: {
          capacity: number
          reservation_date: string
          reservations_count: number
          seats_booked: number
          seats_remaining: number
        }[]
      }
      has_scope: { Args: { scope: string }; Returns: boolean }
      is_board_member: {
        Args: { p_board_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_participant: {
        Args: { _event: string; _user: string }
        Returns: boolean
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_julia:
        | {
            Args: {
              filter?: Json
              match_count?: number
              query_embedding: string
            }
            Returns: {
              content: string
              id: number
              metadata: Json
              similarity: number
            }[]
          }
        | {
            Args: {
              match_threshold?: number
              max_limit?: number
              query_embedding: string
            }
            Returns: {
              content: string
              id: number
              metadata: Json
              similarity: number
            }[]
          }
      match_documentsmalu: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      user_has_board_access: { Args: { board_uuid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "guest"
      board_visibility: "private" | "team" | "public"
      card_priority: "low" | "medium" | "high"
      event_priority: "baixa" | "media" | "alta"
      event_recurrence: "nenhuma" | "diaria" | "semanal" | "mensal"
      event_status: "pendente" | "em_andamento" | "concluido" | "cancelado"
      event_type: "reuniao" | "tarefa" | "escala" | "evento"
      lead_status: "aguardando" | "entrou"
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
      app_role: ["admin", "user", "guest"],
      board_visibility: ["private", "team", "public"],
      card_priority: ["low", "medium", "high"],
      event_priority: ["baixa", "media", "alta"],
      event_recurrence: ["nenhuma", "diaria", "semanal", "mensal"],
      event_status: ["pendente", "em_andamento", "concluido", "cancelado"],
      event_type: ["reuniao", "tarefa", "escala", "evento"],
      lead_status: ["aguardando", "entrou"],
    },
  },
} as const
