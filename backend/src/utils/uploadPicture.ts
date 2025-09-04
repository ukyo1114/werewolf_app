import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import AppError from '../utils/AppError';
import { errors } from '../config/messages';

const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export const uploadPicture = async ({
  userId,
  pic,
}: {
  userId: string;
  pic: string; // base64 encoded image
}): Promise<string> => {
  const timestamp = Date.now().toString().slice(1, -4);
  const filePath = `user-icons/${userId}_${timestamp}.jpg`;

  const base64Data = pic.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: filePath,
    Body: buffer,
    ContentType: 'image/jpeg',
    CacheControl: 'no-cache',
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    const url = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    return url;
  } catch (error: any) {
    console.error('S3 upload error:', error);
    throw new AppError(500, errors.IMAGE_UPLOAD_FAILED);
  }
};
