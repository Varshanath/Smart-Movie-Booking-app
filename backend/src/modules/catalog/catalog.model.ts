export interface NamedEntity {
  id: string;
  name: string;
}

export interface MovieGenreLink {
  movieId: string;
  genreId: string;
}

export interface MovieCastLink {
  movieId: string;
  actorId: string;
  roleName?: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  genreId?: string;
  languageId?: string;
  createdAt: Date;
}

export interface WatchHistory {
  id: string;
  userId: string;
  movieId: string;
  watchedAt: Date;
}
