import { sendContactEmail } from '../services/emailService.js';

/**
 * POST /api/contact — submit contact form and send email via SMTP
 */
export async function submitContact(req, res, next) {
    try {
        const body = req.body || {};
        const data = {
            name: typeof body.name === 'string' ? body.name.trim() : body.name,
            email: typeof body.email === 'string' ? body.email.trim() : body.email,
            phone: typeof body.phone === 'string' ? body.phone.trim() : body.phone,
            budget: typeof body.budget === 'string' ? body.budget.trim() : body.budget,
            description: typeof body.description === 'string' ? body.description.trim() : body.description,
            protectWithNda: body.protectWithNda === true || body.protectWithNda === 'true',
            scheduleDateTime: body.scheduleDateTime != null ? String(body.scheduleDateTime).trim() : undefined
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
            message: 'Contact form submitted successfully',
            data: { messageId: result.messageId }
        });
    } catch (err) {
        next(err);
    }
}
