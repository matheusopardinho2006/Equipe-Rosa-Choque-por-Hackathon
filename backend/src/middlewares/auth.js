const { getFirebaseAuth } = require('../config/firebase');
const Usuario = require('../models/Usuario');
const AppError = require('../utils/AppError');

async function autenticar(req, _res, next) {
  const [scheme, token, ...extra] = (req.headers.authorization || '').trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token || extra.length) {
    return next(new AppError('Token Firebase não informado', 401));
  }

  try {
    const identity = await getFirebaseAuth().verifyIdToken(token, true);
    const user = await Usuario.findOne({ firebaseUid: identity.uid }).select('usuario perfil');
    if (!user) return next(new AppError('Usuário sem acesso ao sistema', 403));

    req.user = {
      id: user._id.toString(),
      uid: identity.uid,
      email: identity.email,
      usuario: identity.email || user.usuario,
      perfil: user.perfil,
    };
    return next();
  } catch (error) {
    if (typeof error.code === 'string' && error.code.startsWith('auth/')) {
      return next(new AppError('Token Firebase inválido ou expirado', 401));
    }
    return next(error);
  }
}

const exigirPerfil = (...perfis) => (req, _res, next) =>
  perfis.includes(req.user?.perfil) ? next() : next(new AppError('Sem permissão', 403));

module.exports = { autenticar, exigirPerfil };
