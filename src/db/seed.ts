import { slugify } from "../lib/slug";
import { getDb } from "./client";
import {
  SEED_SUBJECTS,
  seedTopicContent,
  seedTopicName,
} from "./seed-data";

export async function seedIfEmpty(): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM subjects",
  );
  if ((rows[0]?.count ?? 0) > 0) {
    return false;
  }

  for (const [si, subject] of SEED_SUBJECTS.entries()) {
    await db.execute(
      "INSERT INTO subjects (id, name, tag, sort_order) VALUES ($1, $2, $3, $4)",
      [subject.id, subject.name, subject.tag, si],
    );

    for (const [bi, block] of subject.blocks.entries()) {
      const blockId = `${subject.id}-${slugify(block.name)}`;
      await db.execute(
        "INSERT INTO blocks (id, subject_id, name, sort_order) VALUES ($1, $2, $3, $4)",
        [blockId, subject.id, block.name, bi],
      );

      for (const [ti, topic] of block.topics.entries()) {
        const topicName = seedTopicName(topic);
        const content = seedTopicContent(topic);
        const topicId = `${blockId}-${slugify(topicName)}`;
        await db.execute(
          `INSERT INTO topics (
            id, block_id, name, sort_order, completed, completed_at,
            priority, difficulty, notes, content, next_review_at, review_stage
          ) VALUES ($1, $2, $3, $4, 0, NULL, 'media', 'media', '', $5, NULL, 0)`,
          [topicId, blockId, topicName, ti, content],
        );
      }
    }
  }

  return true;
}
