const puppeteer = require('puppeteer');

const generateReportPDF = async (clientName, historyData) => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Create an HTML template string using the fetched history data
  let tableRows = historyData.map(record => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${record.month}/${record.year}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">₹${record.invested_amount}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${record.return_pct}%</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">₹${record.payout_amount}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1E1E1E; }
          .header { text-align: center; border-bottom: 2px solid #1A3C5E; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #1A3C5E; margin: 0; }
          .client-info { margin-bottom: 30px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #1A3C5E; color: white; padding: 10px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fortune First Pvt.</h1>
          <p>Investment Performance Report</p>
        </div>
        <div class="client-info">
          <p><strong>Prepared for:</strong> ${clientName}</p>
          <p><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <table>
          <thead>
            <tr><th>Period</th><th>Invested</th><th>Return %</th><th>Payout</th></tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `;

  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  
  return pdfBuffer;
};

module.exports = { generateReportPDF };