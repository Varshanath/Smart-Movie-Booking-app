import { Router } from "express";

import { getCouponByCodeController, listCouponsController } from "../controllers/coupon.controller";

export const couponRoutes = Router();

couponRoutes.get("/", listCouponsController);
couponRoutes.get("/:code", getCouponByCodeController);
