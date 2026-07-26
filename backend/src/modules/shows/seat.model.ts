export type SeatType = "Regular" | "Premium" | "Recliner";

export interface Seat {
  id: string;
  screenId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: SeatType;
}
