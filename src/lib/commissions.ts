import type { CommissionSplit, Transaction } from "@prisma/client";

export const SPLIT_ROLES = [
  "REFERRING",
  "CO_LISTING",
  "CO_BUYING",
  "TRANSACTION_COORDINATOR",
] as const;

export type SplitRole = (typeof SPLIT_ROLES)[number];

export function isSplitRole(value: unknown): value is SplitRole {
  return typeof value === "string" && (SPLIT_ROLES as readonly string[]).includes(value);
}

type CommissionSource = Pick<Transaction, "commission" | "price" | "commissionRate">;

/**
 * Gross commission for a transaction: the explicit `commission` when set,
 * otherwise derived from `price * commissionRate / 100` when both are present.
 */
export function grossCommission(tx: CommissionSource): number {
  if (tx.commission != null) return tx.commission;
  if (tx.price != null && tx.commissionRate != null) {
    return (tx.price * tx.commissionRate) / 100;
  }
  return 0;
}

type SplitSource = Pick<CommissionSplit, "splitAmount" | "splitPercent">;

/** Amount owed to another agent for one split: explicit `splitAmount`, else `gross * splitPercent / 100`. */
export function splitDeduction(split: SplitSource, gross: number): number {
  if (split.splitAmount != null) return split.splitAmount;
  return (gross * split.splitPercent) / 100;
}

/** Total deducted across all splits on a transaction. */
export function totalSplitDeduction(splits: SplitSource[], gross: number): number {
  return splits.reduce((sum, split) => sum + splitDeduction(split, gross), 0);
}

/** Net commission retained by the transaction owner after all split deductions. */
export function netCommission(tx: CommissionSource, splits: SplitSource[]): number {
  const gross = grossCommission(tx);
  return gross - totalSplitDeduction(splits, gross);
}
