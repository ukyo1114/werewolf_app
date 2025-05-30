import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import AppError from '../../utils/AppError';
import { errors } from '../../config/messages';

interface IUploadPicture {
  userId: string;
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
}

const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const uploadPicture = async ({
  userId,
  file,
}: IUploadPicture): Promise<string> => {
  const filePath = `user-icons/${userId}_profile.jpg`;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: filePath,
    Body: file.buffer,
    ContentType: 'image/jpeg',
    CacheControl: 'no-cache',
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
  } catch (error: any) {
    console.error('S3 upload error:', error);
    throw new AppError(500, errors.IMAGE_UPLOAD_FAILED);
  }
};

export default uploadPicture;
