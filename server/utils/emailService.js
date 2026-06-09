const https = require('https');
const nodemailer = require('nodemailer');

const FROM_NAME = 'FilmCircle';
const FROM_ADDR = () => process.env.SMTP_FROM || 'noreply@filmcircle.app';

// ─── 1. Brevo HTTP API (primary — HTTPS, works on all cloud hosts) ─────────────
// Free: 300 emails/day, no domain needed, just verify your sender email.
// Sign up: https://app.brevo.com → SMTP & API → API Keys
const sendViaBrevo = (toEmail, subject, html) => {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            sender: { name: FROM_NAME, email: FROM_ADDR() },
            to: [{ email: toEmail }],
            subject,
            htmlContent: html,
        });

        const req = https.request({
            hostname: 'api.brevo.com',
            path: '/v3/smtp/email',
            method: 'POST',
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                console.log(`[emailService] Brevo response ${res.statusCode}: ${data}`);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
};

// ─── 2. Gmail SMTP fallback (only works if host doesn't block port 587) ────────
const sendViaSmtp = (toEmail, subject, html) => {
    return new Promise((resolve, reject) => {
        // Fail fast — Render blocks SMTP; timeout after 8s instead of hanging forever
        const timeout = setTimeout(() => {
            reject(new Error('SMTP connection timed out. Port 587 may be blocked by your host. Set BREVO_API_KEY instead.'));
        }, 8000);

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 7000,
            greetingTimeout: 5000,
            socketTimeout: 7000,
        });

        transporter.sendMail({
            from: `"${FROM_NAME}" <${FROM_ADDR()}>`,
            to: toEmail,
            subject,
            html,
        }).then(info => {
            clearTimeout(timeout);
            console.log(`[emailService] SMTP sent → messageId: ${info.messageId}`);
            resolve(info);
        }).catch(err => {
            clearTimeout(timeout);
            reject(err);
        });
    });
};

// ─── Router — Brevo first, SMTP fallback ───────────────────────────────────────
const sendEmail = async (toEmail, subject, html) => {
    if (process.env.BREVO_API_KEY) {
        console.log(`[emailService] Sending via Brevo to ${toEmail}`);
        return sendViaBrevo(toEmail, subject, html);
    }
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log(`[emailService] Sending via SMTP to ${toEmail}`);
        return sendViaSmtp(toEmail, subject, html);
    }
    throw new Error('No email transport configured. Set BREVO_API_KEY (recommended) or SMTP_USER + SMTP_PASS in your environment.');
};

// ─── HTML wrapper ──────────────────────────────────────────────────────────────
const htmlWrapper = (body) => `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<style>
  body{margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;}
  .wrap{max-width:520px;margin:40px auto;background:#161622;border-radius:16px;border:1px solid rgba(192,57,43,.25);overflow:hidden;}
  .hdr{background:linear-gradient(135deg,#1a0a0a,#2d0e0e);padding:28px 36px 20px;text-align:center;border-bottom:1px solid rgba(192,57,43,.2);}
  .hdr h1{margin:0;color:#fff;font-size:1.5rem;font-weight:800;letter-spacing:-.5px;}
  .hdr h1 span{color:#e74c3c;}
  .bdy{padding:28px 36px;color:#c8c8d0;line-height:1.7;}
  .bdy p{margin:0 0 1rem;}
  .otp-box{text-align:center;margin:24px 0;}
  .otp-code{display:inline-block;font-size:2.5rem;font-weight:900;letter-spacing:12px;color:#fff;background:rgba(231,76,60,.12);border:2px solid rgba(231,76,60,.4);border-radius:12px;padding:16px 32px;font-family:"Courier New",monospace;}
  .cta-btn{display:inline-block;background:#c0392b;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin:12px 0;}
  .note{font-size:.82rem;color:#666;margin-top:20px;border-top:1px solid rgba(255,255,255,.05);padding-top:14px;}
  .ftr{padding:14px 36px;text-align:center;font-size:.75rem;color:#555;border-top:1px solid rgba(255,255,255,.04);}
</style></head><body>
  <div class="wrap">
    <div class="hdr"><h1>🎬 Film<span>Circle</span></h1></div>
    <div class="bdy">${body}</div>
    <div class="ftr">FilmCircle &mdash; Your cinema, your circle.</div>
  </div>
</body></html>`;

// ─── Public API ────────────────────────────────────────────────────────────────
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

const sendPasswordResetEmail = async (toEmail, username, resetUrl) => {
    const html = htmlWrapper(`
        <p>Hi <strong style="color:#fff">${username}</strong>,</p>
        <p>Someone requested a password reset. Click below — expires in <strong>1 hour</strong>.</p>
        <div class="otp-box"><a href="${resetUrl}" class="cta-btn">Reset Password</a></div>
        <p class="note">If you didn't request this, ignore this email.</p>
    `);
    await sendEmail(toEmail, 'Reset your FilmCircle password', html);
};

module.exports = { sendOtpEmail, sendPasswordResetEmail };
