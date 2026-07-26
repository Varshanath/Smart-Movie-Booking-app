import { isPostgresEnabled, pool } from "../../database/postgres";
import { Recommendation } from "./recommendation.model";

const recommendations = new Map<string, Recommendation>();

const SELECT_COLUMNS = `
  id,
  user_id AS "userId",
  movie_id AS "movieId",
  rank,
  reason,
  created_at AS "createdAt"
`;

export async function listRecommendations(userId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM recommendations WHERE user_id = $1 ORDER BY rank ASC`,
      [userId],
    );
    return result.rows as Recommendation[];
  }
  return Array.from(recommendations.values())
    .filter((recommendation) => recommendation.userId === userId)
    .sort((a, b) => a.rank - b.rank);
}

export async function clearRecommendationsForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM recommendations");
    return;
  }
  recommendations.clear();
}
