import {
    uploadImage,
    uploadMultipleImages,
    uploadUserProfile,
    uploadCategoryImage,
    uploadServiceImage,
    uploadBannerImage,
    uploadOrderProblemPictures,
    IMAGE_PATHS
} from '../services/cloudinaryService.js';

/**
 * Upload single or multiple images
 * POST /api/upload
 * 
 * Query Parameters:
 * - type: 'user' | 'category' | 'service' | 'banner' | 'order' | 'general'
 * 
 * Body:
 * - For single image: use 'image' field
 * - For multiple images: use 'images' field (array)
 */
export const uploadImagesHandler = async (req, res) => {
    try {
        const { type = 'general' } = req.query;
        const validTypes = ['user', 'category', 'service', 'banner', 'order', 'general'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                status: 'ERROR',
                message: `Please provide a valid type.`,
                data: null
            });
        }

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
            let result;

            switch (type) {
                case 'user':
                    result = await uploadUserProfile(singleFile.buffer, req.user?.id);
                    break;
                case 'category':
                    result = await uploadCategoryImage(singleFile.buffer, req.body?.categoryId);
                    break;
                case 'service':
                    result = await uploadServiceImage(singleFile.buffer, req.body?.serviceId);
                    break;
                case 'banner':
                    result = await uploadBannerImage(singleFile.buffer, req.body?.bannerId);
                    break;
                case 'order':
                    result = await uploadImage(singleFile.buffer, IMAGE_PATHS.ORDER_PROBLEM);
                    break;
                default:
                    result = await uploadImage(singleFile.buffer, IMAGE_PATHS.GENERAL);
            }

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
            let uploadResults;

            switch (type) {
                case 'order':
                    uploadResults = await uploadOrderProblemPictures(images, req.body?.orderId);
                    break;
                default:
                    const folder = IMAGE_PATHS[type.toUpperCase()] || IMAGE_PATHS.GENERAL;
                    uploadResults = await uploadMultipleImages(images, folder);
            }

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
 *   "type": "user" | "category" | "service" | "banner" | "order" | "general"
 * }
 */
export const uploadBase64Handler = async (req, res) => {
    try {
        const { image, type = 'general' } = req.body || {};

        if (!image) {
            return res.status(400).json({
                success: false,
                status: 'ERROR',
                message: 'Image is required. Please provide base64 image string.',
                data: null
            });
        }

        const validTypes = ['user', 'category', 'service', 'banner', 'order', 'general'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                status: 'ERROR',
                message: `Please provide a valid type.`,
                data: null
            });
        }

        let result;

        switch (type) {
            case 'user':
                result = await uploadUserProfile(image, req.user?.id);
                break;
            case 'category':
                result = await uploadCategoryImage(image, req.body?.categoryId);
                break;
            case 'service':
                result = await uploadServiceImage(image, req.body?.serviceId);
                break;
            case 'banner':
                result = await uploadBannerImage(image, req.body?.bannerId);
                break;
            case 'order':
                result = await uploadImage(image, IMAGE_PATHS.ORDER_PROBLEM);
                break;
            default:
                result = await uploadImage(image, IMAGE_PATHS.GENERAL);
        }

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

