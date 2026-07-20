export interface Movie {
  id: string;
  title: string;
  genre: string;
  language: string;
  durationMinutes: number;
  releaseDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMovieInput {
  title: string;
  genre: string;
  language: string;
  durationMinutes: number;
  releaseDate: string;
}
