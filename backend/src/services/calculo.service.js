const { r4 } = require('../utils/numero');
const AppError = require('../utils/AppError');

/**
 * Motor de cálculo T&M — função pura (sem banco), fácil de testar.
 *
 * FIXO = perímetro (m) × tempo por metro da máquina
 * Elemento = tempo unitário MTM × frequência
 * TP = FIXO + Σ elementos
 *
 * @param {object} p
 * @param {number} p.perimetroM
 * @param {{tempoPorMetro:number}} p.maquina
 * @param {{codigo:string, frequencia?:number}[]} p.itens  sequência na ordem de execução
 * @param {Map<string,{descricao:string,tempo:number}>} p.catalogo
 */
function calcularPO({ perimetroM, maquina, itens, catalogo }) {
  if (!(perimetroM > 0)) throw new AppError('Perímetro de costura deve ser maior que zero');
  if (!maquina || !(maquina.tempoPorMetro >= 0)) throw new AppError('Máquina sem tempo por metro cadastrado');
  if (!Array.isArray(itens) || itens.length === 0) throw new AppError('Informe ao menos um elemento');

  const faltando = itens.map((i) => i.codigo).filter((c) => !catalogo.has(c));
  if (faltando.length) throw new AppError(`Elemento(s) não cadastrado(s): ${faltando.join(', ')}`, 422);

  const tempoFixo = r4(perimetroM * maquina.tempoPorMetro);

  const linhas = itens.map((it, idx) => {
    const el = catalogo.get(it.codigo);
    const frequencia = it.frequencia ?? 1;
    if (!(frequencia > 0)) throw new AppError(`Frequência inválida no elemento ${it.codigo}`);
    return {
      ordem: idx + 1,
      codigo: it.codigo,
      descricao: el.descricao,
      frequencia,
      tempoUnit: el.tempo,
      tempo: r4(el.tempo * frequencia),
    };
  });

  const tp = r4(tempoFixo + linhas.reduce((s, l) => s + l.tempo, 0));
  return { tempoFixo, itens: linhas, tp };
}

module.exports = { calcularPO };
