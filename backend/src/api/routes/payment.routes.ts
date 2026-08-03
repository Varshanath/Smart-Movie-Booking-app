import { Router } from "express";

import {
  confirmDemoPaymentController,
  createDemoPaymentController,
  createPaymentController,
  listPaymentsController,
} from "../controllers/payment.controller";

export const paymentRoutes = Router();

paymentRoutes.get("/", listPaymentsController);
paymentRoutes.post("/", createPaymentController);
paymentRoutes.post("/demo", createDemoPaymentController);
paymentRoutes.post("/demo/:paymentId/confirm", confirmDemoPaymentController);
