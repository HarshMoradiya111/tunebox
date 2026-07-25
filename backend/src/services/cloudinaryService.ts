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
  publicId: string
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured in environment variables.");
  }

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "video", // Cloudinary treats audio as video
    folder: "tunebox-uploads",
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
