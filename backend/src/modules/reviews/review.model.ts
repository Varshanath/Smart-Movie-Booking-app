export interface Review {
  id: string;
  userId: string;
  movieId: string;
  rating: number;
  reviewText: string;
  createdAt: Date;
}

export interface CreateReviewInput {
  userId: string;
  movieId: string;
  rating: number;
  reviewText: string;
}
