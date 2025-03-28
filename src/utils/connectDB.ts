import mongoose from 'mongoose';
import { database } from '../config/messages';

const connectDB = async (): Promise<void> => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      const mongoURI = process.env.MONGO_URI;
      if (!mongoURI) {
        throw new Error(database.URI_NOT_DEFINED);
      }
      await mongoose.connect(mongoURI);
      console.log(database.CONNECT_SUCCESS);
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
};

export default connectDB;
