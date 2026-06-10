import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

export async function sendInviteEmail(email: string, inviteToken: string, inviteUrl: string) {
  try {
    // For testing without SMTP configured, just log
    if (!process.env.SMTP_USER) {
      console.log(`📧 [TEST] Invite email would be sent to: ${email}`);
      console.log(`🔗 Invite URL: ${inviteUrl}?token=${inviteToken}`);
      return;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@world-cup.app',
      to: email,
      subject: 'You\'re invited to the World Cup Prediction Game!',
      html: `
        <h2>Welcome to World Cup 2026 Predictions!</h2>
        <p>You've been invited to join our World Cup prediction game.</p>
        <p><a href="${inviteUrl}?token=${inviteToken}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Click here to register
        </a></p>
        <p>Or use this token: <code>${inviteToken}</code></p>
        <p>The invitation expires in 7 days.</p>
      `,
      text: `
You've been invited to join our World Cup prediction game.

Click here to register: ${inviteUrl}?token=${inviteToken}

Or use this token: ${inviteToken}

The invitation expires in 7 days.
      `,
    });

    console.log(`✅ Invite email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send invite email:', error);
    throw error;
  }
}
