const db = require('../models/db');
const redis = require('../utils/redis');
// const { resend } = require('../utils/mailer'); // Assuming you set up Resend earlier

// These four are the highest-traffic, most shareable routes in the app —
// unauthenticated landing-page content read by every visitor, written only
// occasionally by admins — so they're the clearest caching win in the app.
const PUBLIC_CACHE_TTL_SECONDS = 600;

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

// GET /public/dashboard — the landing page's single combined call: the last
// 12 months of return history (whatever's actually populated, most recent
// first in storage order but returned oldest-to-newest for charting) plus
// every visible testimonial. Saves the landing page from firing two requests
// and gives us one cache key to invalidate from both CMS write paths.
const getPublicDashboard = async (req, res) => {
  try {
    const cacheKey = 'public:dashboard';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ status: 'success', source: 'cache', data: JSON.parse(cached) });
    }

    const [returnsRes, testimonialsRes] = await Promise.all([
      db.query(
        `SELECT * FROM (
           SELECT month, year, return_pct, notes FROM public_returns
           ORDER BY year DESC, month DESC LIMIT 12
         ) last_12_months ORDER BY year ASC, month ASC`
      ),
      db.query(
        `SELECT client_name, city, content, rating FROM testimonials WHERE is_visible = TRUE ORDER BY created_at DESC`
      ),
    ]);

    const data = { returns: returnsRes.rows, testimonials: testimonialsRes.rows };
    await redis.set(cacheKey, JSON.stringify(data), 'EX', PUBLIC_CACHE_TTL_SECONDS);
    return res.status(200).json({ status: 'success', source: 'database', data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard data' });
  }
};

// GET /public/blog — FR-PUBLIC-23: published posts only
const getPublishedBlogPosts = async (req, res) => {
  try {
    const cacheKey = 'public:blog:list';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ status: 'success', source: 'cache', data: JSON.parse(cached) });
    }

    const posts = await db.query(
      `SELECT id, title, slug, published_at,
              LEFT(content, 200) AS excerpt, author_id
       FROM blog_posts WHERE is_published = TRUE ORDER BY published_at DESC`
    );
    await redis.set(cacheKey, JSON.stringify(posts.rows), 'EX', PUBLIC_CACHE_TTL_SECONDS);
    return res.status(200).json({ status: 'success', source: 'database', data: posts.rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch blog posts' });
  }
};

// GET /public/blog/:slug — FR-PUBLIC-24: single published post
const getBlogPostBySlug = async (req, res) => {
  try {
    const cacheKey = `public:blog:post:${req.params.slug}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ status: 'success', source: 'cache', data: JSON.parse(cached) });
    }

    const post = await db.query(
      `SELECT b.id, b.title, b.slug, b.content, b.published_at, u.name AS author_name
       FROM blog_posts b LEFT JOIN users u ON u.id = b.author_id
       WHERE b.slug = $1 AND b.is_published = TRUE`,
      [req.params.slug]
    );
    if (post.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Post not found' });
    }
    await redis.set(cacheKey, JSON.stringify(post.rows[0]), 'EX', PUBLIC_CACHE_TTL_SECONDS);
    return res.status(200).json({ status: 'success', source: 'database', data: post.rows[0] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch blog post' });
  }
};

module.exports = {
  submitJoinRequest,
  getPublicDashboard,
  getPublishedBlogPosts,
  getBlogPostBySlug,
};