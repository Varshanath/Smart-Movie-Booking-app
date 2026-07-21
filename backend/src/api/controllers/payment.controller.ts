import { NextFunction, Request, Response } from "express";

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
