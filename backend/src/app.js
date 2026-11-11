const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { corsOrigin } = require('./config/env');
const { connectDB } = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Na Vercel, src/app.js pode ser carregado diretamente como a função Express.
// Aguarda a conexão antes de qualquer consulta e reutiliza a conexão da instância aquecida.
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: 'connected' }));
app.use('/api', routes);
app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));
app.use(errorHandler);

module.exports = app;
