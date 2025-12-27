import {
    uploadImage,
    uploadMultipleImages,
    IMAGE_PATHS
} from '../services/cloudinaryService.js';

/**
 * Upload single or multiple images
 * POST /api/upload
 * 
 * Query Parameters:
 * - path: Optional folder path (e.g., 'galore/users/profiles')
 *          If not provided, images will be saved in the general folder
 * 
 * Body:
 * - For single image: use 'image' field
 * - For multiple images: use 'images' field (array)
 */
export const uploadImagesHandler = async (req, res) => {
    try {
        const { path } = req.query;
        const folder = path || IMAGE_PATHS.GENERAL;

        const singleFile = req.file;
        const multipleFiles = req.files;

        if (!singleFile && !multipleFiles) {
            return res.status(400).json({
                success: false,
                status: 'ERROR',
                message: 'No image provided. Please upload an image file.',
                data: null
            });
        }

        let results = [];
        if (singleFile) {
            const result = await uploadImage(singleFile.buffer, folder);

            results.push({
                url: result.url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format
            });
        }

        else if (multipleFiles && Array.isArray(multipleFiles)) {
            const images = multipleFiles.map(file => file.buffer);
            const uploadResults = await uploadMultipleImages(images, folder);

            results = uploadResults.map(result => ({
                url: result.url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format
            }));
        }

        if (results.length === 1) {
            res.status(200).json({
                success: true,
                status: 'OK',
                message: 'Image uploaded successfully',
                data: {
                    image: results[0]
                }
            });
        } else {
            res.status(200).json({
                success: true,
                status: 'OK',
                message: `${results.length} images uploaded successfully`,
                data: {
                    images: results,
                    count: results.length
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'ERROR',
            message: error.message || 'Failed to upload image',
            data: null
        });
    }
};

/**
 * Upload image from base64 string (for mobile apps)
 * POST /api/upload/base64
 * 
 * Body:
 * {
 *   "image": "data:image/jpeg;base64,...",
 *   "path": "optional-folder-path" (e.g., 'galore/users/profiles')
 *          If not provided, image will be saved in the general folder
 * }
 */
export const uploadBase64Handler = async (req, res) => {
    try {
        const { image, path } = req.body || {};

        if (!image) {
            return res.status(400).json({
                success: false,
                status: 'ERROR',
                message: 'Image is required. Please provide base64 image string.',
                data: null
            });
        }

        const folder = path || IMAGE_PATHS.GENERAL;
        const result = await uploadImage(image, folder);

        res.status(200).json({
            success: true,
            status: 'OK',
            message: 'Image uploaded successfully',
            data: {
                image: {
                    url: result.url,
                    public_id: result.public_id,
                    width: result.width,
                    height: result.height,
                    format: result.format
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'ERROR',
            message: error.message || 'Failed to upload image',
            data: null
        });
    }
};

