const db = require('../models/db');
// const { resend } = require('../utils/mailer'); // Assuming you set up Resend earlier

const submitJoinRequest = async (req, res) => {
  try {
    const { name, email, phone, amount, message } = req.body;

    await db.query(
      `INSERT INTO join_requests (name, email, phone, amount, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, phone, amount, message]
    );

    // Optional: Send auto-reply to the user (as per SRS)
    /*
    await resend.emails.send({
      from: 'Fortune First <info@fortunefirst.com>',
      to: email,
      subject: 'We received your request to join Fortune First',
      html: '<p>Thank you for your interest. We will contact you within 2-3 business days.</p>'
    });
    */

    return res.status(201).json({ status: 'success', message: 'Request submitted successfully' });
  } catch (error) {
    console.error('Join Request Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to submit request' });
  }
};

// GET /public/returns — FR-PUBLIC-10/11: monthly return history for the landing page chart
const getPublicReturns = async (req, res) => {
  try {
    const returns = await db.query(
      `SELECT month, year, return_pct, notes FROM public_returns ORDER BY year ASC, month ASC`
    );
    return res.status(200).json({ status: 'success', data: returns.rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch return history' });
  }
};

// GET /public/testimonials — FR-PUBLIC-17: visible client testimonials
const getPublicTestimonials = async (req, res) => {
  try {
    const testimonials = await db.query(
      `SELECT client_name, content, rating FROM testimonials WHERE is_visible = TRUE ORDER BY created_at DESC`
    );
    return res.status(200).json({ status: 'success', data: testimonials.rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch testimonials' });
  }
};

// GET /public/blog — FR-PUBLIC-23: published posts only
const getPublishedBlogPosts = async (req, res) => {
  try {
    const posts = await db.query(
      `SELECT id, title, slug, published_at,
              LEFT(content, 200) AS excerpt, author_id
       FROM blog_posts WHERE is_published = TRUE ORDER BY published_at DESC`
    );
    return res.status(200).json({ status: 'success', data: posts.rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch blog posts' });
  }
};

// GET /public/blog/:slug — FR-PUBLIC-24: single published post
const getBlogPostBySlug = async (req, res) => {
  try {
    const post = await db.query(
      `SELECT b.id, b.title, b.slug, b.content, b.published_at, u.name AS author_name
       FROM blog_posts b LEFT JOIN users u ON u.id = b.author_id
       WHERE b.slug = $1 AND b.is_published = TRUE`,
      [req.params.slug]
    );
    if (post.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Post not found' });
    }
    return res.status(200).json({ status: 'success', data: post.rows[0] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch blog post' });
  }
};

// ── Financial calculators (FR-PUBLIC-13..16) ─────────────────────
// Documented in the SRS endpoint catalogue as public GET endpoints, even
// though FR-PUBLIC-16 says the frontend computes these client-side — kept
// as pure, side-effect-free math so both can be true: the frontend can call
// these or compute locally, and the catalogue's contract is honored either way.

const sipCalculator = (req, res) => {
  const monthlyInvestment = parseFloat(req.query.monthlyInvestment);
  const expectedReturnPct = parseFloat(req.query.expectedReturnPct);
  const years = parseFloat(req.query.years);

  if ([monthlyInvestment, expectedReturnPct, years].some((v) => Number.isNaN(v) || v < 0)) {
    return res.status(400).json({ status: 'error', message: 'monthlyInvestment, expectedReturnPct and years must be non-negative numbers' });
  }

  const months = years * 12;
  const monthlyRate = expectedReturnPct / 12 / 100;
  const investedAmount = monthlyInvestment * months;
  const totalValue = monthlyRate === 0
    ? investedAmount
    : monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  const estimatedReturns = totalValue - investedAmount;

  return res.status(200).json({
    status: 'success',
    data: {
      investedAmount: parseFloat(investedAmount.toFixed(2)),
      estimatedReturns: parseFloat(estimatedReturns.toFixed(2)),
      totalValue: parseFloat(totalValue.toFixed(2)),
    },
  });
};

const emiCalculator = (req, res) => {
  const principal = parseFloat(req.query.principal);
  const annualRate = parseFloat(req.query.annualRate);
  const tenureMonths = parseFloat(req.query.tenureMonths);

  if ([principal, annualRate, tenureMonths].some((v) => Number.isNaN(v) || v < 0)) {
    return res.status(400).json({ status: 'error', message: 'principal, annualRate and tenureMonths must be non-negative numbers' });
  }

  const monthlyRate = annualRate / 12 / 100;
  const emi = monthlyRate === 0
    ? principal / tenureMonths
    : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  return res.status(200).json({
    status: 'success',
    data: {
      monthlyEMI: parseFloat(emi.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      totalPayment: parseFloat(totalPayment.toFixed(2)),
    },
  });
};

const retirementCalculator = (req, res) => {
  const currentAge = parseFloat(req.query.currentAge);
  const retirementAge = parseFloat(req.query.retirementAge);
  const monthlySavings = parseFloat(req.query.monthlySavings);
  const expectedReturnPct = parseFloat(req.query.expectedReturnPct);

  if ([currentAge, retirementAge, monthlySavings, expectedReturnPct].some((v) => Number.isNaN(v) || v < 0) || retirementAge <= currentAge) {
    return res.status(400).json({ status: 'error', message: 'Invalid input — retirementAge must be greater than currentAge, all values non-negative' });
  }

  const months = (retirementAge - currentAge) * 12;
  const monthlyRate = expectedReturnPct / 12 / 100;
  const corpusAtRetirement = monthlyRate === 0
    ? monthlySavings * months
    : monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

  return res.status(200).json({
    status: 'success',
    data: { corpusAtRetirement: parseFloat(corpusAtRetirement.toFixed(2)) },
  });
};

module.exports = {
  submitJoinRequest,
  getPublicReturns,
  getPublicTestimonials,
  getPublishedBlogPosts,
  getBlogPostBySlug,
  sipCalculator,
  emiCalculator,
  retirementCalculator,
};