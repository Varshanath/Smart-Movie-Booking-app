import { Router } from "express";

import { createPaymentController } from "../controllers/payment.controller";

export const paymentRoutes = Router();

paymentRoutes.post("/", createPaymentController);
