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
