export type BookingStatus = "confirmed" | "cancelled";

export interface Booking {
  id: string;
  userId: string;
  showId: string;
  paymentId: string;
  seatNumbers: string[];
  seats: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingInput {
  userId: string;
  showId: string;
  paymentId: string;
  seatNumbers: string[];
}
