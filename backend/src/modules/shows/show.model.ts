export interface Screen {
  id: string;
  theatreId: string;
  name: string;
  rows: number;
  seatsPerRow: number;
  totalSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Show {
  id: string;
  movieId: string;
  screenId: string;
  startTime: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScreenInput {
  theatreId: string;
  name: string;
  rows: number;
  seatsPerRow: number;
}

export interface CreateShowInput {
  movieId: string;
  screenId: string;
  startTime: string;
  price: number;
}

export interface ShowSeatMap {
  showId: string;
  rows: number;
  seatsPerRow: number;
  price: number;
  seatLabels: string[];
  bookedSeats: string[];
}
