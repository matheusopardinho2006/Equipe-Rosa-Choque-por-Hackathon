const { Schema, model } = require('mongoose');

// A PO guarda uma CÓPIA (snapshot) da máquina e dos elementos usados,
// para que edições futuras nos cadastros não alterem fichas já geradas.
const ItemSchema = new Schema(
  {
    ordem: Number,
    codigo: String,
    descricao: String,
    frequencia: { type: Number, default: 1 },
    tempoUnit: Number,
    tempo: Number,
  },
  { _id: false }
);

const POSchema = new Schema(
  {
    // Identificação (gerada pelo sistema)
    codigoPO: { type: String, required: true, index: true }, // PO-SL-001
    revisao: { type: String, required: true, default: '00' }, // revisões ainda não implementadas

    // Entradas do usuário
    familia: { type: String, required: true, trim: true }, // Agrupamento família (digitado)
    tamanho: { type: String, required: true, trim: true },
    perimetroM: { type: Number, required: true },
    pontosCm: { type: Number, required: true },
    operacao: { type: String, required: true, trim: true },
    medidas: { type: String, required: true, trim: true }, // ex.: "1,80 x 2,50"

    // Snapshot da máquina
    maquina: {
      codigo: Number,
      descricao: String,
      rpmPadrao: Number,
      rpmMin: Number,
      rpmMax: Number,
      tempoPorMetro: Number,
    },

    // Resultado do cálculo
    tempoFixo: Number,
    itens: [ItemSchema],
    tp: Number,

  },
  { timestamps: true }
);

POSchema.index({ codigoPO: 1, revisao: 1 }, { unique: true });

module.exports = model('PO', POSchema);
