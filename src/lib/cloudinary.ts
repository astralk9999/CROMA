import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
    api_key: import.meta.env.CLOUDINARY_API_KEY,
    api_secret: import.meta.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
}

/**
 * Upload image to Cloudinary
 * @param file - File object or base64 string
 * @param folder - Cloudinary folder path (e.g., 'products')
 * @returns Upload result with URL
 */
export async function uploadImage(
    file: string | Buffer,
    folder: string = 'products'
): Promise<CloudinaryUploadResult> {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: `fashionmarket/${folder}`,
            transformation: [
                { width: 1200, height: 1600, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });

        return {
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image to Cloudinary');
    }
}

/**
 * Delete image from Cloudinary
 * @param publicId - Cloudinary public ID
 */
export async function deleteImage(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete image from Cloudinary');
    }
}

/**
 * Get optimized image URL
 * @param publicId - Cloudinary public ID
 * @param width - Desired width
 * @param height - Desired height
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
    publicId: string,
    width?: number,
    height?: number
): string {
    return cloudinary.url(publicId, {
        width,
        height,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
    });
}

/**
 * Generate upload signature for client-side uploads
 * @param folder - Cloudinary folder
 * @returns Signature data
 */
export function generateUploadSignature(folder: string = 'products') {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
        timestamp,
        folder: `fashionmarket/${folder}`,
    };

    const signature = cloudinary.utils.api_sign_request(
        params,
        import.meta.env.CLOUDINARY_API_SECRET
    );

    return {
        signature,
        timestamp,
        api_key: import.meta.env.CLOUDINARY_API_KEY,
        cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
        folder: params.folder,
    };
}

export default cloudinary;
