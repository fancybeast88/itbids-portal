import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY || '',
    secretAccessKey: process.env.R2_SECRET_KEY || '',
  },
});

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error('Only PDF and image files are allowed');
  }
  if (buffer.length > MAX_SIZE_BYTES) {
    throw new Error('File size must be under 5 MB');
  }

  const ext = originalName.split('.').pop();
  const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  await R2.send(new PutObjectCommand({
    Bucket:      process.env.R2_BUCKET_NAME,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
  }));

  return `https://${process.env.R2_BUCKET_NAME}.r2.dev/${key}`;
}

export async function getUploadPresignedUrl(filename: string, contentType: string) {
  const ext = filename.split('.').pop();
  const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const url = await getSignedUrl(R2, new PutObjectCommand({
    Bucket:      process.env.R2_BUCKET_NAME,
    Key:         key,
    ContentType: contentType,
  }), { expiresIn: 300 });

  return { url, key, publicUrl: `https://${process.env.R2_BUCKET_NAME}.r2.dev/${key}` };
}
