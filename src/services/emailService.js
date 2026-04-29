import nodemailer from 'nodemailer';
import config from '../config/config.js';

const smtp = config.smtp;
const devlysMail = config.devlysMail;

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
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

function escapeHtml(text) {
    if (text == null) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text).replace(/[&<>"']/g, (c) => map[c]);
}

function buildEmailHtml({ title, accentColor, badgeLabel, rows, footerText }) {
    const rowsHtml = rows
        .map(
            (r) => `
    <tr>
      <td style="font-family: 'Nunito', sans-serif; padding: 12px 20px; border-bottom: 1px solid #f0f0f0; color: #6b7280; font-size: 13px; font-weight: 600; width: 180px; white-space: nowrap; vertical-align: top;">${escapeHtml(r.label)}</td>
      <td style="font-family: 'Nunito', sans-serif; padding: 12px 20px; border-bottom: 1px solid #f0f0f0; color: #111827; font-size: 13px; vertical-align: top;">${escapeHtml(String(r.value))}</td>
    </tr>`
        )
        .join('');

    const safeFooterText = footerText == null ? 'Sent via TechOriginators website' : String(footerText);
    const footerHtml = safeFooterText.trim()
        ? `
      <!-- Footer -->
      <div style="padding: 16px 20px; background: #f9fafb; border-top: 1px solid #f0f0f0;">
        <p style="margin: 0; font-family: 'Nunito', sans-serif; font-size: 12px; color: #9ca3af;">
          ${escapeHtml(safeFooterText)}
        </p>
      </div>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f3f4f6; font-family: 'Nunito', sans-serif;">
  <div style="max-width: 580px; margin: 0 auto;">

    <!-- Header -->
    <div style="background: ${accentColor}; border-radius: 8px 8px 0 0; padding: 28px 32px;">
      <div style="display: inline-block; background: rgba(255,255,255,0.15); border-radius: 4px; padding: 3px 10px; margin-bottom: 10px;">
        <span style="font-family: 'Nunito', sans-serif; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 1px; text-transform: uppercase;">${escapeHtml(badgeLabel)}</span>
      </div>
      <h1 style="margin: 0; font-family: 'Nunito', sans-serif; font-size: 20px; font-weight: 700; color: #ffffff;">${escapeHtml(title)}</h1>
    </div>

    <!-- Body -->
    <div style="background: #ffffff; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse;">
        ${rowsHtml}
      </table>
${footerHtml}
    </div>

  </div>
</body>
</html>`;
}

function buildContactEmailHtml(data) {
    const rows = [
        { label: 'Name', value: data.name },
        { label: 'Email', value: data.email },
        { label: 'Phone', value: data.phone },
        { label: 'Budget', value: data.budget || '—' },
        { label: 'Protect with NDA', value: data.protectWithNda ? 'Yes' : 'No' }
    ];
    if (data.scheduleDateTime) {
        rows.push({ label: 'Schedule Date & Time', value: data.scheduleDateTime });
    }
    rows.push({ label: 'Description', value: data.description || '—' });

    return buildEmailHtml({
        title: 'New Contact Form Submission',
        accentColor: '#2563eb',
        badgeLabel: 'Contact',
        rows,
        footerText: 'Sent via TechOriginators website'
    });
}

function buildConsultationEmailHtml(data) {
    const rows = [
        { label: 'Name', value: data.name },
        { label: 'Email', value: data.email },
        { label: 'Phone', value: data.phone },
        { label: 'Budget', value: data.budget || '—' },
        { label: 'Funding', value: data.funding || '—' },
        { label: 'Protect with NDA', value: data.protectWithNda ? 'Yes' : 'No' }
    ];
    if (data.scheduleDateTime) {
        rows.push({ label: 'Schedule Date & Time', value: data.scheduleDateTime });
    }
    rows.push({ label: 'Description', value: data.description || '—' });

    return buildEmailHtml({
        title: 'New Consultation Request',
        accentColor: '#7c3aed',
        badgeLabel: 'Consultation',
        rows,
        footerText: 'Sent via TechOriginators website'
    });
}

function buildPlainText(data) {
    const lines = [
        `Type: ${data.type === 'consultation' ? 'Consultation' : 'Contact'}`,
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Phone: ${data.phone}`,
        `Budget: ${data.budget || '—'}`,
        data.type === 'consultation' ? `Funding: ${data.funding || '—'}` : '',
        `Protect with NDA: ${data.protectWithNda ? 'Yes' : 'No'}`,
        data.scheduleDateTime ? `Schedule: ${data.scheduleDateTime}` : '',
        `Description: ${data.description || '—'}`
    ];
    return lines.filter(Boolean).join('\n');
}

/**
 * Send contact or consultation form data via SMTP.
 * @param {Object} data - { type, name, email, phone, budget, description, protectWithNda, scheduleDateTime?, funding? }
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

    const isConsultation = data.type === 'consultation';
    const html = isConsultation
        ? buildConsultationEmailHtml(data)
        : buildContactEmailHtml(data);
    const subject = isConsultation
        ? `Consultation Request: ${data.name || 'Unknown'}`
        : `Contact Form: ${data.name || 'Unknown'}`;

    try {
        const info = await transporter.sendMail({
            from: smtp.from,
            to,
            replyTo: data.email || undefined,
            subject,
            html,
            text: buildPlainText(data)
        });
        return { success: true, messageId: info.messageId };
    } catch (err) {
        return { success: false, error: err.message || 'Failed to send email' };
    }
}

function buildDevlysEmailHtml(data) {
    const rows = [
        { label: 'Name', value: data.name || '—' },
        { label: 'Email', value: data.email || '—' },
        { label: 'Phone', value: data.phone || '—' },
        { label: 'Subject', value: data.subject || '—' },
        { label: 'Message', value: data.message || data.description || '—' }
    ];

    return buildEmailHtml({
        title: 'New Devlys Contact Submission',
        accentColor: '#111827',
        badgeLabel: 'Devlys',
        rows,
        footerText: 'Sent via Devlys website'
    });
}

function buildDevlysPlainText(data) {
    const lines = [
        `Name: ${data.name || '—'}`,
        `Email: ${data.email || '—'}`,
        `Phone: ${data.phone || '—'}`,
        `Subject: ${data.subject || '—'}`,
        `Message: ${data.message || data.description || '—'}`
    ];
    return lines.join('\n');
}

/**
 * Send Devlys contact form via Resend API.
 * @param {Object} data - { name, email, phone, subject?, message? }
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
export async function sendDevlysContactEmail(data) {
    const apiKey = devlysMail?.resendApiKey;
    const to = devlysMail?.to;
    const from = devlysMail?.from;

    if (!apiKey) {
        return { success: false, error: 'Resend is not configured (missing RESEND_API_KEY)' };
    }
    if (!to) {
        return { success: false, error: 'No Devlys receiver email configured (missing RECEIVER_EMAIL)' };
    }
    if (!from) {
        return { success: false, error: 'No Devlys from email configured (missing DEVLYS_FROM)' };
    }

    const subject = `Devlys Contact: ${data.subject ? data.subject : (data.name || 'Unknown')}`;

    try {
        const payload = {
            from,
            to: Array.isArray(to) ? to : [to],
            subject,
            html: buildDevlysEmailHtml(data),
            text: buildDevlysPlainText(data),
            reply_to: data.email || undefined
        };

        const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const json = await resp.json().catch(() => null);
        if (!resp.ok) {
            const msg =
                (json && (json.message || json.error)) ||
                `Resend request failed with status ${resp.status}`;
            return { success: false, error: msg };
        }

        return { success: true, messageId: json?.id };
    } catch (err) {
        return { success: false, error: err.message || 'Failed to send email' };
    }
}
