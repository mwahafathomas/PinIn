import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Sender address configuration - strictly from verified pinin.co.za domain
const PININ_SUPPORT_FROM = 'Pinin Support <support@pinin.co.za>';
const PININ_SUPPORT_INBOX = 'support@pinin.co.za';

app.use(express.json());

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Pinin Marketplace Server' });
});

// 2. Contact Message Backend Handler
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message, id } = req.body;

    if (!email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Email and message are required',
      });
    }

    const userName = (name || 'Valued User').trim();
    const userEmail = email.trim();
    const userSubject = (subject || 'General Inquiry').trim();
    const userMessage = message.trim();

    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

    if (!apiKey) {
      console.warn(
        `[Resend Server] RESEND_API_KEY is not configured in server environment.\n` +
        `Simulating delivery:\n` +
        `- From: ${PININ_SUPPORT_FROM}\n` +
        `- To: ${PININ_SUPPORT_INBOX}\n` +
        `- Reply-To: ${userEmail}\n` +
        `- Subject: New Contact Inquiry: ${userSubject}\n` +
        `- Auto-reply To: ${userEmail}`
      );

      return res.json({
        success: true,
        simulated: true,
        message: 'Message processed. Set RESEND_API_KEY in environment to send live emails.',
      });
    }

    // 1) Email to support team:
    // From: 'Pinin Support <support@pinin.co.za>'
    // To: 'support@pinin.co.za'
    // Reply-To: user's email (so Gmail clicking Reply goes straight to the customer)
    const supportNotificationPromise = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: PININ_SUPPORT_FROM,
        to: [PININ_SUPPORT_INBOX],
        reply_to: userEmail,
        subject: `[Support Inquiry] ${userSubject} - from ${userName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #111827; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
            <div style="border-bottom: 2px solid #0052FF; padding-bottom: 16px; margin-bottom: 20px;">
              <h1 style="color: #0052FF; font-size: 22px; font-weight: 800; margin: 0;">Pin<span style="color: #111827;">In</span> Support</h1>
              <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">New Contact Us message received from customer</p>
            </div>

            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">
                💡 <strong>Reply Tip:</strong> Simply click <strong>Reply</strong> in your email client to respond directly to <strong>${userEmail}</strong>.
              </p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 110px; font-weight: 600;">Sender:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 700;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">User Email:</td>
                <td style="padding: 8px 0; color: #0052FF; font-weight: 700;">
                  <a href="mailto:${userEmail}" style="color: #0052FF; text-decoration: none;">${userEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Subject:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 700;">${userSubject}</td>
              </tr>
              ${id ? `<tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Message ID:</td><td style="padding: 8px 0; color: #6b7280; font-family: monospace; font-size: 12px;">${id}</td></tr>` : ''}
            </table>

            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
              <h3 style="margin-top: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Message Content</h3>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1f2937; white-space: pre-wrap;">${userMessage}</p>
            </div>

            <p style="font-size: 12px; color: #9ca3af; margin: 0; text-align: center;">
              Pinin Marketplace &bull; Sent from <a href="https://pinin.co.za" style="color: #6b7280; text-decoration: none;">pinin.co.za</a>
            </p>
          </div>
        `,
      }),
    });

    // 2) Auto-reply to user:
    // From: 'Pinin Support <support@pinin.co.za>'
    // To: user's email
    // Reply-To: 'support@pinin.co.za'
    const autoReplyPromise = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: PININ_SUPPORT_FROM,
        to: [userEmail],
        reply_to: PININ_SUPPORT_INBOX,
        subject: `We received your message: ${userSubject}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111827; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
            <div style="margin-bottom: 20px;">
              <h1 style="color: #0052FF; font-size: 24px; font-weight: 800; margin: 0;">Pin<span style="color: #111827;">In</span></h1>
              <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">South Africa's Trusted Second-Hand Furniture Marketplace</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />

            <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 12px;">Hi ${userName},</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #374151; margin-bottom: 16px;">
              Thank you for contacting Pinin Support. We have received your message regarding <strong>"${userSubject}"</strong>.
            </p>

            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Your Message Summary:</p>
              <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5; font-style: italic;">
                "${userMessage.length > 250 ? userMessage.slice(0, 250) + '...' : userMessage}"
              </p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
              Our dedicated support team is reviewing your inquiry and will get back to you within 24 hours.
            </p>

            <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 10px; padding: 14px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #1e40af;">
                Direct inquiries or additional info: <a href="mailto:${PININ_SUPPORT_INBOX}" style="color: #0052FF; font-weight: 600; text-decoration: none;">${PININ_SUPPORT_INBOX}</a>
              </p>
            </div>

            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Best regards,<br />
              <strong>Pinin Support Team</strong><br />
              <a href="https://pinin.co.za" style="color: #0052FF; text-decoration: none;">pinin.co.za</a>
            </p>
          </div>
        `,
      }),
    });

    const [supportRes, autoReplyRes] = await Promise.all([
      supportNotificationPromise,
      autoReplyPromise,
    ]);

    const supportData = await supportRes.json().catch(() => ({}));
    const autoReplyData = await autoReplyRes.json().catch(() => ({}));

    if (!supportRes.ok) {
      console.error('[Resend Server] Error sending to support:', supportData);
    }
    if (!autoReplyRes.ok) {
      console.error('[Resend Server] Error sending auto-reply:', autoReplyData);
    }

    return res.json({
      success: true,
      supportEmailId: supportData.id || null,
      autoReplyEmailId: autoReplyData.id || null,
    });
  } catch (err: any) {
    console.error('[Resend Server] Exception in /api/contact:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error processing contact message',
    });
  }
});

// 3. Vite Middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pinin Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
