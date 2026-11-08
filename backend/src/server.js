const app = require('./app');
const { port } = require('./config/env');
const { connectDB } = require('./config/db');

connectDB()
  .then(() => app.listen(port, () => console.log(`[api] http://localhost:${port}/api`)))
  .catch((err) => {
    console.error('[db] falha ao conectar:', err.message);
    process.exit(1);
  });
