export type Priority = "baixa" | "media" | "alta";
export type Difficulty = "facil" | "media" | "dificil";
export type StudyEvent = "completed" | "reviewed" | "reopened";

export interface Subject {
  id: string;
  name: string;
  tag: string;
  sort_order: number;
}

export interface Block {
  id: string;
  subject_id: string;
  name: string;
  sort_order: number;
}

export interface Topic {
  id: string;
  block_id: string;
  name: string;
  sort_order: number;
  completed: number;
  completed_at: string | null;
  priority: Priority;
  difficulty: Difficulty;
  notes: string;
  /** Conteúdo didático (currículo), distinto do resumo do aluno. */
  content: string;
  next_review_at: string | null;
  review_stage: number;
}

export interface StudyLogRow {
  id: number;
  topic_id: string | null;
  event: StudyEvent;
  created_at: string;
}

export interface SubjectProgress {
  subject: Subject;
  total: number;
  completed: number;
}

export interface WeeklyStat {
  week_start: string;
  count: number;
}

export interface TopicWithContext extends Topic {
  block_name: string;
  subject_id: string;
  subject_name: string;
  subject_tag: string;
}

export interface ProgressBackup {
  version: 1 | 2;
  exported_at: string;
  topics: Array<{
    id: string;
    completed: number;
    completed_at: string | null;
    priority: Priority;
    difficulty: Difficulty;
    notes: string;
    content?: string;
    next_review_at: string | null;
    review_stage: number;
  }>;
  study_log: Array<{
    topic_id: string | null;
    event: StudyEvent;
    created_at: string;
  }>;
}
