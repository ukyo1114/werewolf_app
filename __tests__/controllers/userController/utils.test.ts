// モック用の変数
const mockSend = jest.fn();

// S3Clientのモック
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn().mockImplementation((params) => ({
    input: params,
  })),
}));

// Userモデルのモック
jest.mock('../../../src/models/User', () => ({
  findByIdAndUpdate: jest.fn(),
}));

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { uploadPicture } from '../../../src/controllers/userController/utils';
import AppError from '../../../src/utils/AppError';
import { errors } from '../../../src/config/messages';
import User from '../../../src/models/User';
import { ObjectId } from 'mongodb';

describe('uploadPicture', () => {
  // テスト用の環境変数
  const mockEnv = {
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
    S3_BUCKET_NAME: 'test-bucket',
  };

  // テスト用のデータ - 有効なObjectIdを使用
  const mockBase64Image = 'data:image/jpeg;base64,dGVzdC1pbWFnZS1kYXRh'; // "test-image-data" をbase64エンコード
  const mockUserId = new ObjectId().toString();

  beforeEach(() => {
    // 環境変数の設定
    process.env = { ...process.env, ...mockEnv };

    // モックのリセット
    jest.clearAllMocks();
    mockSend.mockReset();
  });

  it('should successfully upload a file to S3', async () => {
    // 成功時のモック実装
    mockSend.mockResolvedValueOnce({});
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({});

    const result = await uploadPicture({
      userId: mockUserId,
      pic: mockBase64Image,
    });

    // 期待される結果
    const expectedUrl = `https://${mockEnv.S3_BUCKET_NAME}.s3.${mockEnv.AWS_REGION}.amazonaws.com/user-icons/${mockUserId}_profile.jpg`;

    // アサーション
    expect(result).toBe(expectedUrl);
    expect(mockSend).toHaveBeenCalled();
    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: mockEnv.S3_BUCKET_NAME,
      Key: `user-icons/${mockUserId}_profile.jpg`,
      Body: Buffer.from('test-image-data'),
      ContentType: 'image/jpeg',
      CacheControl: 'no-cache',
    });
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(mockUserId, {
      pic: expectedUrl,
    });
  });

  it('should throw AppError when S3 upload fails', async () => {
    // エラー時のモック実装
    mockSend.mockRejectedValueOnce(new Error('S3 upload failed'));

    // エラーが投げられることを期待
    await expect(
      uploadPicture({
        userId: mockUserId,
        pic: mockBase64Image,
      }),
    ).rejects.toThrow(new AppError(500, errors.IMAGE_UPLOAD_FAILED));
  });
});
