jest.mock('./src/utils/decodeToken', () => ({
  decodeToken: jest.fn(),
}));
jest.mock('nodemailer');

import dotenv from 'dotenv';
dotenv.config({ path: '.env.dev' });

// import app, { appState, Events } from './src/app';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { IUser } from './src/config/types';
import { socketHandler } from './src/socketHandlers/socketHandler';
import { Server as SocketIOServer } from 'socket.io';

// export const { gameManagers, channelManagers, entryManagers } = appState;
// export const { entryEvents, channelEvents, gameEvents } = Events;

let io: SocketIOServer;
export let sendMailMock: jest.Mock;

beforeAll(async () => {
  (nodemailer.createTransport as jest.Mock).mockReturnValue({
    sendMail: jest.fn(() => Promise.resolve({})),
  });
  sendMailMock = (nodemailer.createTransport() as any).sendMail;

  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI is not defined');
  }
  await mongoose.connect(mongoURI);

  /* const port: number = parseInt(process.env.PORT || '5000', 10);
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });

  io = socketHandler(app); */
});

afterAll(async () => {
  await mongoose.disconnect();
  // io.close();
  // app.close();
});

/* export const mockUserId = new ObjectId().toString();
export const mockChannelId: string = new ObjectId().toString();
export const mockGameId: string = new ObjectId().toString();
export const mockUsers: IUser[] = [
  { userId: new ObjectId().toString(), userName: 'Alice' },
  { userId: new ObjectId().toString(), userName: 'Bob' },
  { userId: new ObjectId().toString(), userName: 'Charlie' },
  { userId: new ObjectId().toString(), userName: 'Diana' },
  { userId: new ObjectId().toString(), userName: 'Eve' },
  { userId: new ObjectId().toString(), userName: 'Frank' },
  { userId: new ObjectId().toString(), userName: 'Grace' },
  { userId: new ObjectId().toString(), userName: 'Hank' },
  { userId: new ObjectId().toString(), userName: 'Ivy' },
  { userId: new ObjectId().toString(), userName: 'Jack' },
]; */
