const { Schema, model } = require('mongoose');

const MaquinaSchema = new Schema(
  {
    codigo: { type: Number, required: true, unique: true },
    descricao: { type: String, required: true, trim: true },
    rpmPadrao: { type: Number, required: true, min: 0 },
    rpmMin: { type: Number, min: 0 }, // vazio = padrão - 10%
    rpmMax: { type: Number, min: 0 }, // vazio = padrão + 10%
    tempoPorMetro: { type: Number, required: true, min: 0 }, // min/m
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MaquinaSchema.methods.faixaRpm = function () {
  return {
    rpmMin: this.rpmMin ?? Math.round(this.rpmPadrao * 0.9),
    rpmMax: this.rpmMax ?? Math.round(this.rpmPadrao * 1.1),
  };
};

module.exports = model('Maquina', MaquinaSchema);
