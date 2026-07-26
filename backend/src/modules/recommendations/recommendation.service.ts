import { listRecommendations } from "./recommendation.repository";

export function getRecommendations(userId: string) {
  return listRecommendations(userId);
}
