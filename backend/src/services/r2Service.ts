import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import config from "../config";

let s3Client: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    config.r2.accountId &&
      config.r2.accessKeyId &&
      config.r2.secretAccessKey &&
      config.r2.bucketName
  );
}

function getS3Client(): S3Client | null {
  if (!isR2Configured()) return null;

  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
      },
    });
  }

  return s3Client;
}

/**
 * Uploads a local file to Cloudflare R2 bucket.
 * Returns the public URL if R2_PUBLIC_URL is configured, or key path.
 */
export async function uploadToR2(filePath: string, destinationKey: string): Promise<string> {
  const client = getS3Client();

  if (!client) {
    throw new Error("Cloudflare R2 is not configured in environment variables.");
  }

  const fileStream = fs.createReadStream(filePath);
  const stats = fs.statSync(filePath);

  const command = new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: destinationKey,
    Body: fileStream,
    ContentLength: stats.size,
    ContentType: "audio/mpeg",
  });

  await client.send(command);
  console.log(`☁️ Uploaded "${destinationKey}" to Cloudflare R2 bucket "${config.r2.bucketName}".`);

  if (config.r2.publicUrl) {
    const cleanPublicUrl = config.r2.publicUrl.endsWith("/")
      ? config.r2.publicUrl.slice(0, -1)
      : config.r2.publicUrl;
    return `${cleanPublicUrl}/${destinationKey}`;
  }

  return `/api/stream/${encodeURIComponent(path.basename(filePath))}`;
}

/**
 * Deletes an object from Cloudflare R2 bucket.
 */
export async function deleteFromR2(destinationKey: string): Promise<void> {
  const client = getS3Client();
  if (!client) return;

  const command = new DeleteObjectCommand({
    Bucket: config.r2.bucketName,
    Key: destinationKey,
  });

  await client.send(command);
  console.log(`🗑️ Deleted "${destinationKey}" from Cloudflare R2 bucket.`);
}
