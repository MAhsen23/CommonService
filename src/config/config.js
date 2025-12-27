import dotenv from 'dotenv';
dotenv.config();

export default {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET
    }
};