import dotenv from 'dotenv';
dotenv.config({
  path: `.env.${process.env.NODE_ENV || 'dev'}`,
});

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import createError from 'http-errors';
// import path from 'path';

import connectDB from './utils/connectDB';
import verifyEmailRoutes from './routes/verifyEmailRoutes';
// import errorHandler from './middleware/errorHandler';

const app = express();
connectDB();

// ミドルウェアの設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use('/', express.static(path.join(__dirname, 'public/build')));

// ルートの設定
/* app.use('/robots.txt', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
}); */

app.use('/api/verify-email', verifyEmailRoutes);

app.get('*', (req: Request, res: Response) => {
  res.status(200).send();
});

// HTTPサーバーの作成
const server = http.createServer(app);

// 未定義のルートに対する404エラーを作成
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// グローバルエラーハンドリングミドルウェア
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message,
    // errors: err.errors || null,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// サーバーの起動
const port: number = parseInt(process.env.PORT || '5000', 10);
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

export default server;
