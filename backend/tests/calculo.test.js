const { calcularPO } = require('../src/services/calculo.service');
const { maquinas, elementos } = require('../scripts/seed-data');

const catalogo = new Map(elementos.map((e) => [e.codigo, e]));
const interlock = maquinas.find((m) => m.codigo === 1);

describe('Motor de cálculo — cenário oficial PO-SL-001', () => {
  const r = calcularPO({
    perimetroM: 6.96,
    maquina: interlock,
    itens: [{ codigo: '2.1' }, { codigo: '1.1' }, { codigo: '3.1' }],
    catalogo,
  });

  test('FIXO = 0,6709', () => expect(r.tempoFixo).toBe(0.6709));
  test('TP = 0,9409', () => expect(r.tp).toBe(0.9409));
  test('mantém a ordem informada', () => expect(r.itens.map((i) => i.codigo)).toEqual(['2.1', '1.1', '3.1']));
  test('busca descrição no catálogo', () => expect(r.itens[0].descricao).toBe('Apanhar peça e posicionar na mesa'));
});

describe('Regras', () => {
  test('frequência multiplica o tempo', () => {
    const r = calcularPO({ perimetroM: 1, maquina: interlock, itens: [{ codigo: '2.1', frequencia: 2 }], catalogo });
    expect(r.itens[0].tempo).toBe(0.3);
  });
  test('código inexistente gera erro', () => {
    expect(() => calcularPO({ perimetroM: 1, maquina: interlock, itens: [{ codigo: '9.9' }], catalogo })).toThrow('9.9');
  });
  test('perímetro zero gera erro', () => {
    expect(() => calcularPO({ perimetroM: 0, maquina: interlock, itens: [{ codigo: '2.1' }], catalogo })).toThrow();
  });
});
