import { isPostgresEnabled, pool } from "../../database/postgres";
import { Coupon } from "./coupon.model";

const coupons = new Map<string, Coupon>();

const SELECT_COLUMNS = `
  id,
  code,
  description,
  discount_type AS "discountType",
  discount_value AS "discountValue",
  active,
  expires_at AS "expiresAt",
  created_at AS "createdAt"
`;

function isCurrentlyValid(coupon: Coupon): boolean {
  if (!coupon.active) return false;
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) return false;
  return true;
}

export async function listActiveCoupons() {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM coupons WHERE active = TRUE AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC`,
    );
    return result.rows as Coupon[];
  }
  return Array.from(coupons.values()).filter(isCurrentlyValid);
}

export async function findCouponByCode(code: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`SELECT ${SELECT_COLUMNS} FROM coupons WHERE code = $1`, [code]);
    return result.rows[0] as Coupon | undefined;
  }
  return Array.from(coupons.values()).find((coupon) => coupon.code === code);
}

export async function clearCouponsForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM coupons");
    return;
  }
  coupons.clear();
}
