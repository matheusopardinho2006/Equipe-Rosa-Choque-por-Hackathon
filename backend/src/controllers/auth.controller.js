const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const AppError = require('../utils/AppError');
const { jwtSecret } = require('../config/env');

module.exports = {
  login: async (req, res) => {
    const { usuario, senha } = req.body || {};
    const u = await Usuario.findOne({ usuario });
    if (!u || !(await bcrypt.compare(senha || '', u.senhaHash))) throw new AppError('Usuário ou senha inválidos', 401);
    const token = jwt.sign({ id: u._id, usuario: u.usuario, perfil: u.perfil }, jwtSecret, { expiresIn: '8h' });
    res.json({ token, usuario: u.usuario, perfil: u.perfil });
  },
};
