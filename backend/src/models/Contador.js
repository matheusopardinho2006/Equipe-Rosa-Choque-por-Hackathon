const { Schema, model } = require('mongoose');

// Sequencial por sigla de família: { _id: "SL", seq: 3 } → próximo PO-SL-004
const ContadorSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });

ContadorSchema.statics.proximo = async function (chave) {
  const c = await this.findOneAndUpdate({ _id: chave }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return c.seq;
};

module.exports = model('Contador', ContadorSchema);
