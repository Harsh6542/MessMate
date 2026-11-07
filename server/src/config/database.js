import mongoose from 'mongoose';

export const connectDB = async (retries = 5, delay = 3000) => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/messmate_dev';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000
      });
      console.log(`[Database] MongoDB Connected successfully to host: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`[Database Error] Attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) {
        console.error('[Database Error] All connection attempts failed.');
        console.error('[Database Hint] If on college Wi-Fi, connect to your mobile hotspot (college firewalls block port 27017).');
        throw error;
      }
      console.log(`[Database] Retrying connection in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB connection disconnected. Attempting reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Error] MongoDB runtime error: ${err.message}`);
});

export default connectDB;

