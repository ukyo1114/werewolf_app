require('dotenv').config({ path: '.env.test' });

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
});

/* beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}); */

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
