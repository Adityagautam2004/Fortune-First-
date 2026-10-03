const fs = require('fs');
const path = require('path');

// HTML for the client investment statement PDF (rendered by utils/pdf.js).
// Self-contained: fonts are system fonts, images are inlined as data URIs.

const LOGO = `data:image/png;base64,${fs.readFileSync(path.join(__dirname, '../assets/report-logo.png')).toString('base64')}`;
const WATERMARK = `data:image/png;base64,${fs.readFileSync(path.join(__dirname, '../assets/report-watermark.png')).toString('base64')}`;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const money = (value) => {
  const n = Number(value) || 0;
  const hasPaise = Math.round(n * 100) % 100 !== 0;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: hasPaise ? 2 : 0, maximumFractionDigits: 2 })}`;
};
const pct = (value) => `${(Number(value) || 0).toFixed(2)}%`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// 'YYYY-MM-DD' strings or Dates (pg DATE columns arrive as local-midnight Dates).
const toDate = (value) => {
  if (value instanceof Date) return value;
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
};
const fmtDate = (value) => {
  if (!value) return '—';
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};

const STYLES = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', 'Noto Sans', 'DejaVu Sans', Arial, sans-serif;
    color: #1f2937; font-size: 10.5px; line-height: 1.55;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  /* position:fixed repeats on every printed page */
  .watermark { position: fixed; top: 50%; left: 50%; width: 62%; transform: translate(-50%, -50%); opacity: 0.07; z-index: 0; }
  .watermark img { width: 100%; }
  .page { position: relative; z-index: 1; padding: 0 44px; }

  .band { display: flex; justify-content: space-between; align-items: center; background: #0f1b2d; color: #fff; padding: 16px 44px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { width: 46px; height: 46px; border-radius: 50%; background: #fff; }
  .brand .name { font-size: 17px; font-weight: 800; letter-spacing: 1.5px; }
  .brand .name span { color: #f97316; }
  .brand .tag { font-size: 8.5px; letter-spacing: 1.6px; text-transform: uppercase; color: #9ca3af; margin-top: 1px; }
  .doc-meta { text-align: right; }
  .doc-meta .title { font-size: 14px; font-weight: 700; }
  .doc-meta .line { font-size: 9px; color: #cbd5e1; margin-top: 2px; }
  .accent { height: 4px; background: #f97316; margin: 0 -44px 18px; }

  .client { display: flex; gap: 18px; align-items: center; border: 1px solid #e5e1d8; border-radius: 12px; padding: 12px 18px; background: rgba(250, 248, 245, 0.85); }
  .photo { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 0 0 1px #e5e1d8; flex-shrink: 0; }
  .photo-fallback { display: flex; align-items: center; justify-content: center; background: #0f1b2d; color: #fff; font-size: 26px; font-weight: 800; }
  .client-main { flex: 1; }
  .client-name { font-size: 16px; font-weight: 800; color: #0f1b2d; margin: 0; }
  .client-id { display: inline-block; margin-top: 4px; padding: 2px 10px; border-radius: 999px; background: #fff1e6; color: #c2410c; font-size: 9.5px; font-weight: 700; letter-spacing: 0.6px; }
  .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-top: 8px; }
  .kv .k { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.7px; color: #8a8f98; }
  .kv .v { font-size: 10.5px; font-weight: 600; color: #1f2937; word-break: break-word; }

  h2 { font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #f97316; margin: 16px 0 7px; break-after: avoid; }
  p { margin: 0 0 6px; }
  .lead { font-size: 11px; color: #374151; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .panel { border: 1px solid #e5e1d8; border-radius: 10px; padding: 10px 14px; background: rgba(255, 255, 255, 0.7); break-inside: avoid; }
  .panel-title { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; margin-bottom: 6px; }
  .row { display: flex; justify-content: space-between; padding: 5px 0; border-top: 1px solid #f0ece4; }
  .row:first-of-type { border-top: 0; }
  .row .l { color: #6b7280; }
  .row .r { font-weight: 600; }
  .row.total { border-top: 2px solid #0f1b2d; }
  .row.total .l, .row.total .r { color: #0f1b2d; font-weight: 800; font-size: 11.5px; }
  .big { font-size: 22px; font-weight: 800; color: #0f1b2d; margin: 0 0 6px; }

  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th { background: #0f1b2d; color: #fff; font-weight: 600; text-align: left; padding: 6px 10px; }
  th.num, td.num { text-align: right; }
  td { padding: 6px 10px; border-bottom: 1px solid #ece7df; }
  tbody tr:nth-child(even) td { background: rgba(247, 245, 241, 0.6); }
  tfoot td { font-weight: 800; color: #0f1b2d; border-top: 2px solid #0f1b2d; border-bottom: 0; background: rgba(255, 247, 237, 0.75); }
  .pill { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; }
  .pill.in { background: #ecfdf5; color: #047857; }
  .pill.out { background: #fef2f2; color: #b91c1c; }
  .empty { padding: 10px; text-align: center; color: #8a8f98; border: 1px dashed #e5e1d8; border-radius: 10px; }

  .tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .tile { border: 1px solid #e5e1d8; border-radius: 10px; padding: 9px 12px; background: rgba(250, 248, 245, 0.7); break-inside: avoid; }
  .tile .k { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.7px; color: #8a8f98; }
  .tile .v { font-size: 13.5px; font-weight: 800; color: #0f1b2d; margin-top: 3px; }

  .notes { font-size: 8.5px; color: #6b7280; padding-left: 14px; margin: 0; columns: 2; column-gap: 26px; }
  .notes li { margin-bottom: 3px; break-inside: avoid; }
  .closing { break-inside: avoid; }
  .signoff { margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-end; }
  .signoff .team { font-weight: 800; color: #0f1b2d; }
  .signoff .small { font-size: 8.5px; color: #8a8f98; margin-top: 6px; }
`;

const capitalNarrative = (s) => {
  const parts = [];
  if (s.added > 0) parts.push(`${money(s.added)} was added across ${plural(s.investmentCount, 'new investment')}`);
  if (s.withdrawn > 0) parts.push(`${money(s.withdrawn)} was withdrawn across ${plural(s.withdrawalCount, 'withdrawal')}`);
  if (!parts.length) return `Your active investment remained steady at ${money(s.closingBalance)} throughout the period, with no new investments or withdrawals.`;
  return `Your active investment moved from ${money(s.openingBalance)} to ${money(s.closingBalance)} during the period: ${parts.join(', and ')}.`;
};

const returnsNarrative = (s) =>
  s.payoutCount > 0
    ? `Fortune First credited ${money(s.totalPayouts)} to you through ${plural(s.payoutCount, 'monthly payout')}, an average return of ${pct(s.avgMonthlyReturn)} per month on your active investment.`
    : 'No monthly payouts were credited for this period.';

/**
 * @param {{ profile: object, photo: string|null, period: object, summary: object, payouts: object[],
 *   movements: object[], lifetime: object, generatedAt: Date }} data
 */
const renderStatementHtml = ({ profile, photo, period, summary: s, payouts, movements, lifetime, generatedAt }) => {
  const firstName = String(profile.name || '').trim().split(/\s+/)[0] || 'Investor';
  const toDateSuffix = period.isOpen && period.type !== 'full' ? ' (to date)' : '';
  const reference = `FF/STMT/${profile.client_code || 'NA'}/${period.cacheSuffix.toUpperCase()}`;
  const photoBlock = photo
    ? `<img class="photo" src="${photo}" alt="" />`
    : `<div class="photo photo-fallback">${esc(firstName.charAt(0).toUpperCase())}</div>`;

  const payoutRows = payouts
    .map(
      (p) => `
        <tr>
          <td>${MONTH_NAMES[p.month - 1]} ${p.year}</td>
          <td class="num">${money(p.invested_amount)}</td>
          <td class="num">${pct(p.return_pct)}</td>
          <td class="num">${money(p.payout_amount)}</td>
          <td>${fmtDate(p.payout_date)}</td>
        </tr>`
    )
    .join('');

  const movementRows = movements
    .map(
      (m) => `
        <tr>
          <td>${fmtDate(m.date)}</td>
          <td><span class="pill ${m.type === 'investment' ? 'in' : 'out'}">${m.type === 'investment' ? 'Investment' : 'Withdrawal'}</span></td>
          <td>${m.type === 'investment' ? 'Capital added to your account' : 'Capital withdrawn to your bank account'}</td>
          <td class="num">${m.type === 'investment' ? '+' : '−'} ${money(m.amount)}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(period.title)} — ${esc(profile.name)}</title>
<style>${STYLES}</style>
</head>
<body>
  <div class="watermark"><img src="${WATERMARK}" alt="" /></div>

  <div class="band">
    <div class="brand">
      <img src="${LOGO}" alt="Fortune First" />
      <div>
        <div class="name">FORTUNE <span>FIRST</span></div>
        <div class="tag">Wealth, managed with care</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="title">${esc(period.title)}</div>
      <div class="line">Period: ${esc(period.label)}${toDateSuffix}</div>
      <div class="line">Statement date: ${fmtDate(generatedAt)} &middot; Ref: ${esc(reference)}</div>
    </div>
  </div>

  <div class="page">
    <div class="accent"></div>

    <section class="client">
      ${photoBlock}
      <div class="client-main">
        <p class="client-name">${esc(profile.name)}</p>
        <span class="client-id">CLIENT ID: ${esc(profile.client_code || '—')}</span>
        <div class="client-grid">
          <div class="kv"><div class="k">Email</div><div class="v">${esc(profile.email)}</div></div>
          <div class="kv"><div class="k">Phone</div><div class="v">${esc(profile.phone || '—')}</div></div>
          <div class="kv"><div class="k">Relationship manager</div><div class="v">${esc(profile.relationship_manager || '—')}${profile.relationship_manager_phone ? ` &middot; ${esc(profile.relationship_manager_phone)}` : ''}</div></div>
          <div class="kv"><div class="k">Client since</div><div class="v">${fmtDate(profile.created_at)}</div></div>
        </div>
      </div>
    </section>

    <h2>Dear ${esc(firstName)},</h2>
    <p class="lead">
      Thank you for your continued trust in Fortune First. Please find below your ${esc(period.title.toLowerCase())} for
      <strong>${esc(period.label)}</strong>${toDateSuffix}. It sets out the capital you hold with us, the monthly payouts
      credited to you and every movement on your account during the period.
    </p>
    <p class="lead">${esc(capitalNarrative(s))} ${esc(returnsNarrative(s))}</p>

    <h2>Statement summary</h2>
    <div class="two-col">
      <div class="panel">
        <div class="panel-title">Capital summary</div>
        <div class="row"><span class="l">Opening active investment</span><span class="r">${money(s.openingBalance)}</span></div>
        <div class="row"><span class="l">Add: Investments during the period</span><span class="r">+ ${money(s.added)}</span></div>
        <div class="row"><span class="l">Less: Withdrawals during the period</span><span class="r">− ${money(s.withdrawn)}</span></div>
        <div class="row total"><span class="l">Closing active investment</span><span class="r">${money(s.closingBalance)}</span></div>
      </div>
      <div class="panel">
        <div class="panel-title">Returns summary</div>
        <div class="big">${money(s.totalPayouts)}</div>
        <div class="row"><span class="l">Payouts credited</span><span class="r">${s.payoutCount}</span></div>
        <div class="row"><span class="l">Average monthly return</span><span class="r">${pct(s.avgMonthlyReturn)}</span></div>
      </div>
    </div>

    <h2>Monthly payout details</h2>
    ${
      payouts.length
        ? `<table>
      <thead><tr><th>Payout month</th><th class="num">Active investment</th><th class="num">Return rate</th><th class="num">Payout</th><th>Paid on</th></tr></thead>
      <tbody>${payoutRows}</tbody>
      <tfoot><tr><td>Total</td><td></td><td class="num">${pct(s.avgMonthlyReturn)} avg</td><td class="num">${money(s.totalPayouts)}</td><td></td></tr></tfoot>
    </table>`
        : '<div class="empty">No monthly payouts were credited for this period.</div>'
    }

    <h2>Capital movements</h2>
    ${
      movements.length
        ? `<table>
      <thead><tr><th>Date</th><th>Type</th><th>Description</th><th class="num">Amount</th></tr></thead>
      <tbody>${movementRows}</tbody>
    </table>`
        : '<div class="empty">No investments or withdrawals were recorded during this period.</div>'
    }

    <h2>Account overview — as of ${fmtDate(period.asOf)}</h2>
    <div class="tiles">
      <div class="tile"><div class="k">Total invested</div><div class="v">${money(lifetime.totalInvested)}</div></div>
      <div class="tile"><div class="k">Total withdrawn</div><div class="v">${money(lifetime.totalWithdrawn)}</div></div>
      <div class="tile"><div class="k">Active investment</div><div class="v">${money(lifetime.activeInvestment)}</div></div>
      <div class="tile"><div class="k">Total payouts received</div><div class="v">${money(lifetime.totalPayouts)}</div></div>
    </div>

    <div class="closing">
    <h2>Important information</h2>
    <ul class="notes">
      <li>All amounts are in Indian Rupees (INR). Active investment is your total approved investment less completed withdrawals; monthly payouts are calculated on this amount.</li>
      <li>Payouts are listed by the month they relate to. Only payouts that have been credited are included; pending requests are excluded until they are approved.</li>
      <li>Please review this statement and report any discrepancy to your relationship manager or to info@fortunefirst.in within 15 days of the statement date.</li>
      <li>This statement is confidential and intended solely for the named client.</li>
    </ul>

    <div class="signoff">
      <div><div>Warm regards,</div><div class="team">The Fortune First Team</div></div>
      <div class="small">This is a computer-generated statement and does not require a signature.</div>
    </div>
    </div>
  </div>
</body>
</html>`;
};

module.exports = { renderStatementHtml };
