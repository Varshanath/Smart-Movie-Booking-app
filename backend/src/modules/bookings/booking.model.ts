export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
  id: string;
  userId: string;
  movieId: string;
  theatreId: string;
  showTime: string;
  seats: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingInput {
  userId: string;
  movieId: string;
  theatreId: string;
  showTime: string;
  seats: number;
}
