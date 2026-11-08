const Maquina = require('../models/Maquina');
const Elemento = require('../models/Elemento');
const PO = require('../models/PO');
const Contador = require('../models/Contador');
const AppError = require('../utils/AppError');
const { calcularPO } = require('./calculo.service');
const { siglaFamilia, formatarCodigo } = require('../utils/identificacao');

async function carregarCatalogo(codigos) {
  const elementos = await Elemento.find({ codigo: { $in: codigos }, ativo: true }).lean();
  return new Map(elementos.map((e) => [e.codigo, e]));
}

async function snapshotMaquina(codigo) {
  const maq = await Maquina.findOne({ codigo, ativo: true });
  if (!maq) throw new AppError(`Máquina ${codigo} não cadastrada`, 422);
  const { rpmMin, rpmMax } = maq.faixaRpm();
  return { codigo: maq.codigo, descricao: maq.descricao, rpmPadrao: maq.rpmPadrao, rpmMin, rpmMax, tempoPorMetro: maq.tempoPorMetro };
}

/**
 * Calcula a ficha a partir das entradas do usuário, SEM salvar.
 * entrada = { familia, tamanho, medidas, pontosCm, perimetroM, operacao, maquina, elementos:[{codigo, frequencia}] }
 */
async function montarPO(entrada) {
  const { familia, tamanho, operacao, medidas } = entrada;
  const maquina = await snapshotMaquina(entrada.maquina);
  const catalogo = await carregarCatalogo(entrada.elementos.map((e) => e.codigo));
  const calc = calcularPO({ perimetroM: entrada.perimetroM, maquina, itens: entrada.elementos, catalogo });
  return {
    familia,
    tamanho,
    perimetroM: entrada.perimetroM,
    pontosCm: entrada.pontosCm,
    operacao,
    medidas,
    maquina,
    ...calc,
  };
}

/** Próximo código livre para a família: PO-SL-001, PO-SL-002... */
async function gerarCodigo(familia) {
  const sigla = siglaFamilia(familia);
  for (;;) {
    const codigo = formatarCodigo(sigla, await Contador.proximo(sigla));
    if (!(await PO.exists({ codigoPO: codigo }))) return codigo;
  }
}

async function criarPO(entrada) {
  const dados = await montarPO(entrada);
  const codigoPO = await gerarCodigo(dados.familia);
  // Revisões (Rev. 01, 02...) ainda não implementadas: toda PO nasce Rev. 00
  return PO.create({ ...dados, codigoPO, revisao: '00' });
}

module.exports = { montarPO, criarPO };
