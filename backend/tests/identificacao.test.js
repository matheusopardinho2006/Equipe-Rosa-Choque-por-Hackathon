const { siglaFamilia, formatarCodigo } = require('../src/utils/identificacao');
const { parseElementos } = require('../src/utils/elementos');
const { demandaSchema } = require('../src/validators/schemas');

describe('Identificação da PO', () => {
  test('sigla da família', () => {
    expect(siglaFamilia('Sobre-lençol')).toBe('SL');
    expect(siglaFamilia('Fronha')).toBe('FR');
    expect(siglaFamilia('Toalha de Banho')).toBe('TB');
  });
  test('código da PO', () => {
    expect(formatarCodigo('SL', 1)).toBe('PO-SL-001');
    expect(formatarCodigo('FR', 12)).toBe('PO-FR-012');
  });
});

describe('Entrada do roteiro', () => {
  const esperado = [{ codigo: '2.1', frequencia: 1 }, { codigo: '1.1', frequencia: 1 }, { codigo: '3.1', frequencia: 1 }];
  test.each([['2.1, 1.1, 3.1'], ['2.1;1.1;3.1'], ['2.1,1.1,3.1'], [['2.1', '1.1', '3.1']], [[2.1, 1.1, 3.1]]])('%p', (v) => {
    expect(parseElementos(v)).toEqual(esperado);
  });
  test('frequência no texto', () => expect(parseElementos('2.1x2, 3.1')).toEqual([{ codigo: '2.1', frequencia: 2 }, { codigo: '3.1', frequencia: 1 }]));
});

describe('Schema da demanda (todos os dados do produto obrigatórios)', () => {
  const ok = { familia: 'Sobre-lençol', tamanho: 'Solteiro', medidas: '1,80 x 2,50', pontosCm: '2,5', perimetroM: '6,96', operacao: 'Bainhar no corpo do SL - 1 lado', maquina: '1', elementos: '2.1, 1.1, 3.1' };

  test('cenário oficial é válido, converte números e ignora campos extras', () => {
    const r = demandaSchema.safeParse({ ...ok, codigoPO: 'X' });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ ...ok, pontosCm: 2.5, perimetroM: 6.96, maquina: 1, elementos: [{ codigo: '2.1', frequencia: 1 }, { codigo: '1.1', frequencia: 1 }, { codigo: '3.1', frequencia: 1 }] });
  });

  test.each(['familia', 'tamanho', 'medidas', 'pontosCm', 'perimetroM', 'operacao', 'maquina', 'elementos'])('sem %s é recusado', (campo) => {
    const { [campo]: _, ...sem } = ok;
    const r = demandaSchema.safeParse(sem);
    expect(r.success).toBe(false);
    expect(r.error.flatten().fieldErrors[campo]).toBeDefined();
  });

  test.each(['', '   '])('campo em branco é recusado (%p)', (v) => {
    expect(demandaSchema.safeParse({ ...ok, tamanho: v }).success).toBe(false);
  });

  test.each(['1,80 x 2,50', '1.8x2.5', '1,80 X 2,50', '1,80 × 2,50'])('medidas válidas: %p', (m) => {
    expect(demandaSchema.safeParse({ ...ok, medidas: m }).success).toBe(true);
  });
  test.each(['180', 'grande', '1,80 x'])('medidas inválidas: %p', (m) => {
    expect(demandaSchema.safeParse({ ...ok, medidas: m }).success).toBe(false);
  });

  test('números inválidos são recusados', () => {
    const r = demandaSchema.safeParse({ ...ok, perimetroM: 'abc', pontosCm: '0' });
    expect(Object.keys(r.error.flatten().fieldErrors)).toEqual(['pontosCm', 'perimetroM']);
  });

});
