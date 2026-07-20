export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  providerReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput {
  amount: number;
  status: PaymentStatus;
  providerReference?: string;
}
