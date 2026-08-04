import { calculateAuthoritativeAmount } from "../payments/demo-payment.service";
import { findPaymentById } from "../payments/payment.repository";
import { findScreenById, findShowById } from "../shows/show.repository";
import { isValidSeatLabel } from "../shows/show.service";
import { findUserById } from "../users/user.repository";
import { ApiError } from "../../shared/utils/api-error";
import { CreateBookingInput } from "./booking.model";
import { createBookingWithLock, listBookingsByUserId } from "./booking.repository";

export async function getBookings(authenticatedUserId: string) {
  return listBookingsByUserId(authenticatedUserId);
}

export async function createBooking(payload: unknown, authenticatedUserId: string) {
  const input = validateCreateBookingInput(payload);

  // The booking must always belong to whoever the JWT actually authenticated
  // — never to a userId the caller merely typed into the request body. This
  // is what stops "User A's token + User B's userId in the body" from
  // creating a booking as User B.
  if (input.userId !== authenticatedUserId) {
    throw new ApiError(403, "Cannot create a booking for another user");
  }

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

  // The payment must actually be paid, and for exactly this booking's real
  // cost — never trust a client-claimed status or amount (a payment record
  // created with an arbitrary amount/status, e.g. via the raw POST
  // /api/payments endpoint, must not be spendable on a booking it doesn't
  // actually cover). show.price is real backend data set when the show was
  // created, so this recomputes the authoritative total independently of
  // whatever the payment happens to already say.
  if (payment.status !== "paid") {
    throw new ApiError(402, "Payment has not been completed");
  }
  const authoritativeAmount = calculateAuthoritativeAmount(show.price, input.seatNumbers.length);
  if (payment.amount !== authoritativeAmount) {
    throw new ApiError(
      402,
      `Payment amount does not match the required amount for this booking`,
    );
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
