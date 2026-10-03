const { Resend } = require('resend');
const { primaryOrigin } = require('./corsOrigins');

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');

const FROM = 'Fortune First <info@fortunefirst.in>';
const FROM_SECURITY = 'Fortune First Security <info@fortunefirst.in>';

// ── Branded email template ─────────────────────────────────────────────────
// One layout for every email Fortune First sends. Table-based with inline
// styles only — the subset of HTML/CSS that renders consistently across
// Gmail, Outlook and Apple Mail, on desktop and mobile. Every value
// interpolated into it goes through escapeHtml().

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const BRAND = {
  navy: '#0f1b2d',
  orange: '#f97316',
  page: '#f4f1ec',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#ece7df',
};

const TONES = {
  success: { badgeBg: '#ecfdf5', badgeText: '#047857', panelBg: '#f0fdf4', panelBorder: '#bbf7d0' },
  pending: { badgeBg: '#fffbeb', badgeText: '#b45309', panelBg: '#fff7ed', panelBorder: '#fed7aa' },
  danger: { badgeBg: '#fef2f2', badgeText: '#b91c1c', panelBg: '#f9fafb', panelBorder: '#e5e7eb' },
  info: { badgeBg: '#eff6ff', badgeText: '#1d4ed8', panelBg: '#f8fafc', panelBorder: '#e2e8f0' },
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Escaped text with line breaks preserved (for free-form messages).
const escapeMultiline = (value) => escapeHtml(value).replace(/\r?\n/g, '<br />');

const formatInr = (amount) => {
  const value = Number(amount) || 0;
  const hasPaise = Math.round(value * 100) % 100 !== 0;
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: hasPaise ? 2 : 0, maximumFractionDigits: 2 })}`;
};

const formatPct = (value) => `${(Number(value) || 0).toFixed(2)}%`;

// Accepts a 'YYYY-MM-DD' string or a Date (pg returns DATE columns as a local-midnight Date).
const formatDisplayDate = (value) => {
  if (!value) return '—';
  let date = value;
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
  }
  if (Number.isNaN(date.getTime())) return '—';
  return `${String(date.getDate()).padStart(2, '0')} ${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
};

const formatPeriod = (month, year) => `${MONTH_NAMES[Number(month) - 1] || ''} ${year}`.trim();

const dashboardCta = () => ({ label: 'View your dashboard', url: `${primaryOrigin}/dashboard` });

const renderParagraph = (html) =>
  `<p style="margin:12px 0 0;font-size:15px;line-height:1.65;color:${BRAND.text};">${html}</p>`;

/** rows: Array<[label, value, emphasis?]> — an emphasised row is a bold total with a heavier rule above it. */
const renderSection = ({ heading, rows }) => {
  const body = rows
    .map(([label, value, emphasis], index) => {
      const border = emphasis
        ? `border-top:2px solid ${BRAND.navy};`
        : index
          ? `border-top:1px solid ${BRAND.border};`
          : '';
      const labelStyle = emphasis ? `font-weight:700;color:${BRAND.navy};` : `color:${BRAND.muted};`;
      const valueStyle = emphasis ? `font-size:15px;font-weight:800;color:${BRAND.navy};` : `font-weight:600;color:${BRAND.text};`;
      return `
                <tr>
                  <td style="padding:11px 0;${border}font-size:14px;${labelStyle}">${escapeHtml(label)}</td>
                  <td align="right" style="padding:11px 0;${border}font-size:14px;${valueStyle}">${escapeHtml(value)}</td>
                </tr>`;
    })
    .join('');
  return `
          <tr>
            <td style="padding:22px 32px 0;">
              ${heading ? `<div style="margin-bottom:4px;font-size:12px;font-weight:700;color:${BRAND.orange};letter-spacing:1px;text-transform:uppercase;">${escapeHtml(heading)}</div>` : ''}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}
              </table>
            </td>
          </tr>`;
};

/**
 * @param {{
 *   preheader: string, tone: keyof TONES, badge: string, title: string,
 *   name?: string,                       // greeting; omitted → no "Hi …" line
 *   paragraphs?: string[],               // plain text, escaped here
 *   paragraphsHtml?: string[],           // already-escaped HTML (e.g. escapeMultiline output)
 *   highlight?: { label: string, value: string, mono?: boolean },
 *   sections?: Array<{ heading?: string, rows: Array<[string, string, boolean?]> }>,
 *   note?: string, cta?: { label: string, url: string } | null, footer?: string
 * }} options
 */
const renderEmail = ({
  preheader, tone, badge, title, name, paragraphs = [], paragraphsHtml = [], highlight, sections = [], note, cta, footer,
}) => {
  const t = TONES[tone] || TONES.info;
  const intro = [...paragraphs.map(escapeHtml), ...paragraphsHtml].map(renderParagraph).join('');
  const highlightBlock = highlight
    ? `
          <tr>
            <td style="padding:22px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.panelBg};border:1px solid ${t.panelBorder};border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:12px;font-weight:700;color:${BRAND.muted};letter-spacing:0.8px;text-transform:uppercase;">${escapeHtml(highlight.label)}</div>
                    <div style="margin-top:6px;${highlight.mono ? "font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:22px;letter-spacing:1px;" : 'font-size:32px;'}font-weight:800;color:${BRAND.navy};word-break:break-all;">${escapeHtml(highlight.value)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.page};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.page};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,27,45,0.08);">
          <tr>
            <td style="background:${BRAND.navy};padding:24px 32px;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.3px;">Fortune<span style="color:${BRAND.orange};">First</span></span>
              <div style="margin-top:4px;font-size:12px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;">Wealth, managed with care</div>
            </td>
          </tr>
          <tr><td style="height:4px;background:${BRAND.orange};line-height:4px;font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:32px 32px 0;">
              <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${t.badgeBg};color:${t.badgeText};font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;">${escapeHtml(badge)}</span>
              <h1 style="margin:16px 0 0;font-size:24px;line-height:1.3;font-weight:800;color:${BRAND.navy};">${escapeHtml(title)}</h1>
              ${name ? renderParagraph(`Hi ${escapeHtml(name)},`).replace('margin:12px 0 0', 'margin:16px 0 0') : ''}
              ${intro}
            </td>
          </tr>
          ${highlightBlock}
          ${sections.map(renderSection).join('')}
          ${note ? `<tr><td style="padding:20px 32px 0;"><p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">${escapeHtml(note)}</p></td></tr>` : ''}
          <tr>
            <td style="padding:28px 32px 32px;">
              ${cta ? `<a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:12px 28px;background:${BRAND.orange};color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;">${escapeHtml(cta.label)}</a>` : ''}
              <p style="margin:${cta ? '28px' : '0'} 0 0;font-size:14px;line-height:1.6;color:${BRAND.text};">Warm regards,<br /><strong>The Fortune First Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background:#faf8f5;border-top:1px solid ${BRAND.border};padding:20px 32px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.muted};">${escapeHtml(footer || 'This is an automated message from Fortune First. For any questions, please contact your investment head.')}</p>
              <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Fortune First. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Errors are logged, never thrown — an email failure must not fail the request that triggered it.
const deliver = async ({ to, subject, html, from = FROM, attachments, label }) => {
  try {
    const { data, error } = await resend.emails.send({ from, to: [to], subject, html, ...(attachments ? { attachments } : {}) });
    if (error) console.error(`Resend API Error (${label}):`, error);
    return data;
  } catch (err) {
    console.error(`${label} email failed:`, err);
  }
};

const TRANSACTION_FOOTER =
  'This is an automated confirmation from Fortune First. For any questions about this transaction, please contact your investment head.';

// ── Payouts ────────────────────────────────────────────────────────────────

/**
 * Monthly payout statement — sent only when "Send email confirmation" is ticked.
 * @param {string} customerEmail
 * @param {string} customerName
 * @param {{ payoutAmount: number, month: number, year: number, payoutDate: string, investedAmount: number,
 *   returnPct: number, portfolio: { totalInvestment: number, totalPayouts: number, payoutCount: number } }} payout
 */
const sendPayoutEmail = (customerEmail, customerName, { payoutAmount, month, year, payoutDate, investedAmount, returnPct, portfolio }) => {
  const period = formatPeriod(month, year);
  const declaredPct = Number(returnPct) || 0;
  const appliedPct = Number(investedAmount) > 0 ? (Number(payoutAmount) / Number(investedAmount)) * 100 : 0;
  const prorated = Math.abs(appliedPct - declaredPct) > 0.005;

  const payoutRows = [
    ['Payout month', period],
    ['Active investment (invested − withdrawn)', formatInr(investedAmount)],
    ['Return rate declared for the month', formatPct(declaredPct)],
  ];
  if (prorated) payoutRows.push(['Return rate applied (prorated)', formatPct(appliedPct)]);
  payoutRows.push(['Paid on', formatDisplayDate(payoutDate)], ['Payout amount', formatInr(payoutAmount), true]);

  const sections = [{ heading: 'This month’s payout', rows: payoutRows }];
  if (portfolio) {
    sections.push({
      heading: 'Your portfolio to date',
      rows: [
        ['Total investment', formatInr(portfolio.totalInvestment)],
        ['Payouts received', String(portfolio.payoutCount)],
        ['Total payouts received', formatInr(portfolio.totalPayouts), true],
      ],
    });
  }

  const html = renderEmail({
    preheader: `Your ${period} payout of ${formatInr(payoutAmount)} at ${formatPct(appliedPct)} has been credited.`,
    tone: 'success',
    badge: 'Monthly payout statement',
    title: `Payout statement · ${period}`,
    name: customerName,
    paragraphs: [
      `We are pleased to confirm that your monthly payout for ${period} has been processed. For this month we have declared a return of ${formatPct(declaredPct)} on your active investment, and the payout has been credited to your registered bank account.`,
    ],
    highlight: { label: 'Payout credited', value: formatInr(payoutAmount) },
    sections,
    note: prorated
      ? 'The applied rate is prorated because your investment was active for only part of its first month. Depending on your bank, the amount can take 1–2 business days to reflect.'
      : 'Depending on your bank, the amount can take 1–2 business days to reflect in your account.',
    cta: dashboardCta(),
    footer: TRANSACTION_FOOTER,
  });
  return deliver({ to: customerEmail, subject: `Payout statement for ${period}: ${formatInr(payoutAmount)} credited`, html, label: 'Payout' });
};

// ── Investments ────────────────────────────────────────────────────────────

/**
 * Investment recorded by the investment head (pending verification).
 * @param {{ amount: number, investmentDate: string|Date, currentTotalInvestment: number }} investment
 */
const sendInvestmentReceivedEmail = (customerEmail, customerName, { amount, investmentDate, currentTotalInvestment }) => {
  const current = Number(currentTotalInvestment) || 0;
  const html = renderEmail({
    preheader: `We've received your investment of ${formatInr(amount)}. It's now being verified.`,
    tone: 'pending',
    badge: 'Under review',
    title: 'We’ve received your investment',
    name: customerName,
    paragraphs: ['Thank you for investing with Fortune First. Your investment has been recorded and is now being verified by our team.'],
    highlight: { label: 'Investment amount', value: formatInr(amount) },
    sections: [
      { heading: 'Investment details', rows: [['Investment date', formatDisplayDate(investmentDate)], ['Status', 'Pending verification']] },
      {
        heading: 'Your total investment',
        rows: [
          ['Current total investment', formatInr(current)],
          ['This investment', `+ ${formatInr(amount)}`],
          ['Total investment after approval', formatInr(current + Number(amount)), true],
        ],
      },
    ],
    note: 'You will receive another email as soon as your investment is verified and becomes active.',
    cta: dashboardCta(),
    footer: TRANSACTION_FOOTER,
  });
  return deliver({ to: customerEmail, subject: `Investment received: ${formatInr(amount)}`, html, label: 'Investment received' });
};

/**
 * Admin approved ('active') or rejected a pending investment.
 * @param {{ status: 'active'|'rejected', amount: number, investmentDate: string|Date,
 *   previousTotalInvestment: number, newTotalInvestment: number }} investment
 */
const sendInvestmentDecisionEmail = (customerEmail, customerName, { status, amount, investmentDate, previousTotalInvestment, newTotalInvestment }) => {
  const approved = status === 'active';
  const totalRows = approved
    ? [
        ['Previous total investment', formatInr(previousTotalInvestment)],
        ['This investment', `+ ${formatInr(amount)}`],
        ['New total investment', formatInr(newTotalInvestment), true],
      ]
    : [['Total investment (unchanged)', formatInr(newTotalInvestment), true]];

  const html = renderEmail({
    preheader: approved
      ? `Your investment of ${formatInr(amount)} is now active. New total: ${formatInr(newTotalInvestment)}.`
      : `An update on your investment of ${formatInr(amount)}.`,
    tone: approved ? 'success' : 'danger',
    badge: approved ? 'Investment active' : 'Not approved',
    title: approved ? 'Your investment is now active' : 'Update on your investment',
    name: customerName,
    paragraphs: [
      approved
        ? 'Your investment has been verified and is now active. It will start earning returns as per your plan.'
        : 'We were unable to verify the investment recorded for you, so it has not been activated.',
    ],
    highlight: { label: 'Investment amount', value: formatInr(amount) },
    sections: [
      { heading: 'Investment details', rows: [['Investment date', formatDisplayDate(investmentDate)], ['Status', approved ? 'Active' : 'Not approved']] },
      { heading: 'Your total investment', rows: totalRows },
    ],
    note: approved
      ? 'You can track your investment and monthly payouts anytime from your dashboard.'
      : 'If you believe this is a mistake, please reach out to your investment head and they will help you sort it out.',
    cta: dashboardCta(),
    footer: TRANSACTION_FOOTER,
  });
  const subject = approved ? `Investment active: ${formatInr(amount)}` : 'Update on your Fortune First investment';
  return deliver({ to: customerEmail, subject, html, label: 'Investment decision' });
};

// ── Withdrawals ────────────────────────────────────────────────────────────

/**
 * Withdrawal request raised by the investment head (pending review).
 * @param {{ amount: number, withdrawalDate: string|Date, currentTotalInvestment: number }} withdrawal
 */
const sendWithdrawalRequestedEmail = (customerEmail, customerName, { amount, withdrawalDate, currentTotalInvestment }) => {
  const current = Number(currentTotalInvestment) || 0;
  const html = renderEmail({
    preheader: `Your withdrawal request for ${formatInr(amount)} has been received.`,
    tone: 'pending',
    badge: 'Request received',
    title: 'Your withdrawal request is being processed',
    name: customerName,
    paragraphs: ['A withdrawal request has been raised on your account and is now being reviewed by our team.'],
    highlight: { label: 'Withdrawal amount', value: formatInr(amount) },
    sections: [
      { heading: 'Request details', rows: [['Requested for', formatDisplayDate(withdrawalDate)], ['Status', 'Under review']] },
      {
        heading: 'Your total investment',
        rows: [
          ['Current total investment', formatInr(current)],
          ['This withdrawal', `− ${formatInr(amount)}`],
          ['Total investment after withdrawal', formatInr(Math.max(0, current - Number(amount))), true],
        ],
      },
    ],
    note: 'You will receive another email once the withdrawal has been completed.',
    cta: dashboardCta(),
    footer: TRANSACTION_FOOTER,
  });
  return deliver({ to: customerEmail, subject: `Withdrawal request received: ${formatInr(amount)}`, html, label: 'Withdrawal requested' });
};

/**
 * Admin completed or rejected a pending withdrawal.
 * @param {{ status: 'completed'|'rejected', amount: number, withdrawalDate: string|Date,
 *   previousTotalInvestment: number, newTotalInvestment: number }} withdrawal
 */
const sendWithdrawalDecisionEmail = (customerEmail, customerName, { status, amount, withdrawalDate, previousTotalInvestment, newTotalInvestment }) => {
  const completed = status === 'completed';
  const totalRows = completed
    ? [
        ['Previous total investment', formatInr(previousTotalInvestment)],
        ['Amount withdrawn', `− ${formatInr(amount)}`],
        ['New total investment', formatInr(newTotalInvestment), true],
      ]
    : [['Total investment (unchanged)', formatInr(newTotalInvestment), true]];

  const html = renderEmail({
    preheader: completed
      ? `Your withdrawal of ${formatInr(amount)} has been completed. New total: ${formatInr(newTotalInvestment)}.`
      : `An update on your withdrawal request of ${formatInr(amount)}.`,
    tone: completed ? 'success' : 'danger',
    badge: completed ? 'Withdrawal completed' : 'Not processed',
    title: completed ? 'Your withdrawal has been completed' : 'Update on your withdrawal request',
    name: customerName,
    paragraphs: [
      completed
        ? 'Your withdrawal has been processed and the amount has been transferred to your registered bank account.'
        : 'Your withdrawal request could not be processed at this time.',
    ],
    highlight: { label: 'Withdrawal amount', value: formatInr(amount) },
    sections: [
      { heading: 'Request details', rows: [['Requested for', formatDisplayDate(withdrawalDate)], ['Status', completed ? 'Completed' : 'Not processed']] },
      { heading: 'Your total investment', rows: totalRows },
    ],
    note: completed
      ? 'Depending on your bank, it can take up to 1–2 business days for the amount to reflect in your account.'
      : 'Please reach out to your investment head for more details or to raise a new request.',
    cta: dashboardCta(),
    footer: TRANSACTION_FOOTER,
  });
  const subject = completed ? `Withdrawal completed: ${formatInr(amount)}` : 'Update on your Fortune First withdrawal request';
  return deliver({ to: customerEmail, subject, html, label: 'Withdrawal decision' });
};

// ── Account & security ─────────────────────────────────────────────────────

const sendPasswordResetEmail = (customerEmail, resetToken) => {
  const resetLink = `${primaryOrigin}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const html = renderEmail({
    preheader: 'Use this link to set a new password. It expires in 15 minutes.',
    tone: 'info',
    badge: 'Security',
    title: 'Reset your password',
    paragraphs: [
      'We received a request to reset the password for your Fortune First account.',
      'Click the button below to choose a new password. For your security, this link expires in 15 minutes and can be used only once.',
    ],
    note: 'If you didn’t request a password reset, you can safely ignore this email — your password will stay the same.',
    cta: { label: 'Reset password', url: resetLink },
    footer: 'For your security, never share this link with anyone. Fortune First will never ask you for your password.',
  });
  return deliver({ to: customerEmail, from: FROM_SECURITY, subject: 'Reset your Fortune First password', html, label: 'Password reset' });
};

// FR-ADMIN-11: sent when an admin creates the account in User Management —
// the final onboarding step, carrying the login credentials and (for a
// customer with an investment head assigned) that head's contact details.
const sendOnboardingEmail = (email, name, tempPassword, investmentHead) => {
  const sections = [{ heading: 'Your login details', rows: [['Email', email], ['Temporary password', tempPassword]] }];
  if (investmentHead) {
    sections.push({
      heading: 'Your dedicated investment head',
      rows: [['Name', investmentHead.name], ['Phone', investmentHead.phone || 'N/A']],
    });
  }
  const html = renderEmail({
    preheader: 'Your Fortune First account is ready. Here are your login details.',
    tone: 'success',
    badge: 'Welcome aboard',
    title: `Welcome to Fortune First, ${name}!`,
    paragraphs: [
      "You're officially part of the Fortune First family. Your account has been created and is ready to use.",
      "For your security, you'll be asked to set a new password the first time you log in.",
    ],
    sections,
    cta: { label: 'Log in to Fortune First', url: `${primaryOrigin}/login` },
    footer: 'Please keep your login details private. Fortune First will never ask you for your password.',
  });
  return deliver({ to: email, subject: 'Welcome to Fortune First — your account is ready', html, label: 'Onboarding' });
};

// ── Join requests (public "join now" form) ─────────────────────────────────

// FR-PUBLIC-19/ADMIN-10: auto-reply the moment a public join request is submitted.
const sendJoinRequestReceivedEmail = (email, name) => {
  const html = renderEmail({
    preheader: "We've received your request to join Fortune First.",
    tone: 'pending',
    badge: 'Request received',
    title: 'Thank you for your interest',
    name,
    paragraphs: [
      "We've received your request to join Fortune First and our team is currently reviewing it.",
      "You'll receive an update shortly — usually within 2–3 business days.",
    ],
    footer: 'You are receiving this email because this address was used on the Fortune First "Join Now" form.',
  });
  return deliver({ to: email, subject: "We've received your request to join Fortune First", html, label: 'Join request received' });
};

// FR-ADMIN-11: sent when an admin approves a join request — before the
// account exists, so it promises credentials "soon" rather than including them.
const sendJoinRequestApprovedEmail = (email, name) => {
  const html = renderEmail({
    preheader: 'Your request to join Fortune First has been accepted.',
    tone: 'success',
    badge: 'Request accepted',
    title: `Congratulations, ${name}!`,
    paragraphs: [
      "We're pleased to let you know that your request to join Fortune First has been accepted.",
      "An investment head will be assigned to you shortly, and you'll receive your account login details by email once that's done.",
    ],
    footer: 'You are receiving this email because you requested to join Fortune First.',
  });
  return deliver({ to: email, subject: 'Your Fortune First request has been accepted!', html, label: 'Join request approved' });
};

// FR-ADMIN-11: sent when an admin rejects a join request.
const sendJoinRequestRejectedEmail = (email, name) => {
  const html = renderEmail({
    preheader: 'An update on your request to join Fortune First.',
    tone: 'danger',
    badge: 'Request update',
    title: 'Update on your request',
    name,
    paragraphs: [
      "Thank you for your interest in Fortune First. After careful review, we're unable to move forward with your request to join at this time.",
      'We appreciate the time you took to apply and wish you the very best.',
    ],
    footer: 'You are receiving this email because you requested to join Fortune First.',
  });
  return deliver({ to: email, subject: 'Update on your Fortune First request', html, label: 'Join request rejected' });
};

// ── Investment head → client ───────────────────────────────────────────────

// FR-IH-07: board member composes and sends a free-form email to a client.
const sendCustomEmail = (customerEmail, subject, message) => {
  const html = renderEmail({
    preheader: String(message || '').slice(0, 120),
    tone: 'info',
    badge: 'Message from Fortune First',
    title: subject,
    paragraphsHtml: String(message || '')
      .split(/\r?\n\s*\r?\n/)
      .filter((block) => block.trim())
      .map(escapeMultiline),
    cta: dashboardCta(),
  });
  return deliver({ to: customerEmail, subject, html, label: 'Custom' });
};

// FR-IH-06: board member emails a client's PDF report, with the PDF attached.
const sendReportEmail = (customerEmail, customerName, pdfBuffer) => {
  const html = renderEmail({
    preheader: 'Your latest Fortune First investment report is attached.',
    tone: 'info',
    badge: 'Investment report',
    title: 'Your investment report is ready',
    name: customerName,
    paragraphs: [
      'Please find your latest Fortune First investment report attached to this email as a PDF.',
      'It includes your month-by-month payout history and a summary of your returns.',
    ],
    cta: dashboardCta(),
  });
  return deliver({
    to: customerEmail,
    subject: 'Your Fortune First Investment Report',
    html,
    attachments: [{ filename: 'Fortune_First_Report.pdf', content: pdfBuffer.toString('base64') }],
    label: 'Report',
  });
};

module.exports = {
  sendPayoutEmail,
  sendInvestmentReceivedEmail,
  sendInvestmentDecisionEmail,
  sendWithdrawalRequestedEmail,
  sendWithdrawalDecisionEmail,
  sendPasswordResetEmail,
  sendJoinRequestReceivedEmail,
  sendJoinRequestApprovedEmail,
  sendJoinRequestRejectedEmail,
  sendOnboardingEmail,
  sendCustomEmail,
  sendReportEmail,
};
