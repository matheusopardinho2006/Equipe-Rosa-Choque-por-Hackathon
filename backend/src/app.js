const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { corsOrigin } = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.use('/api', routes);
app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));
app.use(errorHandler);

module.exports = app;
