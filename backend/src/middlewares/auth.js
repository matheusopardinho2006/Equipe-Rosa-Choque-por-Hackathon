const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const AppError = require('../utils/AppError');

function autenticar(req, _res, next) {
  const [, token] = (req.headers.authorization || '').split(' ');
  if (!token) return next(new AppError('Token não informado', 401));
  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    next(new AppError('Token inválido ou expirado', 401));
  }
}

const exigirPerfil = (...perfis) => (req, _res, next) =>
  perfis.includes(req.user?.perfil) ? next() : next(new AppError('Sem permissão', 403));

module.exports = { autenticar, exigirPerfil };
