jest.mock('nodemailer');

import dotenv from 'dotenv';
dotenv.config({ path: '.env.dev' });

// import app, { appState, Events } from './src/app';
import mongoose from 'mongoose';

// export const { gameManagers, channelManagers, entryManagers } = appState;
// export const { entryEvents, channelEvents, gameEvents } = Events;

// let io: SocketIOServer;
// export let sendMailMock: jest.Mock;

beforeAll(async () => {
  /*   (nodemailer.createTransport as jest.Mock).mockReturnValue({
    sendMail: jest.fn(() => Promise.resolve({})),
  });
  sendMailMock = (nodemailer.createTransport() as any).sendMail; */

  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI is not defined');
  }

  // テスト用データベースに接続
  await mongoose.connect(mongoURI, {
    dbName: 'werewolf_test_db',
  });

  /* const port: number = parseInt(process.env.PORT || '5000', 10);
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });

  io = socketHandler(app); */
});

afterAll(async () => {
  // テスト用データベースを削除
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
  // io.close();
  // app.close();
});
