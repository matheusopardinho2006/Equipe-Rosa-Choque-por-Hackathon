// Popula o banco com o kit do desafio. Uso: npm run seed
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const { adminEmail, adminFirebaseUid } = require('../src/config/env');
const Maquina = require('../src/models/Maquina');
const Elemento = require('../src/models/Elemento');
const Usuario = require('../src/models/Usuario');
const { maquinas, elementos } = require('./seed-data');

(async () => {
  if (!adminFirebaseUid) throw new Error('Configure ADMIN_FIREBASE_UID com o UID do administrador no Firebase');
  await connectDB();
  for (const m of maquinas) await Maquina.updateOne({ codigo: m.codigo }, { $set: { ...m, ativo: true } }, { upsert: true });
  for (const e of elementos) {
    const [agrupador, elemento] = e.codigo.split('.').map(Number);
    await Elemento.updateOne({ codigo: e.codigo }, { $set: { ...e, agrupador, elemento, ativo: true } }, { upsert: true });
  }
  await Usuario.updateOne(
    { firebaseUid: adminFirebaseUid },
    { $set: { firebaseUid: adminFirebaseUid, usuario: adminEmail || adminFirebaseUid, perfil: 'ADM' } },
    { upsert: true }
  );
  console.log(`[seed] ${maquinas.length} máquinas, ${elementos.length} elementos, UID ADM ${adminFirebaseUid}`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
