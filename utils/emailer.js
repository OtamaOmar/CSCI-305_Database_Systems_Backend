function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

async function sendInvitationEmail({ to, hospitalName, inviteUrl }) {
  // Optional nodemailer integration. If not installed/configured, we fallback to logging.
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch {
    nodemailer = null;
  }

  if (!nodemailer || !hasSmtpConfig()) {
    console.log('[invite-email:fallback]', { to, hospitalName, inviteUrl });
    return { delivered: false, transport: 'console' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `You're invited to ${hospitalName} on PulseED`,
    text: `You've been invited to join ${hospitalName}.\n\nComplete setup: ${inviteUrl}\n\nIf you didn't request this, you can ignore this email.`,
  });

  return { delivered: true, transport: 'smtp' };
}

module.exports = { sendInvitationEmail };

