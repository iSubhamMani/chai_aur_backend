import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        fs.unlinkSync(localFilePath); // remove locally saved temp file after upload

        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove locally saved temp file if upload fails
        return;
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return;

        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        return;
    }
};

export { uploadToCloudinary, deleteFromCloudinary };
