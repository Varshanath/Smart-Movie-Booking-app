// DEMO PAYMENT SERVICE — NOT A REAL PAYMENT GATEWAY.
//
// This module exists to give the rest of the app (and, later, the AI
// agent) a single, safe boundary to depend on instead of embedding
// payment-amount math or payment-status decisions directly in callers.
// It never talks to Razorpay/Stripe/UPI/cards or any real financial
// provider — it simulates a payment lifecycle (pending -> paid|failed)
// entirely inside this backend, purely so the booking flow has something
// realistic to validate against while this is still a prototype.
//
// Replacing this with a real gateway later means swapping the body of
// confirmDemoPayment for a real provider call/webhook handler — callers
// (booking.service.ts, the eventual ADK payment flow) should not need to
// change, since they only ever see a Payment's id/amount/status.

import { ApiError } from "../../shared/utils/api-error";
import { findShowById } from "../shows/show.repository";
import { Payment } from "./payment.model";
import { findPaymentById, savePayment, updatePaymentStatusIfPending } from "./payment.repository";

const DEMO_PROVIDER_REFERENCE_PREFIX = "demo-simulated-";

// The one and only place booking amounts get computed. show.price is real
// backend data (set when the show was created); seatCount is just a count,
// never a client-supplied amount — this is what makes the resulting total
// authoritative rather than trusted-from-the-caller.
export function calculateAuthoritativeAmount(showPrice: number, seatCount: number): number {
  return showPrice * seatCount;
}

export async function createDemoPayment(payload: unknown): Promise<Payment> {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }
  const showId = readRequiredString(payload, "showId");
  const seatNumbers = readSeatNumbers(payload);

  const show = await findShowById(showId);
  if (!show) {
    throw new ApiError(404, "Show not found");
  }

  const amount = calculateAuthoritativeAmount(show.price, seatNumbers.length);

  // Created as "pending", never "paid" — nothing has actually been
  // confirmed yet. confirmDemoPayment is the only path that can move it
  // out of "pending".
  return savePayment({
    amount,
    status: "pending",
    providerReference: `${DEMO_PROVIDER_REFERENCE_PREFIX}${randomSuffix()}`,
  });
}

export async function confirmDemoPayment(paymentId: string, payload: unknown): Promise<Payment> {
  const simulateFailure = readOptionalSimulateFailure(payload);

  const payment = await findPaymentById(paymentId);
  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }
  if (payment.status !== "pending") {
    throw new ApiError(409, `Payment has already been ${payment.status}`);
  }

  // simulateFailure exists purely so this demo flow's failure path is
  // testable end-to-end — it is not a real gateway declining a card, just
  // this simulation choosing the other branch on request.
  const nextStatus = simulateFailure ? "failed" : "paid";
  const updated = await updatePaymentStatusIfPending(paymentId, nextStatus);
  if (!updated) {
    // Only reachable if another request confirmed this exact payment
    // between the findPaymentById above and this update — the WHERE
    // status = 'pending' guard means we lost that race, not a bug.
    throw new ApiError(409, "Payment is no longer pending");
  }
  return updated;
}

function readRequiredString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${key} is required`);
  }
  return value.trim();
}

function readSeatNumbers(payload: Record<string, unknown>): string[] {
  const value = payload.seatNumbers;
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError(400, "seatNumbers must be a non-empty array");
  }
  return value.map((seatNumber, index) => {
    if (typeof seatNumber !== "string" || seatNumber.trim().length === 0) {
      throw new ApiError(400, `seatNumbers[${index}] must be a seat label`);
    }
    return seatNumber.trim().toUpperCase();
  });
}

function readOptionalSimulateFailure(payload: unknown): boolean {
  if (payload === undefined || payload === null) {
    return false;
  }
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body must be an object");
  }
  const value = payload.simulateFailure;
  if (value === undefined) {
    return false;
  }
  if (typeof value !== "boolean") {
    throw new ApiError(400, "simulateFailure must be a boolean");
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function randomSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
