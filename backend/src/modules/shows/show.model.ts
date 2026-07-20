export interface Screen {
  id: string;
  theatreId: string;
  name: string;
  totalSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Show {
  id: string;
  movieId: string;
  screenId: string;
  startTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScreenInput {
  theatreId: string;
  name: string;
  totalSeats: number;
}

export interface CreateShowInput {
  movieId: string;
  screenId: string;
  startTime: string;
}
