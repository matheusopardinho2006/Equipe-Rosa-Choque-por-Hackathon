const XLSX = require('xlsx');
const AppError = require('../utils/AppError');
const { parseElementos } = require('../utils/elementos');

/** Lê Excel/CSV (primeira aba) e devolve array de objetos com as chaves do cabeçalho. */
function lerPlanilha(buffer, nome = '') {
  // CSV: lido como texto UTF-8 (acentos) e SEM interpretar números (raw), senão
  // "6,96" num CSV com ";" (padrão do Excel em português) vira 696. A conversão
  // de vírgula para ponto é feita depois, na validação.
  // Excel (.xlsx/.xls): lido como binário; números já vêm como número.
  const wb = nome.toLowerCase().endsWith('.csv')
    ? XLSX.read(buffer.toString('utf8').replace(/^\uFEFF/, ''), { type: 'string', raw: true })
    : XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// Aliases aceitos nos cabeçalhos / chaves do arquivo de texto
const CAMPOS = {
  familia: ['familia', 'agrupamento familia', 'agrupamento', 'agrupamento da familia'],
  tamanho: ['tamanho', 'tam'],
  perimetroM: ['perimetrom', 'perimetro', 'perimetro de costura', 'perimetro costura', 'comprimento', 'comprimento de costura'],
  pontosCm: ['pontoscm', 'pontos/cm', 'pontos por cm', 'pontos', 'densidade', 'densidade de pontos'],
  maquina: ['maquina', 'cod eqp', 'cod. eqp', 'cod. eqp.', 'codigo do equipamento', 'equipamento', 'codigo da maquina'],
  operacao: ['operacao', 'nome da operacao', 'descricao da operacao'],
  medidas: ['medidas', 'medidas da peca', 'dimensoes'],
  elementos: ['elementos', 'codigos', 'codigos mtm', 'roteiro', 'roteiro de operacoes', 'operacoes', 'mtm', 'sequencia'],
};
const chave = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[()]/g, '').replace(/\s*\bem m\b/, '').trim();
function mapearCampos(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const ck = chave(k);
    const campo = Object.keys(CAMPOS).find((c) => c.toLowerCase() === ck || CAMPOS[c].includes(ck));
    if (campo) out[campo] = v;
  }
  return out;
}

/**
 * Texto, um bloco por demanda (blocos separados por linha em branco ou ---):
 *   Agrupamento família: Sobre-lençol
 *   Tamanho: Solteiro
 *   Medidas da peça (em m): 1,80 x 2,50
 *   Pontos/cm: 2,5
 *   Perímetro costura (em m): 6,96
 *   Operação: Bainhar no corpo do SL - 1 lado
 *   Cód. Eqp.: 1
 *   Elementos: 2.1, 1.1, 3.1
 */
function lerTexto(conteudo) {
  return conteudo
    .split(/\n\s*(?:-{3,})?\s*\n/)
    .map((bloco) => {
      const obj = {};
      bloco.split('\n').forEach((linha) => {
        const i = linha.indexOf(':');
        if (i > 0) obj[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
      });
      return obj;
    })
    .filter((o) => Object.keys(o).length);
}

/** Aceita .json, .xlsx, .xls, .csv ou .txt — uma ou várias demandas. */
function lerDemandas(file) {
  const nome = file.originalname.toLowerCase();
  let linhas;
  if (nome.endsWith('.json')) {
    let json;
    try {
      json = JSON.parse(file.buffer.toString('utf8').replace(/^\uFEFF/, ''));
    } catch {
      throw new AppError('JSON inválido: verifique vírgulas, aspas e chaves do arquivo');
    }
    linhas = Array.isArray(json) ? json : [json];
  } else if (/\.(xlsx|xls|csv)$/.test(nome)) {
    linhas = lerPlanilha(file.buffer, nome);
  } else if (nome.endsWith('.txt')) {
    linhas = lerTexto(file.buffer.toString('utf8'));
  } else {
    throw new AppError('Formato não suportado. Use .json, .xlsx, .xls, .csv ou .txt');
  }
  return linhas.map(mapearCampos).map((l) => ({ ...l, elementos: parseElementos(l.elementos) }));
}

module.exports = { lerPlanilha, lerDemandas, lerTexto, mapearCampos };
