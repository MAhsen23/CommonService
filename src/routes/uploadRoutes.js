import express from 'express';
import * as uploadController from '../controllers/uploadController.js';
import { uploadSingle, uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

router.post('/', uploadSingle('image'), uploadController.uploadImagesHandler);
router.post('/multiple', uploadMultiple('images', 10), uploadController.uploadImagesHandler);
router.post('/base64', uploadController.uploadBase64Handler);
router.post('/files', uploadFiles('files', 10), uploadController.uploadFilesHandler);

export default router;
