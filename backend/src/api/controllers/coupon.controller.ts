import { NextFunction, Request, Response } from "express";

import { getActiveCoupons, getCouponByCode } from "../../modules/coupons/coupon.service";

export async function listCouponsController(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ coupons: await getActiveCoupons() });
  } catch (error) {
    next(error);
  }
}

export async function getCouponByCodeController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const coupon = await getCouponByCode(request.params.code);
    response.status(200).json({ coupon });
  } catch (error) {
    next(error);
  }
}
