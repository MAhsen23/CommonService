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

function createDevlysTransporter() {
    if (!devlysMail?.user || !devlysMail?.pass) {
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: devlysMail.user,
            pass: devlysMail.pass
        }
    });
}

function escapeHtml(text) {
    if (text == null) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text).replace(/[&<>"']/g, (c) => map[c]);
}

function buildEmailHtml({ title, accentColor, badgeLabel, rows }) {
    const rowsHtml = rows
        .map(
            (r) => `
    <tr>
      <td style="font-family: 'Nunito', sans-serif; padding: 12px 20px; border-bottom: 1px solid #f0f0f0; color: #6b7280; font-size: 13px; font-weight: 600; width: 180px; white-space: nowrap; vertical-align: top;">${escapeHtml(r.label)}</td>
      <td style="font-family: 'Nunito', sans-serif; padding: 12px 20px; border-bottom: 1px solid #f0f0f0; color: #111827; font-size: 13px; vertical-align: top;">${escapeHtml(String(r.value))}</td>
    </tr>`
        )
        .join('');

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

      <!-- Footer -->
      <div style="padding: 16px 20px; background: #f9fafb; border-top: 1px solid #f0f0f0;">
        <p style="margin: 0; font-family: 'Nunito', sans-serif; font-size: 12px; color: #9ca3af;">
          Sent via TechOriginators website
        </p>
      </div>
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
        rows
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
        rows
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
        rows
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
 * Send Devlys contact form via Gmail SMTP.
 * @param {Object} data - { name, email, phone, subject?, message? }
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
export async function sendDevlysContactEmail(data) {
    const transporter = createDevlysTransporter();
    if (!transporter) {
        return { success: false, error: 'Devlys email is not configured' };
    }

    const to = devlysMail?.to;
    if (!to) {
        return { success: false, error: 'No Devlys receiver email configured' };
    }

    const from = devlysMail.user;
    const subject = `Devlys Contact: ${data.subject ? data.subject : (data.name || 'Unknown')}`;

    try {
        const info = await transporter.sendMail({
            from,
            to,
            replyTo: data.email || undefined,
            subject,
            html: buildDevlysEmailHtml(data),
            text: buildDevlysPlainText(data)
        });
        return { success: true, messageId: info.messageId };
    } catch (err) {
        return { success: false, error: err.message || 'Failed to send email' };
    }
}
