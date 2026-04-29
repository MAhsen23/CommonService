import { sendContactEmail, sendDevlysContactEmail } from '../services/emailService.js';

/**
 * POST /api/contact — submit contact or consultation form and send email via SMTP
 * type: 'contact' | 'consultation'
 */
export async function submitContact(req, res, next) {
    try {
        const body = req.body || {};

        const type = body.type === 'consultation' ? 'consultation' : 'contact';

        const data = {
            type,
            name: typeof body.name === 'string' ? body.name.trim() : body.name,
            email: typeof body.email === 'string' ? body.email.trim() : body.email,
            phone: typeof body.phone === 'string' ? body.phone.trim() : body.phone,
            budget: typeof body.budget === 'string' ? body.budget.trim() : body.budget,
            description: typeof body.description === 'string' ? body.description.trim() : body.description,
            protectWithNda: body.protectWithNda === true || body.protectWithNda === 'true',
            scheduleDateTime: body.scheduleDateTime != null ? String(body.scheduleDateTime).trim() : undefined,
            funding: typeof body.funding === 'string' ? body.funding.trim() : undefined
        };

        const result = await sendContactEmail(data);

        if (!result.success) {
            const errMsg = result.error || 'Could not send email';
            return res.status(502).json({
                success: false,
                status: 'ERROR',
                message: errMsg,
                data: { error: errMsg }
            });
        }

        return res.status(200).json({
            success: true,
            status: 'OK',
            message: type === 'consultation'
                ? 'Consultation request submitted successfully'
                : 'Contact form submitted successfully',
            data: { messageId: result.messageId }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/contact/devlys — submit Devlys contact form and send email via Resend
 * Body (flexible): name, email, phone, subject, message (or description)
 */
export async function submitDevlysContact(req, res, next) {
    try {
        const body = req.body || {};

        const data = {
            name: typeof body.name === 'string' ? body.name.trim() : body.name,
            email: typeof body.email === 'string' ? body.email.trim() : body.email,
            phone: typeof body.phone === 'string' ? body.phone.trim() : body.phone,
            subject: typeof body.subject === 'string' ? body.subject.trim() : body.subject,
            message: typeof body.message === 'string' ? body.message.trim() : body.message,
            description: typeof body.description === 'string' ? body.description.trim() : body.description
        };

        const result = await sendDevlysContactEmail(data);

        if (!result.success) {
            const errMsg = result.error || 'Could not send email';
            return res.status(502).json({
                success: false,
                status: 'ERROR',
                message: errMsg,
                data: { error: errMsg }
            });
        }

        return res.status(200).json({
            success: true,
            status: 'OK',
            message: 'Devlys contact form submitted successfully',
            data: { messageId: result.messageId }
        });
    } catch (err) {
        next(err);
    }
}
