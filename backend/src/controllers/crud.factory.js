const AppError = require('../utils/AppError');
const { lerPlanilha } = require('../services/importacao.service');

/**
 * CRUD genérico por "codigo" (usado por Máquinas e Elementos MTM).
 * parseCodigo: converte o :codigo da URL para o tipo do campo.
 */
function crudFactory(Model, { parseCodigo = (c) => c, preparar = (l) => l, schema, sort = { codigo: 1 } } = {}) {
  return {
    listar: async (_req, res) => {
      res.json(await Model.find({ ativo: true }).sort(sort).lean());
    },

    buscar: async (req, res) => {
      const doc = await Model.findOne({ codigo: parseCodigo(req.params.codigo) }).lean();
      if (!doc) throw new AppError('Não encontrado', 404);
      res.json(doc);
    },

    criar: async (req, res) => {
      res.status(201).json(await Model.create(req.body));
    },

    atualizar: async (req, res) => {
      const doc = await Model.findOneAndUpdate({ codigo: parseCodigo(req.params.codigo) }, req.body, {
        new: true,
        runValidators: true,
      });
      if (!doc) throw new AppError('Não encontrado', 404);
      res.json(doc);
    },

    // Exclusão lógica: POs antigas continuam com o snapshot.
    remover: async (req, res) => {
      const doc = await Model.findOneAndUpdate({ codigo: parseCodigo(req.params.codigo) }, { ativo: false });
      if (!doc) throw new AppError('Não encontrado', 404);
      res.status(204).end();
    },

    // Upload de Excel/CSV: valida cada linha e faz upsert por código (cria ou atualiza).
    // Linhas inválidas são ignoradas e devolvidas em "erros".
    importar: async (req, res) => {
      if (!req.file) throw new AppError('Envie um arquivo no campo "arquivo"');
      const linhas = lerPlanilha(req.file.buffer, req.file.originalname);
      const validas = [];
      const erros = [];
      linhas.forEach((bruta, i) => {
        const v = schema ? schema.safeParse(preparar(bruta)) : { success: true, data: preparar(bruta) };
        if (v.success) validas.push(v.data);
        else erros.push({ linha: i + 2, erro: v.error.flatten().fieldErrors }); // +2: cabeçalho + base 1
      });
      let inseridos = 0;
      let atualizados = 0;
      if (validas.length) {
        const ops = validas.map((l) => ({
          updateOne: { filter: { codigo: parseCodigo(l.codigo) }, update: { $set: { ...l, ativo: true } }, upsert: true },
        }));
        const r = await Model.bulkWrite(ops);
        inseridos = r.upsertedCount;
        atualizados = r.modifiedCount;
      }
      res.json({ lidos: linhas.length, inseridos, atualizados, erros });
    },
  };
}

module.exports = crudFactory;
