import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { CreatePaymentInput, Payment } from "./payment.model";

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

export async function clearPaymentsForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM payments");
    return;
  }
  payments.clear();
}
