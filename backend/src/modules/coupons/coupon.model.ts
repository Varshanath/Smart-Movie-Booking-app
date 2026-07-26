export type DiscountType = "flat" | "percentage";

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  active: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}
