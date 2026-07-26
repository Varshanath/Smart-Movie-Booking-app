export interface Recommendation {
  id: string;
  userId: string;
  movieId: string;
  rank: number;
  reason: string;
  createdAt: Date;
}
