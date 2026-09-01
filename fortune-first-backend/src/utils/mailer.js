const { Resend } = require('resend');
const { primaryOrigin } = require('./corsOrigins');

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');

const sendPayoutEmail = async (customerEmail, customerName, payoutAmount, month, year) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fortune First <info@fortunefirst.in>',
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
      from: 'Fortune First Security <info@fortunefirst.in>',
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

// FR-PUBLIC-19/ADMIN-10: auto-reply sent the moment a public "join now" form
// is submitted, before any admin has looked at it.
const sendJoinRequestReceivedEmail = async (email, name) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fortune First <info@fortunefirst.in>',
      to: [email],
      subject: "We've received your request to join Fortune First",
      html: `
        <h2>Hello ${name},</h2>
        <p>Thank you for your interest in Fortune First. We've received your request to join and our team is currently reviewing it.</p>
        <p>You'll receive an update on your request shortly — usually within 2-3 business days.</p>
        <br/>
        <p>Regards,<br/>The Fortune First Team</p>
      `,
    });

    if (error) console.error('Resend API Error:', error);
    return data;
  } catch (err) {
    console.error('Join request email failed:', err);
  }
};

// FR-ADMIN-11: sent the moment an admin marks a join request "Approved" —
// before the account itself exists, so it deliberately promises a head
// assignment and credentials "soon" rather than including any of that yet.
const sendJoinRequestApprovedEmail = async (email, name) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fortune First <info@fortunefirst.in>',
      to: [email],
      subject: 'Your Fortune First request has been accepted!',
      html: `
        <h2>Congratulations, ${name}!</h2>
        <p>We're pleased to let you know that your request to join Fortune First has been accepted.</p>
        <p>You will soon be a part of the Fortune First family. An investment head will be assigned to you shortly, and you will receive your account credentials by email once that's done.</p>
        <br/>
        <p>Regards,<br/>The Fortune First Team</p>
      `,
    });

    if (error) console.error('Resend API Error:', error);
    return data;
  } catch (err) {
    console.error('Join request approval email failed:', err);
  }
};

// FR-ADMIN-11: sent the moment an admin marks a join request "Rejected"
const sendJoinRequestRejectedEmail = async (email, name) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fortune First <info@fortunefirst.in>',
      to: [email],
      subject: 'Update on your Fortune First request',
      html: `
        <h2>Hello ${name},</h2>
        <p>Thank you for your interest in Fortune First. After careful review, we're unable to move forward with your request to join at this time.</p>
        <p>We appreciate the time you took to apply and wish you the best going forward.</p>
        <br/>
        <p>Regards,<br/>The Fortune First Team</p>
      `,
    });

    if (error) console.error('Resend API Error:', error);
    return data;
  } catch (err) {
    console.error('Join request rejection email failed:', err);
  }
};

// FR-ADMIN-11: sent when an admin actually creates the account in User
// Management — the final onboarding step, carrying the login credentials
// and (for a customer with an investment head already assigned) that
// head's contact details. investmentHead is null for roles/accounts that
// don't have one, in which case that block is simply omitted.
const sendOnboardingEmail = async (email, name, tempPassword, investmentHead) => {
  try {
    const headSection = investmentHead
      ? `
        <p>Your dedicated investment head has been assigned:</p>
        <ul>
          <li><strong>Name:</strong> ${investmentHead.name}</li>
          <li><strong>Phone:</strong> ${investmentHead.phone || 'N/A'}</li>
        </ul>
      `
      : '';

    const { data, error } = await resend.emails.send({
      from: 'Fortune First <info@fortunefirst.in>',
      to: [email],
      subject: 'Welcome to Fortune First — your account is ready',
      html: `
        <h2>Welcome to Fortune First, ${name}!</h2>
        <p>You're officially part of the Fortune First family. Your account has been created and is ready to use.</p>
        ${headSection}
        <p>Your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Temporary Password:</strong> ${tempPassword}</li>
        </ul>
        <p>For your security, you'll be asked to set a new password the first time you log in.</p>
        <p style="margin: 24px 0;">
          <a href="https://fortunefirst.in/login" style="display: inline-block; padding: 10px 24px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Log In to Fortune First
          </a>
        </p>
        <p>Or visit <a href="https://fortunefirst.in/login">fortunefirst.in/login</a> directly in your browser.</p>
        <br/>
        <p>Regards,<br/>The Fortune First Team</p>
      `,
    });

    if (error) console.error('Resend API Error:', error);
    return data;
  } catch (err) {
    console.error('Onboarding email failed:', err);
  }
};

// FR-IH-07: board member composes and sends an arbitrary email to a client
const sendCustomEmail = async (customerEmail, subject, message) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fortune First <info@fortunefirst.in>',
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
      from: 'Fortune First <info@fortunefirst.in>',
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

module.exports = {
  sendPayoutEmail,
  sendPasswordResetEmail,
  sendJoinRequestReceivedEmail,
  sendJoinRequestApprovedEmail,
  sendJoinRequestRejectedEmail,
  sendOnboardingEmail,
  sendCustomEmail,
  sendReportEmail,
};