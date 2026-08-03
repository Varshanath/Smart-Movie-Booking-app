import { NextFunction, Request, Response } from "express";

import { confirmDemoPayment, createDemoPayment } from "../../modules/payments/demo-payment.service";
import { createPayment, getPayments } from "../../modules/payments/payment.service";

export async function listPaymentsController(_request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ payments: await getPayments() });
  } catch (error) {
    next(error);
  }
}

export async function createPaymentController(request: Request, response: Response, next: NextFunction) {
  try {
    const payment = await createPayment(request.body);
    response.status(201).json({ message: "Payment created successfully", payment });
  } catch (error) {
    next(error);
  }
}

// Demo-only payment flow — see demo-payment.service.ts. Creates a
// "pending" payment whose amount is calculated authoritatively from the
// show's real price and the requested seat count (never from the request
// body), and separately simulates confirming it to "paid"/"failed".
export async function createDemoPaymentController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const payment = await createDemoPayment(request.body);
    response.status(201).json({ message: "Demo payment created successfully", payment });
  } catch (error) {
    next(error);
  }
}

export async function confirmDemoPaymentController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const payment = await confirmDemoPayment(request.params.paymentId, request.body);
    const message = payment.status === "paid" ? "Demo payment confirmed as paid" : "Demo payment simulated as failed";
    response.status(200).json({ message, payment });
  } catch (error) {
    next(error);
  }
}
