const nodemailer = require('nodemailer');
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendInvitationEmail = async ({ toEmail, inviterName, tripTitle, destination, startDate, endDate, inviteLink }) => {
  const formattedStart = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedEnd = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trip Invitation - WanderMind</title>
    <!--[if mso]>
    <style type="text/css">
      body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
    </style>
    <![endif]-->
  </head>
  <body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505; min-width: 100%;">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #111111; border-radius: 24px; overflow: hidden; border: 1px solid #222222;">
            <!-- Header/Hero -->
            <tr>
              <td style="padding: 0;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%); padding: 60px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px;">WanderMind</h1>
                  <p style="color: #94a3b8; margin: 12px 0 0; font-size: 16px; font-weight: 500;">Your next adventure awaits.</p>
                </div>
              </td>
            </tr>

            <!-- Content Area -->
            <tr>
              <td style="padding: 48px 40px;">
                <h2 style="color: #f8fafc; margin: 0 0 20px; font-size: 28px; font-weight: 700; line-height: 1.2;">
                  Pack your bags! 🎒
                </h2>
                <p style="color: #94a3b8; font-size: 17px; line-height: 1.6; margin: 0 0 32px;">
                  Hey there! <strong style="color: #ffffff;">${inviterName}</strong> has invited you to join an upcoming trip. It's time to start planning your next great escape.
                </p>

                <!-- Trip Details Card -->
                <div style="background-color: #1a1a1a; border-radius: 20px; border: 1px solid #333333; overflow: hidden; margin-bottom: 32px;">
                  <div style="padding: 24px;">
                    <span style="display: inline-block; background-color: #312e81; color: #e0e7ff; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">Trip Invitation</span>
                    <h3 style="color: #ffffff; margin: 0 0 20px; font-size: 22px; font-weight: 700;">${tripTitle}</h3>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="32" style="vertical-align: top; padding-bottom: 12px;">
                          <span style="font-size: 20px;">📍</span>
                        </td>
                        <td style="padding-bottom: 12px;">
                          <p style="color: #cbd5e1; margin: 0; font-size: 15px; font-weight: 500;">${destination}</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="32" style="vertical-align: top;">
                          <span style="font-size: 20px;">📅</span>
                        </td>
                        <td>
                          <p style="color: #cbd5e1; margin: 0; font-size: 15px; font-weight: 500;">${formattedStart} — ${formattedEnd}</p>
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; padding: 8px 0 32px;">
                  <a href="${inviteLink}" style="background-color: #ffffff; color: #000000; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-size: 16px; font-weight: 700; display: inline-block; transition: all 0.2s ease;">
                    Accept Invitation
                  </a>
                </div>

                <div style="border-top: 1px solid #222222; padding-top: 32px; text-align: center;">
                  <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">
                    Questions about this trip? Reach out to <strong style="color: #94a3b8;">${inviterName}</strong> directly.<br>
                    Need help? <a href="#" style="color: #3b82f6; text-decoration: none;">Contact Support</a>
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #0a0a0a; padding: 40px; text-align: center;">
                <p style="color: #475569; font-size: 12px; font-weight: 500; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.1em;">
                  © 2026 WanderMind Inc.
                </p>
                <div style="margin-bottom: 24px;">
                  <a href="#" style="color: #64748b; text-decoration: none; margin: 0 12px; font-size: 12px;">Privacy Policy</a>
                  <a href="#" style="color: #64748b; text-decoration: none; margin: 0 12px; font-size: 12px;">Terms of Service</a>
                </div>
                <p style="color: #334155; font-size: 11px; margin: 0; line-height: 1.4;">
                  You received this email because you were invited to a trip on WanderMind.<br>
                  If you didn't expect this, you can safely ignore this email.
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
    await transporter.verify();
    console.log('✅ Email transporter is ready');
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: `🌍 You're invited to join "${tripTitle}"!`,
      html
    });
    console.log('Invitation email sent successfully');
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    throw new Error('Email service failed: ' + error.message);
  }
};

module.exports = { sendInvitationEmail };
