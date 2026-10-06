import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export interface ImageUploadFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export interface UploadedImage {
  secureUrl: string;
  publicId: string;
}

@Injectable()
export class UploadService {
  private configured = false;

  async uploadToCloudinary(file: ImageUploadFile): Promise<UploadedImage> {
    if (!file?.buffer?.length) {
      throw new ServiceUnavailableException('Uploaded image is empty');
    }

    this.configureCloudinary();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'rentra/properties',
          resource_type: 'image',
          filename_override: file.originalname,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new ServiceUnavailableException(
                'Cloudinary could not upload the image',
              ),
            );
            return;
          }
          resolve({ secureUrl: result.secure_url, publicId: result.public_id });
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async deleteFromCloudinary(publicId: string) {
    this.configureCloudinary();
    const rawResult: unknown = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
    });
    const result =
      typeof rawResult === 'object' &&
      rawResult !== null &&
      'result' in rawResult
        ? (rawResult as { result?: unknown }).result
        : undefined;
    if (result !== 'ok' && result !== 'not found') {
      throw new ServiceUnavailableException(
        'Cloudinary could not delete the image',
      );
    }
  }

  private configureCloudinary() {
    if (this.configured) return;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Cloudinary credentials are not configured',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    this.configured = true;
  }
}
