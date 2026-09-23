// ============================================================
// Backblaze B2 S3 client configuration
// Uses @aws-sdk/client-s3 for object storage operations
// ============================================================

import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Config = {
  endpoint: process.env.S3_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com',
  region: process.env.S3_REGION || 'us-west-004',
  bucket: process.env.S3_BUCKET || 'itver-maintenance',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true,
};

export const s3Client = new S3Client({
  endpoint: s3Config.endpoint,
  region: s3Config.region,
  credentials: s3Config.credentials,
  forcePathStyle: true,
});

export const s3Bucket = s3Config.bucket;

// Helper to generate a unique file key
export function generateFileKey(originalName: string, ticketId: string): string {
  const ext = originalName.split('.').pop();
  const timestamp = Date.now();
  return `tickets/${ticketId}/${timestamp}-${Date.now()}.${ext}`;
}

// Generate a presigned URL for download (expires in 1 hour)
export async function getPresignedUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: s3Bucket,
    Key: fileKey,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, s3Client as default };
