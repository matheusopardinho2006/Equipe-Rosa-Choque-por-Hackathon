const mongoose = require('mongoose');
const { mongoUri } = require('./env');

let connectionPromise = null;

mongoose.connection.on('disconnected', () => {
  connectionPromise = null;
});

async function connectDB() {
  if (!mongoUri) throw new Error('MONGO_URI não definida. Copie .env.example para .env e preencha.');

  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
      .then(() => {
        console.log(`[db] conectado em ${mongoose.connection.host}/${mongoose.connection.name}`);
        return mongoose.connection;
      })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }

  return connectionPromise;
}

module.exports = { connectDB };
