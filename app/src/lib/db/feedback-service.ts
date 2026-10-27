import 'server-only';
import { randomUUID } from 'crypto';
import { getPool } from '@/lib/db/pool';

export async function insertFeedback(answers: Record<string, string>, userUuid: string | null): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO feedback (response_id, question, answer, user_id)
     SELECT $1::uuid, a.question, a.answer, (SELECT id FROM users WHERE uuid = $4)
     FROM unnest($2::text[], $3::text[]) AS a(question, answer)`,
    [randomUUID(), Object.keys(answers), Object.values(answers), userUuid]
  );
}

export type FeedbackResponse = {
  id: string;
  createdAt: string;
  email: string | null;
  answers: Record<string, string>;
};

export async function listFeedback(): Promise<FeedbackResponse[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT f.response_id AS id, max(f.created_at) AS created_at, u.email, jsonb_object_agg(f.question, f.answer) AS answers
     FROM feedback f
     LEFT JOIN users u ON u.id = f.user_id
     GROUP BY f.response_id, u.email
     ORDER BY created_at DESC`
  );
  return result.rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at.toISOString(),
    email: row.email,
    answers: row.answers,
  }));
}
