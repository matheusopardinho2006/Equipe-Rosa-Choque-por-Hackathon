const { Schema, model } = require('mongoose');

// Elemento MTM. codigo = "agrupador.elemento" (ex.: "2.1")
const ElementoSchema = new Schema(
  {
    codigo: { type: String, required: true, unique: true, match: /^\d+\.\d+$/ },
    agrupador: { type: Number, required: true },
    elemento: { type: Number, required: true },
    descricao: { type: String, required: true, trim: true },
    tempo: { type: Number, required: true, min: 0 }, // minutos
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ElementoSchema.pre('validate', function (next) {
  if (this.agrupador != null && this.elemento != null && !this.codigo) {
    this.codigo = `${this.agrupador}.${this.elemento}`;
  }
  if (this.codigo && (this.agrupador == null || this.elemento == null)) {
    const [a, e] = this.codigo.split('.').map(Number);
    this.agrupador = a;
    this.elemento = e;
  }
  next();
});

module.exports = model('Elemento', ElementoSchema);
