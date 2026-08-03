import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { CreatePaymentInput, Payment, PaymentStatus } from "./payment.model";

const payments = new Map<string, Payment>();

export async function listPayments() {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT id, amount, status, provider_reference AS "providerReference", created_at AS "createdAt", updated_at AS "updatedAt" FROM payments ORDER BY created_at DESC`,
    );
    return result.rows as Payment[];
  }
  return Array.from(payments.values());
}

export async function findPaymentById(id: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT id, amount, status, provider_reference AS "providerReference", created_at AS "createdAt", updated_at AS "updatedAt" FROM payments WHERE id = $1`,
      [id],
    );
    return result.rows[0] as Payment | undefined;
  }
  return payments.get(id);
}

export async function savePayment(input: CreatePaymentInput) {
  const now = new Date();
  const payment: Payment = { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
  if (isPostgresEnabled && pool) {
    await pool.query(
      `INSERT INTO payments (id, amount, status, provider_reference, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
      [payment.id, payment.amount, payment.status, payment.providerReference, payment.createdAt, payment.updatedAt],
    );
    return payment;
  }
  payments.set(payment.id, payment);
  return payment;
}

// Only moves a payment out of "pending" — returns undefined (no-op) if the
// payment doesn't exist or has already left "pending", so a payment can
// never be confirmed/failed twice. The WHERE status = 'pending' clause
// makes this check-and-update atomic in Postgres (a single statement, not
// a separate read-then-write), so it's race-safe without needing a
// transaction of its own.
export async function updatePaymentStatusIfPending(
  id: string,
  status: PaymentStatus,
): Promise<Payment | undefined> {
  const now = new Date();
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `
        UPDATE payments
        SET status = $2, updated_at = $3
        WHERE id = $1 AND status = 'pending'
        RETURNING id, amount, status, provider_reference AS "providerReference", created_at AS "createdAt", updated_at AS "updatedAt"
      `,
      [id, status, now],
    );
    return result.rows[0] as Payment | undefined;
  }

  const payment = payments.get(id);
  if (!payment || payment.status !== "pending") {
    return undefined;
  }
  const updated: Payment = { ...payment, status, updatedAt: now };
  payments.set(id, updated);
  return updated;
}

export async function clearPaymentsForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM payments");
    return;
  }
  payments.clear();
}
