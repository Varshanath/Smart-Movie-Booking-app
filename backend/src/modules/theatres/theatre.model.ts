export interface Theatre {
  id: string;
  name: string;
  location: string;
  locationId: string;
  totalSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTheatreInput {
  name: string;
  location: string;
  totalSeats: number;
}
