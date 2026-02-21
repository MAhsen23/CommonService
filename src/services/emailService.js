import nodemailer from 'nodemailer';
import config from '../config/config.js';

const smtp = config.smtp;

function createTransporter() {
    if (!smtp.host || !smtp.user || !smtp.pass) {
        return null;
    }
    return nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: {
            user: smtp.user,
            pass: smtp.pass
        }
    });
}

/**
 * Build HTML email body for contact form submission.
 * Professional, simple template; Nunito font, no shadows.
 */
function buildContactEmailHtml(data) {
    const rows = [
        { label: 'Name', value: data.name },
        { label: 'Email', value: data.email },
        { label: 'Phone', value: data.phone },
        { label: 'Budget', value: data.budget || '—' },
        { label: 'Protect with NDA', value: data.protectWithNda ? 'Yes' : 'No' }
    ];
    if (data.scheduleDateTime) {
        rows.push({ label: 'Schedule date & time', value: data.scheduleDateTime });
    }
    rows.push({ label: 'Description', value: data.description || '—' });

    const rowsHtml = rows
        .map(
            (r) => `
    <tr>
      <td style="font-family: 'Nunito', sans-serif; padding: 10px 16px; border: 1px solid #e5e7eb; color: #374151; font-size: 14px; font-weight: 600; width: 160px;">${escapeHtml(r.label)}</td>
      <td style="font-family: 'Nunito', sans-serif; padding: 10px 16px; border: 1px solid #e5e7eb; color: #111827; font-size: 14px;">${escapeHtml(String(r.value))}</td>
    </tr>`
        )
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact form submission</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 24px; background-color: #f9fafb; font-family: 'Nunito', sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
    <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
      <h1 style="margin: 0; font-family: 'Nunito', sans-serif; font-size: 18px; font-weight: 700; color: #111827;">New contact form submission</h1>
    </div>
    <table style="width: 100%; border-collapse: collapse; font-family: 'Nunito', sans-serif;">
      ${rowsHtml}
    </table>
    <div style="padding: 16px 24px; font-family: 'Nunito', sans-serif; font-size: 12px; color: #6b7280;">
      Sent via CommonService contact API
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text) {
    if (text == null) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text).replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Send contact form data via SMTP.
 * @param {Object} data - { name, email, phone, budget, description, protectWithNda, scheduleDateTime? }
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
export async function sendContactEmail(data) {
    const transporter = createTransporter();
    if (!transporter) {
        return { success: false, error: 'SMTP is not configured' };
    }

    const to = smtp.to || smtp.from;
    if (!to) {
        return { success: false, error: 'No recipient email configured' };
    }

    const html = buildContactEmailHtml(data);
    const subject = `Contact form: ${escapeHtml(data.name || 'Unknown')}`;

    try {
        const info = await transporter.sendMail({
            from: smtp.from,
            to,
            replyTo: data.email || undefined,
            subject,
            html,
            text: [
                `Name: ${data.name}`,
                `Email: ${data.email}`,
                `Phone: ${data.phone}`,
                `Budget: ${data.budget || '—'}`,
                `Protect with NDA: ${data.protectWithNda ? 'Yes' : 'No'}`,
                data.scheduleDateTime ? `Schedule: ${data.scheduleDateTime}` : '',
                `Description: ${data.description || '—'}`
            ]
                .filter(Boolean)
                .join('\n')
        });
        return { success: true, messageId: info.messageId };
    } catch (err) {
        return { success: false, error: err.message || 'Failed to send email' };
    }
}
