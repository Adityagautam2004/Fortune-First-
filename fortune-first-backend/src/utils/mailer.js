const { Resend } = require('resend');
const { primaryOrigin } = require('./corsOrigins');

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

const sendPasswordResetEmail = async (customerEmail, resetToken) => {
  try {
    const resetLink = `${primaryOrigin}/reset-password?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
      from: 'Fortune First Security <info@fortunefirst.com>',
      to: [customerEmail],
      subject: 'Fortune First - Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset for your Fortune First account.</p>
        <p>Click the link below to securely set a new password. This link will expire in 15 minutes.</p>
        <a href="${resetLink}" style="display:inline-block; padding:10px 20px; background-color:#1A3C5E; color:white; text-decoration:none; border-radius:5px;">Reset Password</a>
        <br/><br/>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    if (error) console.error('Resend API Error:', error);
    return data;
  } catch (err) {
    console.error('Reset Email failed:', err);
  }
};

// FR-IH-07: board member composes and sends an arbitrary email to a client
const sendCustomEmail = async (customerEmail, subject, message) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fortune First <info@fortunefirst.com>',
      to: [customerEmail],
      subject,
      html: `<p>${message.replace(/\n/g, '<br/>')}</p><br/><p>Regards,<br/>The Fortune First Team</p>`,
    });

    if (error) console.error('Resend API Error:', error);
    return data;
  } catch (err) {
    console.error('Custom email failed:', err);
  }
};

// FR-IH-06: board member generates + emails a client's PDF report, with the PDF attached
const sendReportEmail = async (customerEmail, customerName, pdfBuffer) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fortune First <info@fortunefirst.com>',
      to: [customerEmail],
      subject: 'Your Fortune First Investment Report',
      html: `<h2>Hello ${customerName},</h2><p>Please find your latest investment report attached.</p><br/><p>Regards,<br/>The Fortune First Team</p>`,
      attachments: [{ filename: 'Fortune_First_Report.pdf', content: pdfBuffer.toString('base64') }],
    });

    if (error) console.error('Resend API Error:', error);
    return data;
  } catch (err) {
    console.error('Report email failed:', err);
  }
};

module.exports = { sendPayoutEmail, sendPasswordResetEmail, sendCustomEmail, sendReportEmail };