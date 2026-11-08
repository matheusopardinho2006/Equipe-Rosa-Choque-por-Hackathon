require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3333,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
};
