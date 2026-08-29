/**
 * Central constants that mirror the PostgreSQL ENUM types
 * defined in 001_init_schema.sql — keep them in sync.
 */

const USER_ROLES = Object.freeze({
  CUSTOMER: 'customer',
  INVESTMENT_HEAD: 'investment_head',
  BUSINESS_HEAD: 'business_head',
  SUPER_ADMIN: 'super_admin',
});

const INVESTMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  EXITED: 'exited',
  SUSPENDED: 'suspended',
});

const WITHDRAWAL_STATUS = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
});

const PAYOUT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  SKIPPED: 'skipped',
  // 004_audit_voided_password_reset.sql already added this to the DB enum
  // and voidPayout() already sets it — this constant just never caught up.
  VOIDED: 'voided',
});

// Discriminator used by the unified transactions UNION query
const TRANSACTION_TYPE = Object.freeze({
  INVESTMENT: 'investment',
  WITHDRAWAL: 'withdrawal',
  PAYOUT: 'payout',
});

// stock_transactions.transaction_type (firm-wide portfolio, FR-PORTFOLIO-01)
const STOCK_TRANSACTION_TYPE = Object.freeze({
  BUY: 'buy',
  SELL: 'sell',
});

// Minimum investment amount enforced by the DB CHECK constraint
const MIN_INVESTMENT_AMOUNT = 5000;

module.exports = {
  USER_ROLES,
  INVESTMENT_STATUS,
  WITHDRAWAL_STATUS,
  PAYOUT_STATUS,
  TRANSACTION_TYPE,
  STOCK_TRANSACTION_TYPE,
  MIN_INVESTMENT_AMOUNT,
};
