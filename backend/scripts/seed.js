// Popula o banco com o kit do desafio. Uso: npm run seed
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../src/config/db');
const { adminUser, adminPassword } = require('../src/config/env');
const Maquina = require('../src/models/Maquina');
const Elemento = require('../src/models/Elemento');
const Usuario = require('../src/models/Usuario');
const { maquinas, elementos } = require('./seed-data');

(async () => {
  await connectDB();
  for (const m of maquinas) await Maquina.updateOne({ codigo: m.codigo }, { $set: { ...m, ativo: true } }, { upsert: true });
  for (const e of elementos) {
    const [agrupador, elemento] = e.codigo.split('.').map(Number);
    await Elemento.updateOne({ codigo: e.codigo }, { $set: { ...e, agrupador, elemento, ativo: true } }, { upsert: true });
  }
  await Usuario.updateOne(
    { usuario: adminUser },
    { $set: { usuario: adminUser, perfil: 'ADM', senhaHash: await bcrypt.hash(adminPassword, 10) } },
    { upsert: true }
  );
  console.log(`[seed] ${maquinas.length} máquinas, ${elementos.length} elementos, usuário ${adminUser}`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
