const fs = require('fs');
const path = require('path');

const LOGO_BASE64 = fs.readFileSync(path.join(__dirname, '../assets/logo.png')).toString('base64');

const money = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const esc = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Renders a client's investment performance report as an official-looking
 * PDF — company letterhead, the client's own profile picture and details,
 * a plain-English summary up top, then the full period-by-period table.
 * Used both for the customer's own "Download Report" button and for an
 * investment_head emailing a client their report.
 * @param {{ name: string, email: string, phone?: string|null, profile_picture_url?: string|null, client_code?: string|null }} client
 * @param {{ month: number, year: number, invested_amount: number, return_pct: number, payout_amount: number }[]} historyData
 * @returns {Promise<Buffer>}
 */
const generateReportPDF = async (client, historyData) => {
  const rows = [...historyData].sort((a, b) => (b.year - a.year) || (b.month - a.month));
  const isSingleMonth = rows.length === 1;
  const periodLabel = isSingleMonth
    ? `${MONTH_NAMES[rows[0].month - 1]} ${rows[0].year}`
    : rows.length > 0
      ? `${MONTH_NAMES[rows[rows.length - 1].month - 1]} ${rows[rows.length - 1].year} – ${MONTH_NAMES[rows[0].month - 1]} ${rows[0].year}`
      : 'No activity yet';

  const totalInvested = rows.length ? Number(rows[0].invested_amount) : 0; // most recent snapshot
  const totalPayout = rows.reduce((sum, r) => sum + Number(r.payout_amount), 0);
  const avgReturnPct = rows.length ? rows.reduce((sum, r) => sum + Number(r.return_pct), 0) / rows.length : 0;

  const tableRows = rows.map((r) => `
    <tr>
      <td>${MONTH_NAMES[r.month - 1]} ${r.year}</td>
      <td>${money(r.invested_amount)}</td>
      <td>${Number(r.return_pct).toFixed(2)}%</td>
      <td>${money(r.payout_amount)}</td>
    </tr>
  `).join('');

  const avatarBlock = client.profile_picture_url
    ? `<img src="${client.profile_picture_url}" class="avatar" alt="${esc(client.name)}" />`
    : `<div class="avatar avatar-fallback">${esc((client.name || '?').trim().charAt(0).toUpperCase())}</div>`;

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
  .header h1 { font-size: 20px; margin: 0; letter-spacing: 0.5px; }
  .header p { font-size: 11px; margin: 2px 0 0; color: #555; font-weight: 600; }
  .doc-title { font-size: 16px; font-weight: 700; margin: 22px 0 4px; }
  .doc-subtitle { font-size: 11.5px; color: #666; margin: 0 0 20px; }
  .client-card { display: flex; align-items: center; gap: 16px; border: 1px solid #e2e2ea; border-radius: 10px; padding: 16px; margin-bottom: 20px; background: #fafafc; }
  .avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .avatar-fallback { display: flex; align-items: center; justify-content: center; background: #1a1a2e; color: #fff; font-size: 20px; font-weight: 700; }
  .client-card .name { font-size: 15px; font-weight: 700; margin: 0 0 4px; }
  .client-card .meta { font-size: 11px; color: #555; margin: 1px 0; }
  .summary { display: flex; gap: 12px; margin-bottom: 22px; }
  .summary-tile { flex: 1; border: 1px solid #e2e2ea; border-radius: 10px; padding: 14px 16px; }
  .summary-tile .label { font-size: 10px; color: #777; text-transform: uppercase; letter-spacing: 0.4px; }
  .summary-tile .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
  .intro { margin-bottom: 20px; color: #333; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
  th, td { border: 1px solid #e2e2ea; padding: 8px 10px; text-align: left; }
  th { background: #1a1a2e; color: #fff; font-weight: 600; }
  tr:nth-child(even) td { background: #f7f7fb; }
  .closing { color: #333; margin-bottom: 6px; }
  .footer { margin-top: 22px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 9.5px; color: #999; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <img src="data:image/png;base64,${LOGO_BASE64}" alt="Fortune First" />
    <div>
      <h1>FORTUNE FIRST</h1>
      <p>Investment Management</p>
    </div>
  </div>

  <div class="doc-title">Investment Performance Report</div>
  <p class="doc-subtitle">${esc(periodLabel)} · Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

  <div class="client-card">
    ${avatarBlock}
    <div>
      <p class="name">${esc(client.name)}</p>
      <p class="meta">${esc(client.email)}${client.phone ? ` · ${esc(client.phone)}` : ''}</p>
      ${client.client_code ? `<p class="meta">Client ID: ${esc(client.client_code)}</p>` : ''}
    </div>
  </div>

  <div class="summary">
    <div class="summary-tile">
      <p class="label">Current Investment</p>
      <p class="value">${money(totalInvested)}</p>
    </div>
    <div class="summary-tile">
      <p class="label">Total Payout Received</p>
      <p class="value">${money(totalPayout)}</p>
    </div>
    <div class="summary-tile">
      <p class="label">Average Monthly Return</p>
      <p class="value">${avgReturnPct.toFixed(2)}%</p>
    </div>
  </div>

  <p class="intro">
    Dear ${esc(client.name.split(' ')[0])}, thank you for continuing to trust Fortune First with your investments.
    Below is a summary of your monthly returns${isSingleMonth ? ` for ${esc(periodLabel)}` : ' to date'},
    reflecting the amount invested, the return percentage applied, and the payout credited for each period.
  </p>

  <table>
    <thead>
      <tr><th>Period</th><th>Invested</th><th>Return %</th><th>Payout</th></tr>
    </thead>
    <tbody>${tableRows || '<tr><td colspan="4" style="text-align:center;color:#888;">No records for this period.</td></tr>'}</tbody>
  </table>

  <p class="closing">
    Should you have any questions about this report or your investment, please reach out to your
    relationship manager or write to us at <strong>info@fortunefirst.in</strong>. We're glad to have you with us.
  </p>
  <p class="closing">Warm regards,<br/>The Fortune First Team</p>

  <div class="footer">This is a system-generated report from Fortune First — Confidential, intended solely for the named recipient.</div>
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
    // networkidle0 — the client's profile picture is a remote Cloudinary
    // URL; without waiting for it to load, the PDF can render with a blank
    // avatar.
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    // This puppeteer version returns a plain Uint8Array, not a Node Buffer —
    // Express's res.send() only sends raw binary for actual Buffer instances,
    // otherwise it silently falls through to JSON-serializing it byte-by-byte.
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};

module.exports = { generateReportPDF };
