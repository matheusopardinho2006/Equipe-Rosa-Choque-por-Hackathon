const dns = require('dns');
const mongoose = require('mongoose');
const { mongoUri } = require('./env');

// Configura servidores DNS públicos (Google e Cloudflare) para evitar
// o erro querySrv ECONNREFUSED no Node.js em redes locais/Windows com MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Mantém os servidores do sistema se falhar
}

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
