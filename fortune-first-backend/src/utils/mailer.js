const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');

const sendPayoutEmail = async (customerEmail, customerName, payoutAmount, month, year) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fortune First <info@fortunefirst.com>',
      to: [customerEmail],
      subject: `Your Fortune First Payout for ${month}/${year} is Processed`,
      html: `
        <h2>Hello ${customerName},</h2>
        <p>Your monthly investment return has been successfully processed.</p>
        <p><strong>Payout Amount:</strong> ₹${payoutAmount}</p>
        <p>This amount will reflect in your registered bank account shortly.</p>
        <br/>
        <p>Regards,<br/>The Fortune First Team</p>
      `,
    });

    if (error) console.error('Resend API Error:', error);
    return data;
  } catch (err) {
    console.error('Email sending failed:', err);
  }
};

module.exports = { sendPayoutEmail };