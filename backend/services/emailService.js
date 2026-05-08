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
  <body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#050505;">
      <tr>
        <td align="center" style="padding:40px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#111111;border-radius:24px;overflow:hidden;border:1px solid #222222;">

            <tr>
              <td>
                <div style="background:linear-gradient(135deg,#1e3a8a 0%,#312e81 100%);padding:60px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:36px;font-weight:800;letter-spacing:-1px;">🌍 WanderMind</h1>
                  <p style="color:#94a3b8;margin:12px 0 0;font-size:16px;">Your next adventure awaits.</p>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:48px 40px;">
                <h2 style="color:#f8fafc;margin:0 0 20px;font-size:28px;font-weight:700;">Pack your bags! 🎒</h2>
                <p style="color:#94a3b8;font-size:17px;line-height:1.6;margin:0 0 32px;">
                  Hey there! <strong style="color:#ffffff;">${inviterName}</strong> has invited you to join an upcoming trip on WanderMind.
                </p>

                <div style="background-color:#1a1a1a;border-radius:20px;border:1px solid #333;margin-bottom:32px;padding:24px;">
                  <span style="display:inline-block;background:#312e81;color:#e0e7ff;padding:4px 12px;border-radius:100px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;">Trip Invitation</span>
                  <h3 style="color:#fff;margin:0 0 20px;font-size:22px;font-weight:700;">${tripTitle}</h3>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td width="32" style="padding-bottom:12px;"><span style="font-size:20px;">📍</span></td>
                      <td style="padding-bottom:12px;"><p style="color:#cbd5e1;margin:0;font-size:15px;font-weight:500;">${destination}</p></td>
                    </tr>
                    <tr>
                      <td width="32"><span style="font-size:20px;">📅</span></td>
                      <td><p style="color:#cbd5e1;margin:0;font-size:15px;font-weight:500;">${formattedStart} — ${formattedEnd}</p></td>
                    </tr>
                  </table>
                </div>

                <div style="text-align:center;padding:8px 0 32px;">
                  <a href="${inviteLink}" style="background:#6C63FF;color:#fff;text-decoration:none;padding:18px 48px;border-radius:14px;font-size:16px;font-weight:700;display:inline-block;">
                    ✈️ Accept Invitation
                  </a>
                </div>

                <div style="border-top:1px solid #222;padding-top:24px;text-align:center;">
                  <p style="color:#64748b;font-size:13px;margin:0;">
                    Questions? Reach out to <strong style="color:#94a3b8;">${inviterName}</strong> directly.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
                <p style="color:#475569;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em;">© 2026 WanderMind Inc.</p>
                <p style="color:#334155;font-size:11px;margin:0;line-height:1.5;">
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

  const payload = {
    sender: {
      email: process.env.SENDER_EMAIL,
      name: process.env.SENDER_NAME || 'WanderMind',
    },
    to: [{ email: toEmail }],
    subject: `🌍 You're invited to join "${tripTitle}"!`,
    htmlContent: html,
  };

  const maskEmail = (email) => {
    const [name, domain] = email.split("@");

    // keep first 2 chars, mask the rest
    const maskedName =
      name.length > 2
        ? name.slice(0, 2) + "*".repeat(name.length - 2)
        : name[0] + "*";

    return `${maskedName}@${domain}`;
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Brevo error:', data);
    throw new Error('Email service failed: ' + (data.message || response.statusText));
  }

  console.log(
    `📧 Email sent successfully to ${maskEmail(toEmail)} | messageId: ${data.messageId}`
  );
  return data;
};

const sendOTPEmail = async ({ toEmail, otp, userName }) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your WanderMind OTP</title>
  </head>
  <body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#050505;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table border="0" cellpadding="0" cellspacing="0" width="520" style="background-color:#111111;border-radius:24px;overflow:hidden;border:1px solid #222222;max-width:100%;">

            <!-- Header -->
            <tr>
              <td>
                <div style="background:linear-gradient(135deg,#1e3a8a 0%,#312e81 100%);padding:48px 40px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:32px;font-weight:800;letter-spacing:-1px;">🌍 WanderMind</h1>
                  <p style="color:#94a3b8;margin:10px 0 0;font-size:15px;">Password Reset Verification</p>
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px 40px 32px;">
                <h2 style="color:#f8fafc;margin:0 0 12px;font-size:22px;font-weight:700;text-align:center;">
                  Your verification code
                </h2>
                <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 32px;text-align:center;">
                  Hi${userName ? ` <strong style="color:#ffffff;">${userName}</strong>` : ''}! Use the code below to reset your password. It expires in <strong style="color:#ffffff;">10 minutes</strong>.
                </p>

                <!-- OTP Box Container -->
                <div style="background:linear-gradient(135deg,rgba(108,99,255,0.1),rgba(255,101,132,0.05));border:1px solid rgba(108,99,255,0.2);border-radius:20px;padding:32px;text-align:center;margin-bottom:32px;">
                  <p style="color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 20px;">One-Time Password</p>
                  
                  <!-- Responsive Table-based OTP -->
                  <table border="0" cellpadding="0" cellspacing="0" align="center">
                    <tr>
                      ${otp.split('').map(d => `
                        <td style="padding: 0 4px;">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="48" height="60" align="center" valign="middle" style="background:rgba(108,99,255,0.15);border:2px solid #6366f1;border-radius:12px;font-family:monospace;font-size:32px;font-weight:900;color:#a5b4fc;line-height:60px;">
                                ${d}
                              </td>
                            </tr>
                          </table>
                        </td>
                      `).join('')}
                    </tr>
                  </table>

                  <p style="color:#6366f1;font-size:13px;margin:24px 0 0;font-weight:600;">Valid for 10 minutes · Do not share</p>
                </div>

                <!-- Warning Box -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:rgba(255,165,0,0.06);border:1px solid rgba(255,165,0,0.2);border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="color:#fbbf24;font-size:13px;margin:0;line-height:1.5;">
                        ⚠️ If you didn't request this, ignore this email. Your password will remain unchanged.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#0a0a0a;padding:28px 40px;text-align:center;border-top:1px solid #222222;">
                <p style="color:#475569;font-size:11px;margin:0;text-transform:uppercase;letter-spacing:0.15em;">© 2026 WanderMind Inc.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const payload = {
    sender: {
      email: process.env.SENDER_EMAIL,
      name: process.env.SENDER_NAME || 'WanderMind',
    },
    to: [{ email: toEmail }],
    subject: `${otp} is your WanderMind verification code`,
    htmlContent: html,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Brevo OTP email error:', data);
    throw new Error('Failed to send OTP email: ' + (data.message || response.statusText));
  }

  console.log(`📧 OTP email sent to ${toEmail} | messageId: ${data.messageId}`);
  return data;
};

module.exports = { sendInvitationEmail, sendOTPEmail };