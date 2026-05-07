import multer from 'multer';
import { IMAGE_PATHS } from '../services/cloudinaryService.js';

/**
 * Configure multer for memory storage
 * Files will be stored in memory as Buffer objects
 */
const storage = multer.memoryStorage();

/**
 * File filter to accept only images
 */
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
    }
};

/**
 * Multer configuration
 */
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 10
    }
});

export const uploadSingle = (fieldName = 'image') => {
    return upload.single(fieldName);
};

export const uploadMultiple = (fieldName = 'images', maxCount = 10) => {
    return upload.array(fieldName, maxCount);
};

export const uploadFields = (fields) => {
    return upload.fields(fields);
};

const uploadFilesInstance = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
            'application/pdf',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
        }
    },
    limits: {
        fileSize: 20 * 1024 * 1024,
        files: 10,
    },
});

export const uploadFiles = (fieldName = 'files', maxCount = 10) => {
    return uploadFilesInstance.array(fieldName, maxCount);
};

export default upload;