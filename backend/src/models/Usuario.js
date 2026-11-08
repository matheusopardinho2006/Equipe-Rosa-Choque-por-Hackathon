const { Schema, model } = require('mongoose');

const UsuarioSchema = new Schema(
  {
    usuario: { type: String, required: true, unique: true },
    senhaHash: { type: String, required: true },
    perfil: { type: String, enum: ['ADM'], default: 'ADM' },
  },
  { timestamps: true }
);

module.exports = model('Usuario', UsuarioSchema);
