// Apaga TODAS as POs e zera os sequenciais (PO-SL-001 volta a ser o próximo).
// Uso: npm run limpar-pos   — útil antes da demo ou depois de mudar o formato das POs.
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');

(async () => {
  await connectDB();
  const db = mongoose.connection.db;
  const pos = await db.collection('pos').deleteMany({});
  await db.collection('contadors').deleteMany({});
  console.log(`[limpar] ${pos.deletedCount} PO(s) removida(s), sequenciais zerados`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
