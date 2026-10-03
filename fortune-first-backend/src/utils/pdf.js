// HTML → PDF rendering with headless Chromium (Puppeteer).

// Repeated at the bottom of every page. Puppeteer fills .pageNumber /
// .totalPages; header/footer templates can't use external styles, so
// everything is inline.
const FOOTER_TEMPLATE = `
  <div style="width:100%;padding:0 44px;font-family:'Segoe UI','Noto Sans','DejaVu Sans',Arial,sans-serif;font-size:8px;color:#8a8f98;display:flex;justify-content:space-between;align-items:center;">
    <span>Fortune First &middot; Private &amp; Confidential</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`;

/**
 * @param {string} html - a complete, self-contained HTML document (images as data URIs)
 * @returns {Promise<Buffer>} A4 PDF
 */
const htmlToPdf = async (html) => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    // Everything is inlined, so there's nothing to wait on beyond the DOM.
    await page.setContent(html, { waitUntil: 'load', timeout: 20000 });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: FOOTER_TEMPLATE,
      margin: { top: '36px', bottom: '54px', left: '0', right: '0' },
    });
    // Recent Puppeteer returns a Uint8Array — Express's res.send() only sends
    // raw binary for real Buffer instances.
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
};

module.exports = { htmlToPdf };
