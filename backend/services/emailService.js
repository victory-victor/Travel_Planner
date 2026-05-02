const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });
};

const sendInvitationEmail = async ({
  toEmail,
  inviterName,
  tripTitle,
  destination,
  startDate,
  endDate,
  inviteLink,
}) => {
  const formattedStart = new Date(startDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const formattedEnd = new Date(endDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trip Invitation - WanderMind</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505; min-width: 100%;">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #111111; border-radius: 24px; overflow: hidden; border: 1px solid #222222;">

            <!-- Header -->
            <tr>
              <td>
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%); padding: 60px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px;">🌍 WanderMind</h1>
                  <p style="color: #94a3b8; margin: 12px 0 0; font-size: 16px;">Your next adventure awaits.</p>
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 48px 40px;">
                <h2 style="color: #f8fafc; margin: 0 0 20px; font-size: 28px; font-weight: 700;">Pack your bags! 🎒</h2>
                <p style="color: #94a3b8; font-size: 17px; line-height: 1.6; margin: 0 0 32px;">
                  Hey there! <strong style="color: #ffffff;">${inviterName}</strong> has invited you to join an upcoming trip on WanderMind.
                </p>

                <!-- Trip Card -->
                <div style="background-color: #1a1a1a; border-radius: 20px; border: 1px solid #333; margin-bottom: 32px; padding: 24px;">
                  <span style="display: inline-block; background: #312e81; color: #e0e7ff; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">Trip Invitation</span>
                  <h3 style="color: #fff; margin: 0 0 20px; font-size: 22px; font-weight: 700;">${tripTitle}</h3>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td width="32" style="padding-bottom: 12px;"><span style="font-size: 20px;">📍</span></td>
                      <td style="padding-bottom: 12px;"><p style="color: #cbd5e1; margin: 0; font-size: 15px; font-weight: 500;">${destination}</p></td>
                    </tr>
                    <tr>
                      <td width="32"><span style="font-size: 20px;">📅</span></td>
                      <td><p style="color: #cbd5e1; margin: 0; font-size: 15px; font-weight: 500;">${formattedStart} — ${formattedEnd}</p></td>
                    </tr>
                  </table>
                </div>

                <!-- CTA -->
                <div style="text-align: center; padding: 8px 0 32px;">
                  <a href="${inviteLink}" style="background: #6C63FF; color: #fff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-size: 16px; font-weight: 700; display: inline-block;">
                    ✈️ Accept Invitation
                  </a>
                </div>

                <div style="border-top: 1px solid #222; padding-top: 24px; text-align: center;">
                  <p style="color: #64748b; font-size: 13px; margin: 0;">
                    Questions? Reach out to <strong style="color: #94a3b8;">${inviterName}</strong> directly.
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background: #0a0a0a; padding: 32px 40px; text-align: center;">
                <p style="color: #475569; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.1em;">© 2026 WanderMind Inc.</p>
                <p style="color: #334155; font-size: 11px; margin: 0; line-height: 1.5;">
                  You received this because you were invited to a trip on WanderMind.<br>
                  If unexpected, you can safely ignore this email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"WanderMind" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `🌍 You're invited to join "${tripTitle}"!`,
      html,
    });
    console.log(`📧 Email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Email service failed: ' + error.message);
  }
};

module.exports = { sendInvitationEmail };