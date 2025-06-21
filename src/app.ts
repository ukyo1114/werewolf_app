import dotenv from 'dotenv';
dotenv.config({
  path: `.env.${process.env.NODE_ENV || 'dev'}`,
});

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import createError from 'http-errors';
// import path from 'path';

import connectDB from './utils/connectDB';
import EntryManager from './classes/EntryManager';
import ChannelManager from './classes/ChannelManager';
import GameManager from './classes/GameManager';
import EventEmitter from 'events';

const app = express();
connectDB();

export const appState: {
  entryManagers: Record<string, EntryManager>;
  channelManagers: Record<string, ChannelManager>;
  gameManagers: Record<string, GameManager>;
} = {
  entryManagers: {},
  channelManagers: {},
  gameManagers: {},
};

export const Events: Record<string, EventEmitter> = {
  entryEvents: new EventEmitter(),
  channelEvents: new EventEmitter(),
  gameEvents: new EventEmitter(),
};

// ミドルウェアの設定
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
// app.use('/', express.static(path.join(__dirname, 'public/build')));

// ルートの設定
/* app.use('/robots.txt', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
}); */

// CORS設定
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

app.use(cors(corsOptions));

// エンドポイント
import verifyEmailRoutes from './routes/verifyEmailRoutes';
import userRoutes from './routes/userRoutes';
import blockRoutes from './routes/blockRoutes';
import channelRoutes from './routes/channelRoutes';
import gameRoutes from './routes/gameRoutes';
import messageRoutes from './routes/messageRoutes';
import spectateRoutes from './routes/spectateRoutes';

app.use('/api/verify-email', verifyEmailRoutes);
app.use('/api/user', userRoutes);
app.use('/api/block', blockRoutes);
app.use('/api/channel', channelRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/spectate', spectateRoutes);

app.get('*', (req: Request, res: Response) => {
  res.status(200).send('');
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
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// サーバーの起動
import { socketHandler } from './socketHandlers/socketHandler';
const port: number = parseInt(process.env.PORT || '5000', 10);
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

export const io = socketHandler(server);

export default server;
