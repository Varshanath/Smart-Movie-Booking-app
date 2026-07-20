import { ApiError } from "../../shared/utils/api-error";
import { CreatePaymentInput, PaymentStatus } from "./payment.model";
import { savePayment } from "./payment.repository";

const allowedStatuses: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

export async function createPayment(payload: unknown) {
  return savePayment(validateCreatePaymentInput(payload));
}

function validateCreatePaymentInput(payload: unknown): CreatePaymentInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }
  const status = readRequiredString(payload, "status") as PaymentStatus;
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Payment status is not valid");
  }
  const providerReference = payload.providerReference;
  return {
    amount: readPositiveNumber(payload, "amount"),
    status,
    providerReference:
      typeof providerReference === "string" && providerReference.trim().length > 0
        ? providerReference.trim()
        : undefined,
  };
}

function readRequiredString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${key} is required`);
  }
  return value.trim();
}

function readPositiveNumber(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new ApiError(400, `${key} must be a positive number`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
