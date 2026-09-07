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
      application_status_history: {
        Row: {
          application_id: string
          created_at: string
          id: string
          note: string | null
          status: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          note?: string | null
          status: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          created_at: string
          id: string
          job_id: string
          match_score: number
          note: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          match_score?: number
          note?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          match_score?: number
          note?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          assessment_id: string
          correct_count: number
          created_at: string
          id: string
          level: string
          recommendation: string | null
          score: number
          strong_areas: string[]
          student_id: string
          time_taken_seconds: number
          total_questions: number
          weak_areas: string[]
        }
        Insert: {
          assessment_id: string
          correct_count?: number
          created_at?: string
          id?: string
          level?: string
          recommendation?: string | null
          score?: number
          strong_areas?: string[]
          student_id: string
          time_taken_seconds?: number
          total_questions?: number
          weak_areas?: string[]
        }
        Update: {
          assessment_id?: string
          correct_count?: number
          created_at?: string
          id?: string
          level?: string
          recommendation?: string | null
          score?: number
          strong_areas?: string[]
          student_id?: string
          time_taken_seconds?: number
          total_questions?: number
          weak_areas?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          correct_index: number
          id: string
          options: Json
          position: number
          question: string
          question_type: string
          topic: string
        }
        Insert: {
          assessment_id: string
          correct_index: number
          id?: string
          options: Json
          position?: number
          question: string
          question_type?: string
          topic?: string
        }
        Update: {
          assessment_id?: string
          correct_index?: number
          id?: string
          options?: Json
          position?: number
          question?: string
          question_type?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          category: string
          created_at: string
          description: string
          duration_minutes: number
          id: string
          skill_id: string | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          skill_id?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          skill_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          created_at: string
          credential_url: string | null
          file_url: string | null
          id: string
          issued_on: string | null
          issuer: string
          name: string
          student_id: string
        }
        Insert: {
          created_at?: string
          credential_url?: string | null
          file_url?: string | null
          id?: string
          issued_on?: string | null
          issuer?: string
          name: string
          student_id: string
        }
        Update: {
          created_at?: string
          credential_url?: string | null
          file_url?: string | null
          id?: string
          issued_on?: string | null
          issuer?: string
          name?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          contact_person: string | null
          created_at: string
          id: string
          institution_type: string
          is_demo: boolean
          location: string
          name: string
          official_email: string | null
          owner_id: string | null
          website: string | null
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          id?: string
          institution_type?: string
          is_demo?: boolean
          location?: string
          name: string
          official_email?: string | null
          owner_id?: string | null
          website?: string | null
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          id?: string
          institution_type?: string
          is_demo?: boolean
          location?: string
          name?: string
          official_email?: string | null
          owner_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          about: string | null
          company_size: string
          created_at: string
          id: string
          is_demo: boolean
          location: string
          name: string
          owner_id: string | null
          recruiter_email: string | null
          recruiter_name: string | null
          sector: string
          website: string | null
        }
        Insert: {
          about?: string | null
          company_size?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          location?: string
          name: string
          owner_id?: string | null
          recruiter_email?: string | null
          recruiter_name?: string | null
          sector?: string
          website?: string | null
        }
        Update: {
          about?: string | null
          company_size?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          location?: string
          name?: string
          owner_id?: string | null
          recruiter_email?: string | null
          recruiter_name?: string | null
          sector?: string
          website?: string | null
        }
        Relationships: []
      }
      job_postings: {
        Row: {
          company_id: string
          created_at: string
          deadline: string | null
          description: string
          duration: string | null
          experience: string | null
          graduation_year: number | null
          id: string
          is_demo: boolean
          location: string
          min_qualification: string | null
          openings: number
          opportunity_type: string
          salary: string | null
          status: string
          stipend: string | null
          title: string
          updated_at: string
          work_mode: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deadline?: string | null
          description?: string
          duration?: string | null
          experience?: string | null
          graduation_year?: number | null
          id?: string
          is_demo?: boolean
          location?: string
          min_qualification?: string | null
          openings?: number
          opportunity_type?: string
          salary?: string | null
          status?: string
          stipend?: string | null
          title: string
          updated_at?: string
          work_mode?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deadline?: string | null
          description?: string
          duration?: string | null
          experience?: string | null
          graduation_year?: number | null
          id?: string
          is_demo?: boolean
          location?: string
          min_qualification?: string | null
          openings?: number
          opportunity_type?: string
          salary?: string | null
          status?: string
          stipend?: string | null
          title?: string
          updated_at?: string
          work_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_skills: {
        Row: {
          is_required: boolean
          job_id: string
          skill_id: string
        }
        Insert: {
          is_required?: boolean
          job_id: string
          skill_id: string
        }
        Update: {
          is_required?: boolean
          job_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      placement_drives: {
        Row: {
          applied_count: number
          college_id: string
          company_id: string | null
          created_at: string
          drive_date: string | null
          eligible_count: number
          id: string
          role_title: string
          selected_count: number
          shortlisted_count: number
          status: string
        }
        Insert: {
          applied_count?: number
          college_id: string
          company_id?: string | null
          created_at?: string
          drive_date?: string | null
          eligible_count?: number
          id?: string
          role_title: string
          selected_count?: number
          shortlisted_count?: number
          status?: string
        }
        Update: {
          applied_count?: number
          college_id?: string
          company_id?: string | null
          created_at?: string
          drive_date?: string | null
          eligible_count?: number
          id?: string
          role_title?: string
          selected_count?: number
          shortlisted_count?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_drives_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_drives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_skills: {
        Row: {
          project_id: string
          skill_id: string
        }
        Insert: {
          project_id: string
          skill_id: string
        }
        Update: {
          project_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_skills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          demo_url: string | null
          description: string
          duration: string | null
          github_url: string | null
          id: string
          role: string | null
          student_id: string
          technologies: string[]
          title: string
        }
        Insert: {
          created_at?: string
          demo_url?: string | null
          description?: string
          duration?: string | null
          github_url?: string | null
          id?: string
          role?: string | null
          student_id: string
          technologies?: string[]
          title: string
        }
        Update: {
          created_at?: string
          demo_url?: string | null
          description?: string
          duration?: string | null
          github_url?: string | null
          id?: string
          role?: string | null
          student_id?: string
          technologies?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      role_templates: {
        Row: {
          description: string
          id: string
          preferred_skills: string[]
          required_skills: string[]
          title: string
        }
        Insert: {
          description?: string
          id?: string
          preferred_skills?: string[]
          required_skills?: string[]
          title: string
        }
        Update: {
          description?: string
          id?: string
          preferred_skills?: string[]
          required_skills?: string[]
          title?: string
        }
        Relationships: []
      }
      skill_demand: {
        Row: {
          demand_score: number
          id: string
          industry: string
          location: string
          openings: number
          period: string
          skill_id: string
        }
        Insert: {
          demand_score?: number
          id?: string
          industry?: string
          location?: string
          openings?: number
          period?: string
          skill_id: string
        }
        Update: {
          demand_score?: number
          id?: string
          industry?: string
          location?: string
          openings?: number
          period?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_demand_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string
          created_at: string
          demand_level: string
          demand_score: number
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          demand_level?: string
          demand_score?: number
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          demand_level?: string
          demand_score?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      student_skills: {
        Row: {
          assessment_score: number | null
          created_at: string
          id: string
          last_verified_at: string | null
          proficiency: string
          proficiency_score: number
          skill_id: string
          student_id: string
          verification_source: string | null
          verified: boolean
        }
        Insert: {
          assessment_score?: number | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          proficiency?: string
          proficiency_score?: number
          skill_id: string
          student_id: string
          verification_source?: string | null
          verified?: boolean
        }
        Update: {
          assessment_score?: number | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          proficiency?: string
          proficiency_score?: number
          skill_id?: string
          student_id?: string
          verification_source?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "student_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          bio: string | null
          certifications_score: number
          college_id: string | null
          created_at: string
          degree: string
          department: string
          email: string
          exposure_score: number
          full_name: string
          graduation_year: number
          headline: string | null
          id: string
          interests: string[]
          is_demo: boolean
          location: string
          phone: string | null
          projects_score: number
          readiness_score: number
          resume_url: string | null
          soft_skills_score: number
          target_role: string
          technical_score: number
          updated_at: string
          user_id: string | null
          year: number
        }
        Insert: {
          bio?: string | null
          certifications_score?: number
          college_id?: string | null
          created_at?: string
          degree?: string
          department?: string
          email?: string
          exposure_score?: number
          full_name: string
          graduation_year?: number
          headline?: string | null
          id?: string
          interests?: string[]
          is_demo?: boolean
          location?: string
          phone?: string | null
          projects_score?: number
          readiness_score?: number
          resume_url?: string | null
          soft_skills_score?: number
          target_role?: string
          technical_score?: number
          updated_at?: string
          user_id?: string | null
          year?: number
        }
        Update: {
          bio?: string | null
          certifications_score?: number
          college_id?: string | null
          created_at?: string
          degree?: string
          department?: string
          email?: string
          exposure_score?: number
          full_name?: string
          graduation_year?: number
          headline?: string | null
          id?: string
          interests?: string[]
          is_demo?: boolean
          location?: string
          phone?: string | null
          projects_score?: number
          readiness_score?: number
          resume_url?: string | null
          soft_skills_score?: number
          target_role?: string
          technical_score?: number
          updated_at?: string
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "students_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      training_enrollments: {
        Row: {
          created_at: string
          id: string
          program_id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_id: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          program_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          college_id: string
          created_at: string
          description: string
          duration_weeks: number
          eligibility: string
          id: string
          starts_on: string | null
          status: string
          target_skill_id: string | null
          title: string
        }
        Insert: {
          college_id: string
          created_at?: string
          description?: string
          duration_weeks?: number
          eligibility?: string
          id?: string
          starts_on?: string | null
          status?: string
          target_skill_id?: string | null
          title: string
        }
        Update: {
          college_id?: string
          created_at?: string
          description?: string
          duration_weeks?: number
          eligibility?: string
          id?: string
          starts_on?: string | null
          status?: string
          target_skill_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_programs_target_skill_id_fkey"
            columns: ["target_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
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
      is_admin: { Args: never; Returns: boolean }
      my_student_id: { Args: never; Returns: string }
      owns_college: { Args: { _college_id: string }; Returns: boolean }
      owns_company: { Args: { _company_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "college" | "industry" | "admin"
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
    Enums: {
      app_role: ["student", "college", "industry", "admin"],
    },
  },
} as const
