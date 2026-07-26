import { ApiError } from "../../shared/utils/api-error";
import { findCouponByCode, listActiveCoupons } from "./coupon.repository";

export function getActiveCoupons() {
  return listActiveCoupons();
}

export async function getCouponByCode(code: string) {
  const coupon = await findCouponByCode(code.trim().toUpperCase());
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }
  if (!coupon.active || (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now())) {
    throw new ApiError(410, "Coupon is no longer valid");
  }
  return coupon;
}
