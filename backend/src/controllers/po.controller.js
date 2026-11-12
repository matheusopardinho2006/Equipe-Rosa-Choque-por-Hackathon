const PO = require('../models/PO');
const AppError = require('../utils/AppError');
const poService = require('../services/po.service');
const { lerDemandas } = require('../services/importacao.service');
const { gerarExcelPO, gerarExcelTodasPOs } = require('../services/exportacao.service');
const { demandaSchema } = require('../validators/schemas');

async function buscarOu404(id) {
  const po = await PO.findById(id).lean();
  if (!po) throw new AppError('PO não encontrada', 404);
  return po;
}

module.exports = {
  // Valida e calcula sem salvar
  preview: async (req, res) => res.json(await poService.montarPO(req.body)),

  // Cria a PO: código e Rev. 00 gerados automaticamente
  criar: async (req, res) => res.status(201).json(await poService.criarPO(req.body)),

  // Cria múltiplas POs confirmadas a partir da tela de confirmação de importação
  criarLote: async (req, res) => {
    const demandas = Array.isArray(req.body?.demandas) ? req.body.demandas : [];
    if (!demandas.length) throw new AppError('Selecione ao menos um procedimento para cadastrar');
    const criadas = [];
    for (const d of demandas) {
      const v = demandaSchema.safeParse(d);
      if (!v.success) {
        throw new AppError('Dados inválidos em um dos procedimentos selecionados', 422, v.error.flatten().fieldErrors);
      }
      criadas.push(await poService.criarPO(v.data));
    }
    res.status(201).json(criadas);
  },

  // Atualiza uma PO existente recalculando os tempos
  atualizar: async (req, res) => res.json(await poService.atualizarPO(req.params.id, req.body)),

  // Upload de JSON / Excel / CSV / TXT com uma ou várias demandas (pré-visualização para confirmação)
  importar: async (req, res) => {
    if (!req.file) throw new AppError('Envie um arquivo no campo "arquivo"');
    const demandas = lerDemandas(req.file);
    if (!demandas.length) throw new AppError('Nenhuma demanda encontrada no arquivo');
    const resultado = [];
    for (const [i, d] of demandas.entries()) {
      const demandaBruta = {
        familia: d.familia != null ? String(d.familia).trim() : '',
        tamanho: d.tamanho != null ? String(d.tamanho).trim() : '',
        medidas: d.medidas != null ? String(d.medidas).trim() : '',
        pontosCm: d.pontosCm ?? '',
        perimetroM: d.perimetroM ?? '',
        operacao: d.operacao != null ? String(d.operacao).trim() : '',
        maquina: d.maquina != null && d.maquina !== '' && Number.isFinite(Number(d.maquina)) ? Number(d.maquina) : null,
        elementos: Array.isArray(d.elementos) ? d.elementos : [],
      };
      const v = demandaSchema.safeParse(d);
      if (!v.success) {
        resultado.push({
          linha: i + 1,
          ok: false,
          erro: v.error.flatten().fieldErrors,
          demanda: demandaBruta,
        });
        continue;
      }
      try {
        const previa = await poService.montarPO(v.data);
        resultado.push({
          linha: i + 1,
          ok: true,
          demanda: v.data,
          ...previa,
        });
      } catch (e) {
        resultado.push({
          linha: i + 1,
          ok: false,
          erro: e.message,
          demanda: v.data,
        });
      }
    }
    res.json(resultado);
  },

  // Histórico (busca opcional por código da PO ou família)
  listar: async (req, res) => {
    const { busca } = req.query;
    const filtro = {};
    if (busca) filtro.$or = [{ codigoPO: { $regex: busca, $options: 'i' } }, { familia: { $regex: busca, $options: 'i' } }];
    res.json(await PO.find(filtro).sort({ updatedAt: -1 }).lean());
  },

  buscar: async (req, res) => res.json(await buscarOu404(req.params.id)),

  remover: async (req, res) => {
    const po = await buscarOu404(req.params.id);
    await PO.deleteOne({ _id: po._id });
    res.status(204).end();
  },

  excel: async (req, res) => {
    const po = await buscarOu404(req.params.id);
    const buf = await gerarExcelPO(po);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${po.codigoPO}_Rev${po.revisao}.xlsx"`);
    res.send(Buffer.from(buf));
  },

  excelTodas: async (_req, res) => {
    const pos = await PO.find().sort({ updatedAt: -1 }).lean();
    if (!pos.length) throw new AppError('Nenhuma PO encontrada para exportação', 404);
    const buf = await gerarExcelTodasPOs(pos);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="todas-as-pos.xlsx"');
    res.send(Buffer.from(buf));
  },

};
