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
  ACTIVE: 'active',
  EXITED: 'exited',
  SUSPENDED: 'suspended',
});

const PAYOUT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  SKIPPED: 'skipped',
});

// Minimum investment amount enforced by the DB CHECK constraint
const MIN_INVESTMENT_AMOUNT = 5000;

module.exports = {
  USER_ROLES,
  INVESTMENT_STATUS,
  PAYOUT_STATUS,
  MIN_INVESTMENT_AMOUNT,
};
