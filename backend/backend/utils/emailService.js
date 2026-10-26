const nodemailer = require('nodemailer');

function createTransport() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

async function sendResetEmail(to, resetUrl) {
  const transporter = createTransport();
  const minutes = process.env.RESET_TOKEN_EXPIRES_MINUTES || 30;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#030014;color:#f4f1ff;padding:32px">
      <h1 style="color:#c4b5fd">Memory Galaxy</h1>
      <p>Every memory becomes a star.</p>
      <p>We received a request to reset the password for this galaxy.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#7c3aed;color:white;border-radius:999px;text-decoration:none">
          Reset password
        </a>
      </p>
      <p>This link expires in ${minutes} minutes and can be used only once.</p>
      <p style="color:#9ca3af;font-size:13px">If you did not ask for this, you can ignore the email.</p>
    </div>
  `;

  if (!transporter) {
    console.log('EMAIL_USER / EMAIL_PASSWORD are not set. Password reset link:');
    console.log(resetUrl);
    return { sent: false };
  }

  await transporter.sendMail({
    from: `"Memory Galaxy" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your Memory Galaxy password',
    html,
    text: `Reset your Memory Galaxy password (expires in ${minutes} minutes): ${resetUrl}`
  });

  return { sent: true };
}

module.exports = { sendResetEmail };
