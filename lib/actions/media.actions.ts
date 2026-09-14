'use server';

import { v2 as cloudinary } from 'cloudinary';
import { getSession } from '@/lib/auth';

const CLOUDINARY_FOLDER = 'chayajewellery';

/**
 * Configure Cloudinary
 */
function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary configuration is missing. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return cloudinary;
}

/**
 * Authentication helper
 */
async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const sessionRole = String(session.role || '')
    .replace(/\s+/g, '_')
    .toUpperCase();

  const normalizedRoles = allowedRoles.map((role) =>
    role.replace(/\s+/g, '_').toUpperCase()
  );

  if (!normalizedRoles.includes(sessionRole)) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return session;
}

/**
 * Normalize Cloudinary errors
 */
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const cloudinaryError = error as {
      message?: string;
      http_code?: number;
      name?: string;
    };

    if (cloudinaryError.http_code) {
      return `Cloudinary error ${cloudinaryError.http_code}: ${cloudinaryError.message || 'Unknown Cloudinary error'
        }`;
    }

    if (cloudinaryError.message) {
      return cloudinaryError.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Upload media
 */
export async function uploadMedia(formData: FormData) {
  try {
    const session = await checkAuth([
      'SUPER_ADMIN',
      'CONTENT_MANAGER',
    ]);

    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new Error('No valid file provided');
    }

    if (file.size <= 0) {
      throw new Error('File is empty');
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const cloudinaryClient = configureCloudinary();

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinaryClient.uploader.upload_stream(
        {
          folder: CLOUDINARY_FOLDER,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            console.error('CLOUDINARY UPLOAD ERROR:', {
              message: error.message,
              http_code: error.http_code,
              name: error.name,
            });

            reject(error);
            return;
          }

          if (!result) {
            reject(
              new Error('Cloudinary returned an empty upload response')
            );
            return;
          }

          resolve(result);
        }
      );

      uploadStream.on('error', (error) => {
        console.error('CLOUDINARY STREAM ERROR:', error);
        reject(error);
      });

      uploadStream.end(buffer);
    });

    return {
      success: true,
      data: {
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        format: uploadResult.format,
        resourceType: uploadResult.resource_type,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        folder: CLOUDINARY_FOLDER,
        uploadedBy: session.name,
      }
    };
  } catch (error) {
    console.error('uploadMedia ERROR:', error);

    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Delete media from Cloudinary
 */
async function deleteFromCloudinary(
  publicId: string,
  resourceType?: string
) {
  const cloudinaryClient = configureCloudinary();

  let type: 'image' | 'video' | 'raw' = 'image';

  if (resourceType === 'video') {
    type = 'video';
  } else if (resourceType === 'raw') {
    type = 'raw';
  }

  return cloudinaryClient.uploader.destroy(publicId, {
    resource_type: type,
  });
}

/**
 * Delete media by URL
 *
 * Used for cleaning orphaned media.
 */
export async function deleteMediaByUrl(url: string) {
  // SECURITY: every other exported action in this file (uploadMedia) checks
  // role before doing anything — this one didn't, and relied entirely on
  // route-level middleware to keep it out of reach. Only ever called
  // server-side from product.actions.ts today, but a server action is a
  // real network endpoint regardless of who currently imports it.
  await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);

  if (!url || url.includes('placehold.co')) {
    return {
      success: true,
      skipped: true,
    };
  }

  try {
    // Extract public_id from Cloudinary URL if possible
    // A typical Cloudinary URL: https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/<folder>/<public_id>.<ext>
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    if (folder === CLOUDINARY_FOLDER && lastPart) {
      const publicId = `${folder}/${lastPart.split('.')[0]}`;
      await deleteFromCloudinary(publicId, 'image');
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      `Failed to clean up orphaned media: ${url}`,
      error
    );

    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}