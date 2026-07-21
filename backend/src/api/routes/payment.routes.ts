import { Router } from "express";

import {
  createPaymentController,
  listPaymentsController,
} from "../controllers/payment.controller";

export const paymentRoutes = Router();

paymentRoutes.get("/", listPaymentsController);
paymentRoutes.post("/", createPaymentController);
