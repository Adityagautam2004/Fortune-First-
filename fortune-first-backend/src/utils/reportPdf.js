const fs = require('fs');
const path = require('path');
// Lazy-required inside generateMonthlyReportPdf (not here at module scope):
// this file is pulled in transitively by board.routes.js just to register
// routes, so a top-level `require('puppeteer')` would load — and, under
// Jest, fail to parse — puppeteer on every test run that merely imports the
// app, never on module load itself. Same reasoning as the inline
// require('../utils/cloudinary') calls in admin.controller.js.

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const LOGO_BASE64 = fs.readFileSync(path.join(__dirname, '../assets/logo.png')).toString('base64');

const nextMonthLabel = (month, year) => {
  const next = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${MONTH_NAMES[next - 1]} ${nextYear}`;
};

const money = (value) => {
  const num = Number(value) || 0;
  const formatted = Math.abs(num).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return `${num < 0 ? '-' : ''}₹${formatted}/-`;
};

const signedMoney = (value) => {
  const num = Number(value) || 0;
  return num < 0 ? `(${money(Math.abs(num))})` : money(num);
};

const pct = (value) => `${Number(value).toFixed(2)}%`;
const esc = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const colorClass = (value) => (Number(value) < 0 ? 'neg' : 'pos');

/**
 * Renders the firm-wide Monthly Report into a polished, professional PDF —
 * mirrors the layout of the original hand-authored reports (headline
 * bullets, Payout/Withdrawals/Investments/Investment Pattern/Operating
 * Capital sections) plus a complete per-head data table so nothing captured
 * in the form is left out of the generated copy.
 * @param {object} report - a monthly_reports row (snake_case columns)
 * @returns {Promise<Buffer>}
 */
const generateMonthlyReportPdf = async (report) => {
  const monthLabel = `${MONTH_NAMES[report.month - 1]} ${report.year}`;
  const nextLabel = nextMonthLabel(report.month, report.year);
  const members = report.members || [];
  const investmentPattern = report.investment_pattern || [];
  const partnerPayouts = report.partner_payouts || [];

  const profitBreakdown = members
    .filter((m) => Number(m.profitLossAmount) !== 0)
    .map((m) => `${esc(m.name)}- <span class="${colorClass(m.profitLossAmount)}">${signedMoney(m.profitLossAmount)}</span>`)
    .join(', ');

  // Not stored fields of their own — the client-payout headline is always
  // the sum of each investment head's own clientMoney/payoutAmount, so it
  // can never drift out of sync with the breakdown table below it.
  const totalClientMoney = members.reduce((sum, m) => sum + (Number(m.clientMoney) || 0), 0);
  const totalClientPayout = members.reduce((sum, m) => sum + (Number(m.payoutAmount) || 0), 0);
  const avgClientPayoutPct = totalClientMoney > 0 ? (totalClientPayout / totalClientMoney) * 100 : 0;
  const hasClientPayoutData = totalClientMoney > 0 || totalClientPayout > 0;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 36px 44px; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; font-size: 12px; line-height: 1.55; margin: 0; }
  .header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #1a1a2e; padding-bottom: 12px; margin-bottom: 6px; }
  .header img { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; }
  .header h1 { font-size: 22px; margin: 0; letter-spacing: 0.5px; }
  .header p { font-size: 12px; margin: 2px 0 0; color: #555; font-weight: 600; }
  .title { font-size: 17px; font-weight: 700; text-decoration: underline; margin: 22px 0 14px; }
  ul.bullets { margin: 0 0 18px; padding-left: 20px; }
  ul.bullets li { margin-bottom: 7px; }
  .pos { color: #0a8a3f; font-weight: 700; }
  .neg { color: #c0202f; font-weight: 700; }
  .highlight-green { background: #c6f6d5; padding: 1px 6px; border-radius: 3px; font-weight: 700; }
  .highlight-red { background: #fed7d7; padding: 1px 6px; border-radius: 3px; font-weight: 700; }
  h2.section { font-size: 14px; font-weight: 700; text-decoration: underline; margin: 20px 0 8px; }
  ul.plain { margin: 0 0 4px; padding-left: 20px; }
  ul.plain li { margin-bottom: 4px; }
  .empty-note { color: #888; font-style: italic; margin: 0 0 4px 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10.5px; }
  th, td { border: 1px solid #d8d8e0; padding: 6px 8px; text-align: left; }
  th { background: #1a1a2e; color: #fff; font-weight: 600; }
  tr:nth-child(even) td { background: #f7f7fb; }
  .footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 9.5px; color: #999; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <img src="data:image/png;base64,${LOGO_BASE64}" alt="Fortune First" />
    <div>
      <h1>MONTHLY REPORT</h1>
      <p>Fortune First</p>
    </div>
  </div>

  <div class="title">${esc(monthLabel)} Result and Record</div>

  <ul class="bullets">
    <li>Overall profit ${pct(report.overall_profit_percentage)} of ${money(report.total_aum_next_month)} = <span class="${colorClass(report.overall_profit_amount)}">${signedMoney(report.overall_profit_amount)}</span>${profitBreakdown ? ` (${profitBreakdown})` : ''}.</li>
    <li>NAV = ${Number(report.nav_updated).toFixed(2)}.</li>
    ${hasClientPayoutData ? `<li>Clients payout percentage for ${MONTH_NAMES[report.month - 1]} is ${pct(avgClientPayoutPct)} and is valued at ${money(totalClientMoney)} and is = ${money(totalClientPayout)}.</li>` : ''}
  </ul>

  ${partnerPayouts.length ? `
  <h2 class="section">Payout (1st ${esc(nextLabel.split(' ')[0])}) :-</h2>
  <ul class="plain">
    ${partnerPayouts.map((p) => `<li>${esc(p.name)} ➡️ ${pct(p.percentage)} of ${MONTH_NAMES[report.month - 1]} = <b>${money(p.amount)}</b>${p.status ? ` (${esc(p.status.toUpperCase())})` : ''}.</li>`).join('')}
  </ul>
  ` : ''}

  <h2 class="section">Updated Investment Pattern For ${esc(nextLabel)} :-</h2>
  <ul class="plain">
    ${investmentPattern.map((m) => `<li>${esc(m.name)} = ${money(m.amount)}</li>`).join('')}
  </ul>

  <h2 class="section">Operating Capital For the month of ${esc(nextLabel.split(' ')[0])} :- <span class="highlight-green">${money(report.operating_capital_total)}</span></h2>
  <ul class="plain">
    ${members.map((m) => `<li>${esc(m.name)} -> <span class="highlight-green">${money(m.personalAum)}</span></li>`).join('')}
  </ul>

  ${members.length ? `
  <h2 class="section">Investment Head Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th><th>Personal AUM</th><th>P&amp;L</th><th>R&amp;D Cost</th>
        <th>Investment Recv.</th><th>Withdrawal</th><th>Client Money</th><th>Payout %</th><th>Payout Amount</th>
      </tr>
    </thead>
    <tbody>
      ${members.map((m) => `
        <tr>
          <td>${esc(m.name)}</td>
          <td>${money(m.personalAum)}</td>
          <td class="${colorClass(m.profitLossAmount)}">${signedMoney(m.profitLossAmount)}</td>
          <td>${money(m.rdCost)}</td>
          <td>${money(m.investmentReceived)}</td>
          <td>${money(m.withdrawalAmount)}</td>
          <td>${money(m.clientMoney)}</td>
          <td>${pct(m.payoutPercentage)}</td>
          <td>${money(m.payoutAmount)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  ${report.notes ? `<h2 class="section">Notes</h2><p>${esc(report.notes)}</p>` : ''}

  <div class="footer">Generated by Fortune First on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} — Confidential, for internal circulation only.</div>
</body>
</html>`;

  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    // puppeteer returns a Uint8Array here — wrap it, or Express silently
    // JSON-serializes it byte-by-byte instead of sending real PDF bytes.
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};

module.exports = { generateMonthlyReportPdf };
