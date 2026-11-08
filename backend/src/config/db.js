const mongoose = require('mongoose');
const { mongoUri } = require('./env');

async function connectDB() {
  if (!mongoUri) throw new Error('MONGO_URI não definida. Copie .env.example para .env e preencha.');
  await mongoose.connect(mongoUri);
  console.log(`[db] conectado em ${mongoose.connection.host}/${mongoose.connection.name}`);
}

module.exports = { connectDB };
