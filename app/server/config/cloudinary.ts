import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dummy_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dummy_api_secret_key',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // @ts-ignore
    folder: 'second_brain_uploads', // Optional folder in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'docx', 'txt'], // Allowed file formats
  },
});

export const upload = multer({ storage: storage });
export { cloudinary };
