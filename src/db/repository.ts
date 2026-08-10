import {
  scheduleAfterComplete,
  scheduleAfterReview,
  scheduleDueNow,
  scheduleRestart,
} from "../lib/review";
import { slugify } from "../lib/slug";
import { getDb } from "./client";
import type {
  Block,
  Difficulty,
  Priority,
  ProgressBackup,
  Subject,
  SubjectProgress,
  Topic,
  TopicWithContext,
  WeeklyStat,
} from "./types";

async function logEvent(topicId: string, event: "completed" | "reviewed" | "reopened") {
  const db = await getDb();
  await db.execute(
    "INSERT INTO study_log (topic_id, event, created_at) VALUES ($1, $2, $3)",
    [topicId, event, new Date().toISOString()],
  );
}

async function idExists(table: "subjects" | "blocks" | "topics", id: string) {
  const db = await getDb();
  const rows = await db.select<{ n: number }[]>(
    `SELECT COUNT(*) as n FROM ${table} WHERE id = $1`,
    [id],
  );
  return (rows[0]?.n ?? 0) > 0;
}

async function uniqueId(
  table: "subjects" | "blocks" | "topics",
  base: string,
): Promise<string> {
  const root = base || "item";
  if (!(await idExists(table, root))) return root;
  let n = 2;
  while (await idExists(table, `${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

function defaultTag(name: string): string {
  const letters = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return (letters.slice(0, 3) || "NEW").slice(0, 8);
}

async function nextSortOrder(
  table: "subjects" | "blocks" | "topics",
  parentColumn?: "subject_id" | "block_id",
  parentId?: string,
): Promise<number> {
  const db = await getDb();
  if (parentColumn && parentId) {
    const rows = await db.select<{ m: number | null }[]>(
      `SELECT MAX(sort_order) as m FROM ${table} WHERE ${parentColumn} = $1`,
      [parentId],
    );
    return (rows[0]?.m ?? -1) + 1;
  }
  const rows = await db.select<{ m: number | null }[]>(
    `SELECT MAX(sort_order) as m FROM ${table}`,
  );
  return (rows[0]?.m ?? -1) + 1;
}

async function deleteStudyLogForTopics(topicIds: string[]) {
  if (topicIds.length === 0) return;
  const db = await getDb();
  const placeholders = topicIds.map((_, i) => `$${i + 1}`).join(", ");
  await db.execute(
    `DELETE FROM study_log WHERE topic_id IN (${placeholders})`,
    topicIds,
  );
}

export async function getSubjects(): Promise<Subject[]> {
  const db = await getDb();
  return db.select<Subject[]>(
    "SELECT * FROM subjects ORDER BY sort_order ASC",
  );
}

export async function getSubject(id: string): Promise<Subject | null> {
  const db = await getDb();
  const rows = await db.select<Subject[]>(
    "SELECT * FROM subjects WHERE id = $1",
    [id],
  );
  return rows[0] ?? null;
}

export async function getBlocksBySubject(subjectId: string): Promise<Block[]> {
  const db = await getDb();
  return db.select<Block[]>(
    "SELECT * FROM blocks WHERE subject_id = $1 ORDER BY sort_order ASC",
    [subjectId],
  );
}

export async function getTopicsByBlock(blockId: string): Promise<Topic[]> {
  const db = await getDb();
  return db.select<Topic[]>(
    "SELECT * FROM topics WHERE block_id = $1 ORDER BY sort_order ASC",
    [blockId],
  );
}

export async function getTopic(id: string): Promise<Topic | null> {
  const db = await getDb();
  const rows = await db.select<Topic[]>("SELECT * FROM topics WHERE id = $1", [
    id,
  ]);
  return rows[0] ?? null;
}

export async function getSubjectTree(subjectId: string) {
  const subject = await getSubject(subjectId);
  if (!subject) return null;
  const blocks = await getBlocksBySubject(subjectId);
  const withTopics = await Promise.all(
    blocks.map(async (block) => ({
      ...block,
      topics: await getTopicsByBlock(block.id),
    })),
  );
  return { subject, blocks: withTopics };
}

export async function createSubject(input: {
  name: string;
  tag?: string;
}): Promise<Subject> {
  const name = input.name.trim();
  if (!name) throw new Error("Nome da matéria é obrigatório");
  const db = await getDb();
  const id = await uniqueId("subjects", slugify(name));
  const tag = (input.tag?.trim() || defaultTag(name)).slice(0, 8);
  const sort_order = await nextSortOrder("subjects");
  await db.execute(
    "INSERT INTO subjects (id, name, tag, sort_order) VALUES ($1, $2, $3, $4)",
    [id, name, tag, sort_order],
  );
  return { id, name, tag, sort_order };
}

export async function updateSubject(
  id: string,
  input: { name: string; tag: string },
): Promise<void> {
  const name = input.name.trim();
  const tag = input.tag.trim().slice(0, 8);
  if (!name) throw new Error("Nome da matéria é obrigatório");
  if (!tag) throw new Error("Tag da matéria é obrigatória");
  const db = await getDb();
  await db.execute(
    "UPDATE subjects SET name = $1, tag = $2 WHERE id = $3",
    [name, tag, id],
  );
}

export async function deleteSubject(id: string): Promise<void> {
  const db = await getDb();
  const topicIds = (
    await db.select<{ id: string }[]>(
      `SELECT t.id FROM topics t
       JOIN blocks b ON b.id = t.block_id
       WHERE b.subject_id = $1`,
      [id],
    )
  ).map((r) => r.id);
  await deleteStudyLogForTopics(topicIds);
  await db.execute(
    `DELETE FROM topics WHERE block_id IN (
      SELECT id FROM blocks WHERE subject_id = $1
    )`,
    [id],
  );
  await db.execute("DELETE FROM blocks WHERE subject_id = $1", [id]);
  await db.execute("DELETE FROM subjects WHERE id = $1", [id]);
}

export async function createBlock(
  subjectId: string,
  name: string,
): Promise<Block> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nome do bloco é obrigatório");
  const db = await getDb();
  const id = await uniqueId(
    "blocks",
    `${subjectId}-${slugify(trimmed)}`,
  );
  const sort_order = await nextSortOrder("blocks", "subject_id", subjectId);
  await db.execute(
    "INSERT INTO blocks (id, subject_id, name, sort_order) VALUES ($1, $2, $3, $4)",
    [id, subjectId, trimmed, sort_order],
  );
  return { id, subject_id: subjectId, name: trimmed, sort_order };
}

export async function updateBlock(
  id: string,
  input: { name: string },
): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("Nome do bloco é obrigatório");
  const db = await getDb();
  await db.execute("UPDATE blocks SET name = $1 WHERE id = $2", [name, id]);
}

export async function deleteBlock(id: string): Promise<void> {
  const db = await getDb();
  const topicIds = (
    await db.select<{ id: string }[]>(
      "SELECT id FROM topics WHERE block_id = $1",
      [id],
    )
  ).map((r) => r.id);
  await deleteStudyLogForTopics(topicIds);
  await db.execute("DELETE FROM topics WHERE block_id = $1", [id]);
  await db.execute("DELETE FROM blocks WHERE id = $1", [id]);
}

export async function createTopic(
  blockId: string,
  name: string,
): Promise<Topic> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nome do tópico é obrigatório");
  const db = await getDb();
  const id = await uniqueId("topics", `${blockId}-${slugify(trimmed)}`);
  const sort_order = await nextSortOrder("topics", "block_id", blockId);
  await db.execute(
    `INSERT INTO topics (
      id, block_id, name, sort_order, completed, completed_at,
      priority, difficulty, notes, content, next_review_at, review_stage
    ) VALUES ($1, $2, $3, $4, 0, NULL, 'media', 'media', '', '', NULL, 0)`,
    [id, blockId, trimmed, sort_order],
  );
  return {
    id,
    block_id: blockId,
    name: trimmed,
    sort_order,
    completed: 0,
    completed_at: null,
    priority: "media",
    difficulty: "media",
    notes: "",
    content: "",
    next_review_at: null,
    review_stage: 0,
  };
}

export async function updateTopicName(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nome do tópico é obrigatório");
  const db = await getDb();
  await db.execute("UPDATE topics SET name = $1 WHERE id = $2", [
    trimmed,
    id,
  ]);
}

export async function deleteTopic(id: string): Promise<void> {
  const db = await getDb();
  await deleteStudyLogForTopics([id]);
  await db.execute("DELETE FROM topics WHERE id = $1", [id]);
}

export async function getOverallProgress(): Promise<{
  total: number;
  completed: number;
}> {
  const db = await getDb();
  const rows = await db.select<{ total: number; completed: number }[]>(
    `SELECT
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as completed
     FROM topics`,
  );
  return rows[0] ?? { total: 0, completed: 0 };
}

export async function getProgressBySubject(): Promise<SubjectProgress[]> {
  const db = await getDb();
  const subjects = await getSubjects();
  const stats = await db.select<
    { subject_id: string; total: number; completed: number }[]
  >(
    `SELECT
      b.subject_id as subject_id,
      COUNT(t.id) as total,
      COALESCE(SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END), 0) as completed
     FROM blocks b
     LEFT JOIN topics t ON t.block_id = b.id
     GROUP BY b.subject_id`,
  );
  const map = new Map(stats.map((s) => [s.subject_id, s]));
  return subjects.map((subject) => {
    const s = map.get(subject.id);
    return {
      subject,
      total: s?.total ?? 0,
      completed: s?.completed ?? 0,
    };
  });
}

export async function getDueReviews(now = new Date()): Promise<TopicWithContext[]> {
  const db = await getDb();
  return db.select<TopicWithContext[]>(
    `SELECT
      t.*,
      b.name as block_name,
      s.id as subject_id,
      s.name as subject_name,
      s.tag as subject_tag
     FROM topics t
     JOIN blocks b ON b.id = t.block_id
     JOIN subjects s ON s.id = b.subject_id
     WHERE t.completed = 1
       AND t.next_review_at IS NOT NULL
       AND t.next_review_at <= $1
     ORDER BY t.next_review_at ASC`,
    [now.toISOString()],
  );
}

export async function getWeeklyCompletions(weeks = 8): Promise<WeeklyStat[]> {
  const db = await getDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (weeks - 1) * 7 - start.getDay());

  const rows = await db.select<{ created_at: string }[]>(
    `SELECT created_at FROM study_log
     WHERE event = 'completed' AND created_at >= $1`,
    [start.toISOString()],
  );

  const buckets = new Map<string, number>();
  for (let i = 0; i < weeks; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i * 7);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of rows) {
    const date = new Date(row.created_at);
    const weekStart = new Date(date);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return [...buckets.entries()].map(([week_start, count]) => ({
    week_start,
    count,
  }));
}

export async function setTopicCompleted(topicId: string, completed: boolean) {
  const db = await getDb();
  const now = new Date();
  if (completed) {
    const schedule = scheduleAfterComplete(now);
    await db.execute(
      `UPDATE topics SET
        completed = 1,
        completed_at = $1,
        next_review_at = $2,
        review_stage = $3
       WHERE id = $4`,
      [now.toISOString(), schedule.next_review_at, schedule.review_stage, topicId],
    );
    await logEvent(topicId, "completed");
  } else {
    await db.execute(
      `UPDATE topics SET
        completed = 0,
        completed_at = NULL,
        next_review_at = NULL,
        review_stage = 0
       WHERE id = $1`,
      [topicId],
    );
    await logEvent(topicId, "reopened");
  }
}

export async function confirmReview(topicId: string) {
  const topic = await getTopic(topicId);
  if (!topic) return;
  const schedule = scheduleAfterReview(topic.review_stage);
  const db = await getDb();
  await db.execute(
    `UPDATE topics SET next_review_at = $1, review_stage = $2 WHERE id = $3`,
    [schedule.next_review_at, schedule.review_stage, topicId],
  );
  await logEvent(topicId, "reviewed");
}

export async function restartReview(topicId: string) {
  const schedule = scheduleRestart();
  const db = await getDb();
  await db.execute(
    `UPDATE topics SET next_review_at = $1, review_stage = $2 WHERE id = $3`,
    [schedule.next_review_at, schedule.review_stage, topicId],
  );
  await logEvent(topicId, "reviewed");
}

/** Put a completed topic into the pending-review queue immediately. */
export async function forceReviewNow(topicId: string) {
  const topic = await getTopic(topicId);
  if (!topic || topic.completed !== 1) return;
  const schedule = scheduleDueNow(topic.review_stage);
  const db = await getDb();
  await db.execute(
    `UPDATE topics SET next_review_at = $1, review_stage = $2 WHERE id = $3`,
    [schedule.next_review_at, schedule.review_stage, topicId],
  );
}

/** Put selected completed topics into the pending-review queue. */
export async function forceReviewsNow(topicIds: string[]) {
  for (const id of topicIds) {
    await forceReviewNow(id);
  }
}

export async function updateTopicPriority(topicId: string, priority: Priority) {
  const db = await getDb();
  await db.execute("UPDATE topics SET priority = $1 WHERE id = $2", [
    priority,
    topicId,
  ]);
}

export async function updateTopicDifficulty(
  topicId: string,
  difficulty: Difficulty,
) {
  const db = await getDb();
  await db.execute("UPDATE topics SET difficulty = $1 WHERE id = $2", [
    difficulty,
    topicId,
  ]);
}

export async function updateTopicNotes(topicId: string, notes: string) {
  const db = await getDb();
  await db.execute("UPDATE topics SET notes = $1 WHERE id = $2", [
    notes,
    topicId,
  ]);
}

export async function updateTopicContent(topicId: string, content: string) {
  const db = await getDb();
  await db.execute("UPDATE topics SET content = $1 WHERE id = $2", [
    content,
    topicId,
  ]);
}

function localDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayLocalKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftLocalDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return todayLocalKey(dt);
}

/** Contagem de eventos completed/reviewed no dia local atual. */
export async function getTodayStudyCount(now = new Date()): Promise<number> {
  const db = await getDb();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const rows = await db.select<{ n: number }[]>(
    `SELECT COUNT(*) as n FROM study_log
     WHERE event IN ('completed', 'reviewed')
       AND created_at >= $1 AND created_at < $2`,
    [start.toISOString(), end.toISOString()],
  );
  return rows[0]?.n ?? 0;
}

/**
 * Dias locais consecutivos com ≥1 completed/reviewed, contando de hoje
 * (ou de ontem se hoje ainda não teve atividade).
 */
export async function getStudyStreak(now = new Date()): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ created_at: string }[]>(
    `SELECT created_at FROM study_log
     WHERE event IN ('completed', 'reviewed')
     ORDER BY created_at DESC`,
  );
  if (rows.length === 0) return 0;

  const activeDays = new Set(rows.map((r) => localDateKey(r.created_at)));
  let cursor = todayLocalKey(now);
  if (!activeDays.has(cursor)) {
    cursor = shiftLocalDateKey(cursor, -1);
    if (!activeDays.has(cursor)) return 0;
  }

  let streak = 0;
  while (activeDays.has(cursor)) {
    streak += 1;
    cursor = shiftLocalDateKey(cursor, -1);
  }
  return streak;
}

export async function listNotes(query?: string): Promise<TopicWithContext[]> {
  const db = await getDb();
  const trimmed = query?.trim() ?? "";
  if (!trimmed) {
    return db.select<TopicWithContext[]>(
      `SELECT
        t.*,
        b.name as block_name,
        s.id as subject_id,
        s.name as subject_name,
        s.tag as subject_tag
       FROM topics t
       JOIN blocks b ON b.id = t.block_id
       JOIN subjects s ON s.id = b.subject_id
       WHERE t.notes IS NOT NULL
         AND TRIM(t.notes) != ''
       ORDER BY s.sort_order, b.sort_order, t.sort_order`,
    );
  }
  const q = `%${trimmed}%`;
  return db.select<TopicWithContext[]>(
    `SELECT
      t.*,
      b.name as block_name,
      s.id as subject_id,
      s.name as subject_name,
      s.tag as subject_tag
     FROM topics t
     JOIN blocks b ON b.id = t.block_id
     JOIN subjects s ON s.id = b.subject_id
     WHERE t.notes IS NOT NULL
       AND TRIM(t.notes) != ''
       AND (t.notes LIKE $1 OR t.name LIKE $1 OR b.name LIKE $1 OR s.name LIKE $1)
     ORDER BY s.sort_order, b.sort_order, t.sort_order`,
    [q],
  );
}

/** @deprecated Prefer listNotes — kept as thin alias for callers. */
export async function searchNotes(query: string): Promise<TopicWithContext[]> {
  return listNotes(query);
}

export async function exportProgress(): Promise<ProgressBackup> {
  const db = await getDb();
  const topics = await db.select<ProgressBackup["topics"]>(
    `SELECT id, completed, completed_at, priority, difficulty, notes, content,
            next_review_at, review_stage
     FROM topics`,
  );
  const study_log = await db.select<ProgressBackup["study_log"]>(
    `SELECT topic_id, event, created_at FROM study_log ORDER BY id ASC`,
  );
  return {
    version: 2,
    exported_at: new Date().toISOString(),
    topics,
    study_log,
  };
}

export async function importProgress(backup: ProgressBackup) {
  const db = await getDb();
  await db.execute("DELETE FROM study_log");
  for (const t of backup.topics) {
    if (backup.version >= 2 && t.content !== undefined) {
      await db.execute(
        `UPDATE topics SET
          completed = $1,
          completed_at = $2,
          priority = $3,
          difficulty = $4,
          notes = $5,
          content = $6,
          next_review_at = $7,
          review_stage = $8
         WHERE id = $9`,
        [
          t.completed,
          t.completed_at,
          t.priority,
          t.difficulty,
          t.notes ?? "",
          t.content ?? "",
          t.next_review_at,
          t.review_stage ?? 0,
          t.id,
        ],
      );
    } else {
      await db.execute(
        `UPDATE topics SET
          completed = $1,
          completed_at = $2,
          priority = $3,
          difficulty = $4,
          notes = $5,
          next_review_at = $6,
          review_stage = $7
         WHERE id = $8`,
        [
          t.completed,
          t.completed_at,
          t.priority,
          t.difficulty,
          t.notes ?? "",
          t.next_review_at,
          t.review_stage ?? 0,
          t.id,
        ],
      );
    }
  }
  for (const row of backup.study_log) {
    await db.execute(
      "INSERT INTO study_log (topic_id, event, created_at) VALUES ($1, $2, $3)",
      [row.topic_id, row.event, row.created_at],
    );
  }
}

export async function resetProgress() {
  const db = await getDb();
  await db.execute("DELETE FROM study_log");
  await db.execute(
    `UPDATE topics SET
      completed = 0,
      completed_at = NULL,
      priority = 'media',
      difficulty = 'media',
      notes = '',
      next_review_at = NULL,
      review_stage = 0`,
  );
}
