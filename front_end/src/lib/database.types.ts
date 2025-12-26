export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      materials: {
        Row: {
          id: string;
          type: 'book' | 'video' | 'custom';
          title: string;
          description: string | null;
          color: string | null;
          total_pages: number | null;
          current_page: number | null;
          pages_per_day: number | null;
          sections: Json | null;
          total_duration: number | null;
          current_progress: number | null;
          sections_per_day: number | null;
          tasks: Json | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'book' | 'video' | 'custom';
          title: string;
          description?: string | null;
          color?: string | null;
          total_pages?: number | null;
          current_page?: number | null;
          pages_per_day?: number | null;
          sections?: Json | null;
          total_duration?: number | null;
          current_progress?: number | null;
          sections_per_day?: number | null;
          tasks?: Json | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'book' | 'video' | 'custom';
          title?: string;
          description?: string | null;
          color?: string | null;
          total_pages?: number | null;
          current_page?: number | null;
          pages_per_day?: number | null;
          sections?: Json | null;
          total_duration?: number | null;
          current_progress?: number | null;
          sections_per_day?: number | null;
          tasks?: Json | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      completed_tasks: {
        Row: {
          id: string;
          material_id: string;
          task_date: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          task_date: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          task_date?: string;
          completed_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          reminder_enabled: boolean;
          reminder_time: string;
          reminder_days: number[];
          updated_at: string;
        };
        Insert: {
          id?: string;
          reminder_enabled?: boolean;
          reminder_time?: string;
          reminder_days?: number[];
          updated_at?: string;
        };
        Update: {
          id?: string;
          reminder_enabled?: boolean;
          reminder_time?: string;
          reminder_days?: number[];
          updated_at?: string;
        };
      };
    };
  };
}
