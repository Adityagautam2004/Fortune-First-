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

module.exports = { submitJoinRequest };