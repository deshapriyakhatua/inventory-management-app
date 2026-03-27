import { v2 as cloudinary } from 'cloudinary';

const configCloudinary = function () {
    cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

function getCloudinaryPublicId(url) {
    // Match the URL structure to extract the part after "/upload/" and before the file extension
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[\w]+$/);
    return match ? match[1] : null;
}

function removeVersionFromCloudinaryUrl(url) {
    // Use a regex to remove the version part (e.g., /v1234567890/) from the URL
    return url.replace(/\/v\d+\//, '/');
}

export const UploadImage = async (image, folder, url = null) => {
    try {
        // Configure Cloudinary
        configCloudinary();

        const byte = await image.arrayBuffer();
        const buffer = Buffer.from(byte);

        const uploadOptions = {
            folder: folder,
            overwrite: true, // Allow replacing the image with the same public ID
            format: 'webp', // Automatically convert to WebP format
        };

        // If a `publicId` is provided, include it in the upload options
        if (url) {
            const publicId = getCloudinaryPublicId(url);
            uploadOptions.public_id = publicId;
        }

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
            uploadStream.end(buffer);
        });

        result.secure_url = removeVersionFromCloudinaryUrl(result.secure_url);
        return result;
        
    } catch (error) {
        console.log('Cloudinary image upload failed:', error);
        throw new Error(error);
    }
};


export const DeleteImage = async (url) => {

    try {

        const publicId = getCloudinaryPublicId(url);

        // Config Cloudinary
        configCloudinary();

        // Use the Cloudinary API to delete the image by public ID
        const result = await cloudinary.uploader.destroy(publicId);

        // Check the result status
        if (result.result === 'ok') {
            console.log('Image deleted successfully:', publicId);
            return { success: true };
        } else {
            console.error('Failed to delete image:', result);
            return { success: false, error: result.result };
        }

    } catch (error) {

        console.error('Cloudinary image deletion failed:', error);
        throw new Error(error);

    }

};