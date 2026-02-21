import { sendContactEmail } from '../services/emailService.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactBody(body) {
    const errors = [];
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const budget = typeof body.budget === 'string' ? body.budget.trim() : String(body.budget ?? '');
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const protectWithNda = body.protectWithNda === true || body.protectWithNda === 'true';
    const scheduleDateTime = body.scheduleDateTime != null ? String(body.scheduleDateTime).trim() : null;

    if (!name) errors.push('name is required');
    if (!email) errors.push('email is required');
    else if (!EMAIL_REGEX.test(email)) errors.push('email must be valid');
    if (!phone) errors.push('phone is required (include country code if needed)');
    if (description.length === 0) errors.push('description is required');

    if (errors.length) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        data: {
            name,
            email,
            phone,
            budget: budget || undefined,
            description,
            protectWithNda,
            scheduleDateTime: scheduleDateTime || undefined
        }
    };
}

/**
 * POST /api/contact — submit contact form and send email via SMTP
 */
export async function submitContact(req, res, next) {
    try {
        const validation = validateContactBody(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        const result = await sendContactEmail(validation.data);

        if (!result.success) {
            return res.status(502).json({
                success: false,
                message: 'Could not send email',
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Contact form submitted successfully',
            data: { messageId: result.messageId }
        });
    } catch (err) {
        next(err);
    }
}
