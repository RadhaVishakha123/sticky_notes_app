import { S3Client, PutObjectCommand, DeleteObjectCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { env } from '../config';

let s3: S3Client | null = null;

function getS3(): S3Client {
  if (s3) return s3;
  s3 = new S3Client({
    endpoint: env.MINIO_ENDPOINT,
    region: 'us-east-1',       // MinIO ignores this but the SDK requires a value
    credentials: {
      accessKeyId:     env.MINIO_ACCESS_KEY,
      secretAccessKey: env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true,       // Required for MinIO (AWS uses virtual-hosted style)
  });
  return s3;
}

/**
 * Sets the existing bucket policy to public-read so images load
 * on the mobile app without any auth token. Call once on server startup.
 */
export async function ensureBucketPublic(): Promise<void> {
  const policy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Effect:    'Allow',
      Principal: '*',
      Action:    ['s3:GetObject'],
      Resource:  [`arn:aws:s3:::${env.MINIO_BUCKET}/*`],
    }],
  });
  try {
    await getS3().send(new PutBucketPolicyCommand({ Bucket: env.MINIO_BUCKET, Policy: policy }));
    console.info(`[storage] Bucket "${env.MINIO_BUCKET}" set to public-read`);
  } catch (err) {
    console.error('[storage] Failed to set bucket policy:', err);
  }
}

/**
 * Upload a file buffer to MinIO and return its public URL.
 * The returned URL is permanent and can be stored directly in the note block.
 */
export async function uploadImage(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType.split('/')[1]?.split('+')[0] ?? 'jpg';
  const key = `${randomUUID()}.${ext}`;

  await getS3().send(new PutObjectCommand({
    Bucket:      env.MINIO_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mimeType,
  }));

  return `${env.MINIO_PUBLIC_URL}/${env.MINIO_BUCKET}/${key}`;
}

/**
 * Delete an image from MinIO by its full URL.
 * Call this when a note is deleted or an image block is removed.
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    // Extract key from URL: http://host/bucket/key → key
    const key = url.split(`/${env.MINIO_BUCKET}/`)[1];
    if (!key) return;
    await getS3().send(new DeleteObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }));
  } catch (err) {
    console.error('[storage] deleteImage failed:', err);
  }
}
