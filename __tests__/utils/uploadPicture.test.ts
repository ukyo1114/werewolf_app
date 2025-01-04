import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import uploadPicture from '../../src/controllers/userController/utils';
import AppError from '../../src/utils/AppError';
import { errors } from '../../src/config/messages';

const s3Mock = mockClient(S3Client);

describe('uploadPicture', () => {
  const userId = 'test-user-id';
  const base64Image = 'data:image/jpeg;base64,TEST_BASE64_DATA';
  const expectedUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/user-icons/${userId}_profile.jpeg`;

  beforeEach(() => {
    s3Mock.reset();
    s3Mock.on(PutObjectCommand).resolves({});
  });

  it('S3に正常にアップロードできた場合、URLを返すこと', async () => {
    const result = await uploadPicture({ userId, pic: base64Image });
    expect(result).toBe(expectedUrl);
    expect(s3Mock.calls()).toHaveLength(1);
    expect(s3Mock.call(0).args[0].input).toMatchObject({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `user-icons/${userId}_profile.jpeg`,
      ContentType: 'image/jpeg',
    });
  });

  it('S3へのアップロードに失敗した場合、AppErrorを投げること', async () => {
    s3Mock.on(PutObjectCommand).rejects(new Error('S3 Upload Failed'));

    await expect(uploadPicture({ userId, pic: base64Image })).rejects.toThrow(
      AppError,
    );
    try {
      await uploadPicture({ userId, pic: base64Image });
    } catch (error: any) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe(errors.SERVER_ERROR);
    }
  });
});
