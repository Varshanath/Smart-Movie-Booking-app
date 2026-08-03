import { findPaymentById } from "../payments/payment.repository";
import { findScreenById, findShowById } from "../shows/show.repository";
import { isValidSeatLabel } from "../shows/show.service";
import { findUserById } from "../users/user.repository";
import { ApiError } from "../../shared/utils/api-error";
import { CreateBookingInput } from "./booking.model";
import { createBookingWithLock, listBookings } from "./booking.repository";

export async function getBookings() {
  return listBookings();
}

export async function createBooking(payload: unknown) {
  const input = validateCreateBookingInput(payload);

  const [user, show, payment] = await Promise.all([
    findUserById(input.userId),
    findShowById(input.showId),
    findPaymentById(input.paymentId),
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (!show) {
    throw new ApiError(404, "Show not found");
  }
  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  const screen = await findScreenById(show.screenId);
  if (!screen) {
    throw new ApiError(404, "Screen not found");
  }

  for (const seatNumber of input.seatNumbers) {
    if (!isValidSeatLabel(seatNumber, screen.rows, screen.seatsPerRow)) {
      throw new ApiError(400, `Seat ${seatNumber} does not exist on this screen`);
    }
  }

  // Everything above is fast-fail validation on data that isn't contended
  // (show/screen/user/payment existence, seat-label shape) — it's safe to
  // check without any locking. The actual availability re-check and the
  // insert happen atomically inside createBookingWithLock, which is what
  // prevents two concurrent requests from both booking the same seat.
  return createBookingWithLock(input);
}

function validateCreateBookingInput(payload: unknown): CreateBookingInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }

  return {
    userId: readRequiredString(payload, "userId"),
    showId: readRequiredString(payload, "showId"),
    paymentId: readRequiredString(payload, "paymentId"),
    seatNumbers: readSeatNumbers(payload, "seatNumbers"),
  };
}

function readRequiredString(
  payload: Record<string, unknown>,
  key: string,
): string {
  const value = payload[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${key} is required`);
  }
  return value.trim();
}

function readSeatNumbers(payload: Record<string, unknown>, key: string): string[] {
  const value = payload[key];
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError(400, `${key} must be a non-empty array`);
  }

  const seatNumbers = value.map((seatNumber) => {
    if (typeof seatNumber !== "string" || seatNumber.trim().length === 0) {
      throw new ApiError(400, `${key} must contain seat labels`);
    }
    return seatNumber.trim().toUpperCase();
  });

  if (new Set(seatNumbers).size !== seatNumbers.length) {
    throw new ApiError(400, `${key} must not contain duplicate seats`);
  }

  return seatNumbers;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
