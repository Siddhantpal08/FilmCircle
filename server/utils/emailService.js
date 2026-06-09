const https = require('https');
const nodemailer = require('nodemailer');

// ─── Constants ─────────────────────────────────────────────────────────────────
const FROM_NAME = 'FilmCircle';
const FROM_ADDR = () => process.env.SMTP_FROM || 'noreply@filmcircle.app';

// ─── Mailtrap Sandbox API sender ───────────────────────────────────────────────
// Endpoint: POST https://sandbox.api.mailtrap.io/api/send/{inbox_id}
// Requires: MAILTRAP_API_KEY and MAILTRAP_INBOX_ID env vars
// (Inbox ID is the numeric ID visible in your Mailtrap sandbox URL)
const sendViaMailtrapApi = (toEmail, subject, html) => {
    return new Promise((resolve, reject) => {
        const inboxId = process.env.MAILTRAP_INBOX_ID;
        if (!inboxId) {
            return reject(new Error('MAILTRAP_INBOX_ID is not set in .env. Find it in your Mailtrap inbox URL.'));
        }

        const body = JSON.stringify({
            from: { email: FROM_ADDR(), name: FROM_NAME },
            to: [{ email: toEmail }],
            subject,
            html,
        });

        const options = {
            hostname: 'sandbox.api.mailtrap.io',
            path: `/api/send/${inboxId}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MAILTRAP_API_KEY}`,
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                console.log(`[emailService] Mailtrap API response ${res.statusCode}: ${data}`);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Mailtrap API error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
};

// ─── SMTP fallback (uses SMTP_* env vars) ─────────────────────────────────────
const sendViaSmtp = async (toEmail, subject, html) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.SMTP_PORT || '2525', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_ADDR()}>`,
        to: toEmail,
        subject,
        html,
    });
};

// ─── Unified send ─────────────────────────────────────────────────────────────
// Prefers Mailtrap REST API (just needs API key + inbox ID)
// Falls back to nodemailer SMTP (needs SMTP_USER + SMTP_PASS)
const sendEmail = async (toEmail, subject, html) => {
    if (process.env.MAILTRAP_API_KEY && process.env.MAILTRAP_INBOX_ID) {
        console.log(`[emailService] Sending via Mailtrap API to ${toEmail}`);
        await sendViaMailtrapApi(toEmail, subject, html);
    } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log(`[emailService] Sending via SMTP to ${toEmail}`);
        await sendViaSmtp(toEmail, subject, html);
    } else {
        throw new Error('No email transport configured. Set MAILTRAP_API_KEY + MAILTRAP_INBOX_ID, or SMTP_USER + SMTP_PASS in .env');
    }
};

// ─── HTML email wrapper ────────────────────────────────────────────────────────
const htmlWrapper = (body) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif; }
    .wrap { max-width:520px;margin:40px auto;background:#161622;border-radius:16px;border:1px solid rgba(192,57,43,.25);overflow:hidden; }
    .hdr  { background:linear-gradient(135deg,#1a0a0a,#2d0e0e);padding:28px 36px 20px;text-align:center;border-bottom:1px solid rgba(192,57,43,.2); }
    .hdr h1 { margin:0;color:#fff;font-size:1.5rem;font-weight:800;letter-spacing:-.5px; }
    .hdr h1 span { color:#e74c3c; }
    .bdy  { padding:28px 36px;color:#c8c8d0;line-height:1.7; }
    .bdy p { margin:0 0 1rem; }
    .otp-box { text-align:center;margin:24px 0; }
    .otp-code { display:inline-block;font-size:2.5rem;font-weight:900;letter-spacing:12px;color:#fff;background:rgba(231,76,60,.12);border:2px solid rgba(231,76,60,.4);border-radius:12px;padding:16px 32px;font-family:"Courier New",monospace; }
    .cta-btn { display:inline-block;background:#c0392b;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin:12px 0; }
    .note { font-size:.82rem;color:#666;margin-top:20px;border-top:1px solid rgba(255,255,255,.05);padding-top:14px; }
    .ftr  { padding:14px 36px;text-align:center;font-size:.75rem;color:#555;border-top:1px solid rgba(255,255,255,.04); }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr"><h1>🎬 Film<span>Circle</span></h1></div>
    <div class="bdy">${body}</div>
    <div class="ftr">FilmCircle &mdash; Your cinema, your circle.</div>
  </div>
</body>
</html>`;

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a 6-digit OTP to the given email address.
 * @param {string} toEmail
 * @param {string} username
 * @param {string} otp
 */
const sendOtpEmail = async (toEmail, username, otp) => {
    const mins = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
    const html = htmlWrapper(`
        <p>Hi <strong style="color:#fff">${username}</strong>,</p>
        <p>Thanks for joining FilmCircle! Use the one-time code below to verify your email.
           It expires in <strong>${mins} minutes</strong>.</p>
        <div class="otp-box"><span class="otp-code">${otp}</span></div>
        <p>Enter this code in the registration screen to complete your account.</p>
        <p class="note">Didn't sign up? You can safely ignore this email.</p>
    `);
    await sendEmail(toEmail, `${otp} — Your FilmCircle verification code`, html);
};

/**
 * Send a password-reset link email.
 * @param {string} toEmail
 * @param {string} username
 * @param {string} resetUrl
 */
const sendPasswordResetEmail = async (toEmail, username, resetUrl) => {
    const html = htmlWrapper(`
        <p>Hi <strong style="color:#fff">${username}</strong>,</p>
        <p>Someone requested a password reset for your FilmCircle account.
           Click the button below to set a new password — this link expires in <strong>1 hour</strong>.</p>
        <div class="otp-box"><a href="${resetUrl}" class="cta-btn">Reset Password</a></div>
        <p class="note">If you didn't request this, you can safely ignore this email.</p>
    `);
    await sendEmail(toEmail, 'Reset your FilmCircle password', html);
};

module.exports = { sendOtpEmail, sendPasswordResetEmail };
