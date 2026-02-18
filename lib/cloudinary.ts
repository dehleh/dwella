// Cloudinary upload utilities
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export type UploadFolder = 'profiles' | 'listings' | 'kyc' | 'messages'

interface UploadOptions {
  folder: UploadFolder
  userId: string
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: UploadOptions
): Promise<{ url: string; publicId: string }> {
  const { folder, userId, maxWidth = 1200, maxHeight = 1200, quality = 80 } = options

  // KYC documents get stricter access
  const accessMode = folder === 'kyc' ? 'authenticated' : 'upload'

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `dwella/${folder}/${userId}`,
        resource_type: 'image',
        access_mode: accessMode,
        transformation: [
          { width: maxWidth, height: maxHeight, crop: 'limit', quality },
        ],
        // Auto-format for optimal delivery
        format: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          reject(new Error('Failed to upload image'))
        } else {
          resolve({
            url: (result as UploadApiResponse).secure_url,
            publicId: (result as UploadApiResponse).public_id,
          })
        }
      }
    )
    uploadStream.end(buffer)
  })
}

/**
 * Upload multiple files to Cloudinary
 */
export async function uploadMultipleToCloudinary(
  files: { buffer: Buffer; name: string }[],
  options: UploadOptions
): Promise<{ url: string; publicId: string }[]> {
  const results = await Promise.all(
    files.map((file) => uploadToCloudinary(file.buffer, options))
  )
  return results
}

/**
 * Delete an image from Cloudinary by public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
  }
}

/**
 * Generate an optimized thumbnail URL
 */
export function getCloudinaryThumbnail(url: string, width = 300, height = 300): string {
  if (!url || !url.includes('cloudinary.com')) return url
  // Insert transformation before /upload/ or /v1/
  return url.replace('/upload/', `/upload/c_fill,w_${width},h_${height},q_auto,f_auto/`)
}

export { cloudinary }
