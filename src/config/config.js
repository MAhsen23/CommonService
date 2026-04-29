import dotenv from 'dotenv';
dotenv.config();

export default {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET
    },
    smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER
    },
    devlysMail: {
        resendApiKey: process.env.RESEND_API_KEY,
        from: process.env.DEVLYS_FROM || 'onboarding@resend.dev',
        to: process.env.DEVLYS_RECEIVER_EMAIL
    }
};