const db = require('../models/db');
const mailer = require('../utils/mailer');
const { INVESTMENT_STATUS, WITHDRAWAL_STATUS } = require('../utils/constants');

// Opt-in confirmation emails for investments, withdrawals and payouts.
// Always called after the database work has committed, so a lookup or email
// failure is logged and swallowed — it must never turn a successful
// transaction into an error response.

const getCustomerContact = async (customerId) => {
  const { rows } = await db.query(`SELECT name, email FROM users WHERE id = $1 AND role = 'customer'`, [customerId]);
  return rows[0] || null;
};

// The customer's position right now (post-commit): total investment is
// active investments minus completed withdrawals — the same figure as the
// dashboard's "Total Investment" — plus their paid payouts to date.
const getPortfolioSnapshot = async (customerId) => {
  const { rows } = await db.query(
    `SELECT
       COALESCE((SELECT SUM(amount) FROM investments WHERE customer_id = $1 AND status = 'active'), 0)
         - COALESCE((SELECT SUM(amount) FROM withdrawals WHERE customer_id = $1 AND status = 'completed'), 0)
         AS total_investment,
       COALESCE((SELECT SUM(payout_amount) FROM monthly_returns WHERE customer_id = $1 AND payout_status = 'paid'), 0) AS total_payouts,
       (SELECT COUNT(*) FROM monthly_returns WHERE customer_id = $1 AND payout_status = 'paid') AS payout_count`,
    [customerId]
  );
  return {
    totalInvestment: parseFloat(rows[0].total_investment),
    totalPayouts: parseFloat(rows[0].total_payouts),
    payoutCount: parseInt(rows[0].payout_count, 10),
  };
};

const notify = async (label, customerId, send) => {
  try {
    const customer = await getCustomerContact(customerId);
    if (!customer?.email) return;
    await send(customer);
  } catch (error) {
    console.error(`${label} notification failed:`, error.message);
  }
};

/** @param {object} investment - investments row (just created, still pending — not in the total yet) */
const notifyInvestmentReceived = (investment) =>
  notify('Investment received', investment.customer_id, async (c) => {
    const { totalInvestment } = await getPortfolioSnapshot(investment.customer_id);
    await mailer.sendInvestmentReceivedEmail(c.email, c.name, {
      amount: investment.amount,
      investmentDate: investment.investment_date,
      currentTotalInvestment: totalInvestment,
    });
  });

/**
 * Admin decision on a pending investment. Only the approval/rejection
 * transitions email the customer, and only if the investment head opted in
 * when recording it.
 * @param {object} investment - investments row after the status update
 */
const notifyInvestmentDecision = (investment) => {
  const isDecision = [INVESTMENT_STATUS.ACTIVE, INVESTMENT_STATUS.REJECTED].includes(investment.status);
  if (!investment.send_email_confirmation || !isDecision) return Promise.resolve();
  return notify('Investment decision', investment.customer_id, async (c) => {
    // Snapshot is taken after the update: an approved investment is already in the total.
    const { totalInvestment } = await getPortfolioSnapshot(investment.customer_id);
    const approved = investment.status === INVESTMENT_STATUS.ACTIVE;
    await mailer.sendInvestmentDecisionEmail(c.email, c.name, {
      status: investment.status,
      amount: investment.amount,
      investmentDate: investment.investment_date,
      previousTotalInvestment: approved ? totalInvestment - Number(investment.amount) : totalInvestment,
      newTotalInvestment: totalInvestment,
    });
  });
};

/** @param {object} withdrawal - withdrawals row (just created, still pending) */
const notifyWithdrawalRequested = (withdrawal) =>
  notify('Withdrawal requested', withdrawal.customer_id, async (c) => {
    const { totalInvestment } = await getPortfolioSnapshot(withdrawal.customer_id);
    await mailer.sendWithdrawalRequestedEmail(c.email, c.name, {
      amount: withdrawal.amount,
      withdrawalDate: withdrawal.withdrawal_date,
      currentTotalInvestment: totalInvestment,
    });
  });

/** @param {object} withdrawal - withdrawals row after the status update */
const notifyWithdrawalDecision = (withdrawal) => {
  const isDecision = [WITHDRAWAL_STATUS.COMPLETED, WITHDRAWAL_STATUS.REJECTED].includes(withdrawal.status);
  if (!withdrawal.send_email_confirmation || !isDecision) return Promise.resolve();
  return notify('Withdrawal decision', withdrawal.customer_id, async (c) => {
    // Snapshot is taken after the update: a completed withdrawal is already deducted.
    const { totalInvestment } = await getPortfolioSnapshot(withdrawal.customer_id);
    const completed = withdrawal.status === WITHDRAWAL_STATUS.COMPLETED;
    await mailer.sendWithdrawalDecisionEmail(c.email, c.name, {
      status: withdrawal.status,
      amount: withdrawal.amount,
      withdrawalDate: withdrawal.withdrawal_date,
      previousTotalInvestment: completed ? totalInvestment + Number(withdrawal.amount) : totalInvestment,
      newTotalInvestment: totalInvestment,
    });
  });
};

/**
 * @param {string} customerId
 * @param {{ payoutAmount: number, month: number, year: number, payoutDate: string, investedAmount: number, returnPct: number }} payout
 */
const notifyPayoutProcessed = (customerId, payout) =>
  notify('Payout', customerId, async (c) => {
    // Taken after commit, so the totals already include this payout.
    const portfolio = await getPortfolioSnapshot(customerId);
    await mailer.sendPayoutEmail(c.email, c.name, { ...payout, portfolio });
  });

module.exports = {
  notifyInvestmentReceived,
  notifyInvestmentDecision,
  notifyWithdrawalRequested,
  notifyWithdrawalDecision,
  notifyPayoutProcessed,
};
