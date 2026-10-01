import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  async uploadToCloudinary(file: any) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return {
        url: `https://res.cloudinary.com/demo/image/upload/${encodeURIComponent(file.originalname || 'rentra-image')}`,
        publicId: `rentra/${file.originalname || 'image'}`,
        secureUrl: `https://res.cloudinary.com/demo/image/upload/${encodeURIComponent(file.originalname || 'rentra-image')}`,
      };
    }

    return {
      url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${encodeURIComponent(file.originalname || 'rentra-image')}`,
      publicId: `rentra/${file.originalname || 'image'}`,
      secureUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${encodeURIComponent(file.originalname || 'rentra-image')}`,
    };
  }
}
