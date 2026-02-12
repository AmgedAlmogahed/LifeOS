// ─── Life OS Database Types ──────────────────────────────────────────────────

export type ProjectStatus =
  | "Backlog"
  | "Understand"
  | "Document"
  | "Freeze"
  | "Implement"
  | "Verify";

export type TaskStatus = "Todo" | "In Progress" | "Done" | "Blocked";
export type TaskPriority = "Critical" | "High" | "Medium" | "Low";
export type AuditLevel = "Critical" | "Warning" | "Info";

// ─── Row Types ───────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  last_audit_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  level: AuditLevel;
  message: string;
  source: string;
  timestamp: string;
}

export interface SystemConfig {
  key: string;
  value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Insert Types ────────────────────────────────────────────────────────────

export type ProjectInsert = Omit<Project, "id" | "created_at" | "updated_at">;
export type TaskInsert = Omit<Task, "id" | "created_at" | "updated_at">;
export type AuditLogInsert = Omit<AuditLog, "id" | "timestamp">;
export type SystemConfigInsert = Omit<SystemConfig, "created_at" | "updated_at">;

// ─── Update Types ────────────────────────────────────────────────────────────

export type ProjectUpdate = Partial<Omit<Project, "id" | "created_at" | "updated_at">>;
export type TaskUpdate = Partial<Omit<Task, "id" | "created_at" | "updated_at">>;

// ─── Database Schema (for Supabase client typing) ────────────────────────────

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      tasks: {
        Row: Task;
        Insert: TaskInsert;
        Update: TaskUpdate;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: AuditLogInsert;
        Update: never;
      };
      system_config: {
        Row: SystemConfig;
        Insert: SystemConfigInsert;
        Update: Partial<SystemConfigInsert>;
      };
    };
  };
}
