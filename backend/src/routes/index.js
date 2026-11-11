const { Router } = require('express');
const h = require('../utils/asyncHandler');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const { autenticar, exigirPerfil } = require('../middlewares/auth');
const crudFactory = require('../controllers/crud.factory');
const po = require('../controllers/po.controller');
const auth = require('../controllers/auth.controller');
const Maquina = require('../models/Maquina');
const Elemento = require('../models/Elemento');
const { maquinaSchema, elementoSchema, demandaSchema } = require('../validators/schemas');
const { prepararMaquina } = require('../services/importacao.service');

const r = Router();
const adm = [autenticar, exigirPerfil('ADM')];



// Autenticação Firebase e perfil autorizado no sistema
r.get('/auth/me', autenticar, h(auth.me));

// CRUD de cadastros (leitura liberada a usuários logados; escrita só ADM)
function rotasCrud(path, ctrl, schema, { importar = false } = {}) {
  r.get(path, autenticar, h(ctrl.listar));
  r.get(`${path}/:codigo`, autenticar, h(ctrl.buscar));
  r.post(path, ...adm, validate(schema), h(ctrl.criar));
  r.put(`${path}/:codigo`, ...adm, validate(schema, { partial: true }), h(ctrl.atualizar));
  r.delete(`${path}/:codigo`, ...adm, h(ctrl.remover));
  if (importar) r.post(`${path}/importar`, ...adm, upload.single('arquivo'), h(ctrl.importar));
}
rotasCrud(
  '/maquinas',
  crudFactory(Maquina, { parseCodigo: Number, exclusaoFisica: true, preparar: prepararMaquina, schema: maquinaSchema }),
  maquinaSchema,
  { importar: true }
);
// Linha da planilha de elementos → { codigo, agrupador, elemento, descricao, tempo }
const prepararElemento = (l) => {
  const codigo = String(l.codigo ?? '').replace(',', '.').trim();
  const [agrupador, elemento] = codigo.split('.').map(Number);
  return { codigo, agrupador, elemento, descricao: String(l.descricao ?? '').trim(), tempo: l.tempo };
};
rotasCrud(
  '/elementos',
  crudFactory(Elemento, { exclusaoFisica: true, preparar: prepararElemento, schema: elementoSchema }),
  elementoSchema,
  { importar: true }
);

// POs (demandas)
r.post('/pos/preview', autenticar, validate(demandaSchema), h(po.preview));
r.post('/pos/importar', autenticar, upload.single('arquivo'), h(po.importar));
r.post('/pos', autenticar, validate(demandaSchema), h(po.criar));
r.get('/pos', autenticar, h(po.listar));
r.get('/pos/exportar/excel', autenticar, h(po.excelTodas));
r.get('/pos/:id', autenticar, h(po.buscar));
r.delete('/pos/:id', ...adm, h(po.remover));
r.get('/pos/:id/excel', autenticar, h(po.excel));
// TODO (próximo dev): revisões da PO (Rev. 01, 02...)

module.exports = r;
