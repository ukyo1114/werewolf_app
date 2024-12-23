import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      const mongoURI = process.env.MONGO_URI;
      if (!mongoURI) {
        throw new Error('MONGO_URI is not defined.');
      }
      await mongoose.connect(mongoURI);
      console.log('Connected to MongoDB');
    } else {
      console.log('Skipping database connection in test environment.');
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
};

export default connectDB;
