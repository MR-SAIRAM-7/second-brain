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
  // @ts-ignore
  params: async (_req, file) => {
    const mimeType = String(file.mimetype || '').toLowerCase();
    const isPdf = mimeType.includes('pdf');

    return {
      folder: 'second_brain_uploads',
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'docx', 'txt'],
      resource_type: isPdf ? 'raw' : 'auto',
      type: 'upload',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };
  },
});

export const upload = multer({ storage: storage });
export { cloudinary };
