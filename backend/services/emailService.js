const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendInvitationEmail = async ({
  toEmail,
  inviterName,
  tripTitle,
  destination,
  startDate,
  endDate,
  inviteLink
}) => {
  const formattedStart = new Date(startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const formattedEnd = new Date(endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
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
    <table width="100%" style="background-color: #050505;">
      <tr>
        <td align="center" style="padding: 40px 0;">

          <table width="600" style="background-color: #111111; border-radius: 24px; overflow: hidden; border: 1px solid #222222;">

            <!-- HEADER -->
            <tr>
              <td style="background: linear-gradient(135deg, #1e3a8a, #312e81); padding: 60px 40px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 36px;">WanderMind</h1>
                <p style="color: #94a3b8;">Your next adventure awaits.</p>
              </td>
            </tr>

            <!-- CONTENT -->
            <tr>
              <td style="padding: 48px 40px;">

                <h2 style="color: #f8fafc;">Pack your bags! 🎒</h2>

                <p style="color: #94a3b8;">
                  Hey there! <strong style="color:#fff;">${inviterName}</strong> invited you to a trip.
                </p>

                <!-- TRIP CARD -->
                <div style="background:#1a1a1a; padding:20px; border-radius:20px; border:1px solid #333;">
                  <h3 style="color:#fff;">${tripTitle}</h3>

                  <p style="color:#cbd5e1;">📍 ${destination}</p>
                  <p style="color:#cbd5e1;">📅 ${formattedStart} — ${formattedEnd}</p>
                </div>

                <!-- BUTTON -->
                <div style="text-align:center; margin-top:30px;">
                  <a href="${inviteLink}"
                     style="background:#fff; color:#000; padding:14px 40px; border-radius:12px; text-decoration:none; font-weight:bold;">
                    Accept Invitation
                  </a>
                </div>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#0a0a0a; padding:30px; text-align:center;">
                <p style="color:#475569; font-size:12px;">© 2026 WanderMind</p>
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
    const data = await resend.emails.send({
      from: "WanderMind <onboarding@resend.dev>",
      to: toEmail,
      subject: `🌍 You're invited to join "${tripTitle}"!`,
      html
    });

    console.log("📧 Email sent:", data);
  } catch (error) {
    console.error("❌ Email error:", error);
    throw new Error("Email service failed");
  }
};

module.exports = { sendInvitationEmail };