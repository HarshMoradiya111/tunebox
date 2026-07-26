import { v2 as cloudinary } from "cloudinary";
import config from "../config";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    config.cloudinary.cloudName &&
      config.cloudinary.apiKey &&
      config.cloudinary.apiSecret
  );
}

// Initialize SDK
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

/**
 * Uploads an audio file to Cloudinary.
 * @returns The secure URL of the uploaded resource.
 */
export async function uploadAudioToCloudinary(
  filePath: string,
  publicId: string,
  compressInCloud: boolean = false
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured in environment variables.");
  }

  const uploadOptions: any = {
    resource_type: "video", // Cloudinary treats audio as video
    folder: "tunebox-uploads",
    public_id: publicId,
  };

  if (compressInCloud) {
    uploadOptions.eager = [{ audio_codec: "mp3", bit_rate: "160k" }];
    uploadOptions.eager_async = false;
  }

  const result = await cloudinary.uploader.upload(filePath, uploadOptions);

  if (compressInCloud && result.eager && result.eager[0] && result.eager[0].secure_url) {
    console.log(`☁️ Cloudinary cloud compression applied: ${result.eager[0].secure_url}`);
    return result.eager[0].secure_url;
  }

  return result.secure_url;
}

/**
 * Uploads an image file (cover art) to Cloudinary.
 * @returns The secure URL of the uploaded resource.
 */
export async function uploadImageToCloudinary(
  filePath: string,
  publicId: string
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured in environment variables.");
  }

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "image",
    folder: "tunebox-covers",
    public_id: publicId,
  });

  return result.secure_url;
}

/**
 * Deletes a resource from Cloudinary.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured()) return;

  await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  console.log(`🗑️ Deleted "${publicId}" from Cloudinary.`);
}

/**
 * Gets Cloudinary usage statistics
 */
export async function getCloudinaryUsage(): Promise<any> {
  if (!isCloudinaryConfigured()) {
    return { error: "Cloudinary is not configured" };
  }

  // Uses the Admin API which requires configuring cloudinary properly
  const usage = await cloudinary.api.usage();
  return usage;
}
