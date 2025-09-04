import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'test') return;

  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URIが設定されていません');
    }

    // 単一インスタンス用の接続オプション（トランザクション対応）
    const options = {
      // 接続プール設定
      maxPoolSize: 10,
      minPoolSize: 2,
      // タイムアウト設定
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoURI, options);
    console.log('DB接続成功');
    console.log(`接続先: ${mongoURI}`);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
};

export default connectDB;
