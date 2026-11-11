const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { lerDemandas, lerPlanilha, prepararMaquina } = require('../src/services/importacao.service');
const { demandaSchema, maquinaSchema } = require('../src/validators/schemas');

const EX = path.join(__dirname, '..', 'exemplos');
const arquivo = (nome) => ({ originalname: nome, buffer: fs.readFileSync(path.join(EX, nome)) });
const validar = (d) => demandaSchema.safeParse(d);

const esperado = {
  familia: 'Sobre-lençol',
  tamanho: 'Solteiro',
  medidas: '1,80 x 2,50',
  pontosCm: 2.5,
  perimetroM: 6.96,
  operacao: 'Bainhar no corpo do SL - 1 lado',
  maquina: 1,
  elementos: [{ codigo: '2.1', frequencia: 1 }, { codigo: '1.1', frequencia: 1 }, { codigo: '3.1', frequencia: 1 }],
};

describe('Arquivos de exemplo geram exatamente o cenário oficial', () => {
  test.each(['demanda-PO-SL-001.json', 'demandas.csv', 'demanda.txt', 'demandas.xlsx'])('%s', (nome) => {
    const demandas = lerDemandas(arquivo(nome));
    expect(demandas).toHaveLength(1);
    const r = validar(demandas[0]);
    expect(r.error?.flatten().fieldErrors).toBeUndefined();
    expect(r.data).toEqual(esperado);
  });
});

describe('Cabeçalhos com os títulos da ficha PO', () => {
  test('Excel com títulos "humanos" e números como número', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Agrupamento família', 'Tamanho', 'Medidas da peça (em m)', 'Pontos/cm', 'Perímetro costura (em m)', 'Operação', 'Cód. Eqp.', 'Elementos'],
      ['Sobre-lençol', 'Solteiro', '1,80 x 2,50', 2.5, 6.96, 'Bainhar no corpo do SL - 1 lado', 1, '2.1; 1.1; 3.1'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Demandas');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const [d] = lerDemandas({ originalname: 'x.xlsx', buffer });
    expect(validar(d).data).toEqual(esperado);
  });
});

describe('CSV no padrão brasileiro', () => {
  test('separador ";" e vírgula decimal (Excel em português)', () => {
    const csv = 'familia;tamanho;medidas;pontosCm;perimetroM;operacao;maquina;elementos\nSobre-lençol;Solteiro;1,80 x 2,50;2,5;6,96;Bainhar no corpo do SL - 1 lado;1;2.1, 1.1, 3.1\n';
    const [d] = lerDemandas({ originalname: 'br.csv', buffer: Buffer.from(csv) });
    expect(validar(d).data).toEqual(esperado);
  });
  test('arquivo com BOM (UTF-8 do Excel)', () => {
    const csv = '\uFEFF' + fs.readFileSync(path.join(EX, 'demandas.csv'), 'utf8');
    const [d] = lerDemandas({ originalname: 'bom.csv', buffer: Buffer.from(csv) });
    expect(validar(d).data).toEqual(esperado);
  });
});

describe('Vários registros e erros por linha', () => {
  test('JSON com lista: a linha inválida aponta o campo', () => {
    const lista = [{ ...esperado, elementos: '2.1, 1.1, 3.1' }, { familia: 'Fronha' }];
    const demandas = lerDemandas({ originalname: 'l.json', buffer: Buffer.from(JSON.stringify(lista)) });
    expect(demandas).toHaveLength(2);
    expect(validar(demandas[0]).success).toBe(true);
    const erros = validar(demandas[1]).error.flatten().fieldErrors;
    expect(Object.keys(erros).sort()).toEqual(['elementos', 'maquina', 'medidas', 'operacao', 'perimetroM', 'pontosCm', 'tamanho']);
  });

  test('TXT com dois blocos separados por linha em branco', () => {
    const txt = fs.readFileSync(path.join(EX, 'demanda.txt'), 'utf8');
    const demandas = lerDemandas({ originalname: 'd.txt', buffer: Buffer.from(`${txt}\n\n${txt}`) });
    expect(demandas).toHaveLength(2);
    demandas.forEach((d) => expect(validar(d).success).toBe(true));
  });

  test('extensão não suportada', () => {
    expect(() => lerDemandas({ originalname: 'x.pdf', buffer: Buffer.from('') })).toThrow('Formato não suportado');
  });
});

describe('Importação de máquinas', () => {
  const ler = (nome, conteudo) => lerPlanilha(Buffer.isBuffer(conteudo) ? conteudo : Buffer.from(conteudo), nome).map(prepararMaquina);
  const validar = (m) => maquinaSchema.safeParse(m);
  const galoneira = { codigo: 4, descricao: 'Galoneira', rpmPadrao: 4500, tempoPorMetro: 0.09 };

  test('CSV brasileiro (";", vírgula decimal, BOM)', () => {
    const [m, n] = ler('m.csv', '\uFEFFcodigo;descricao;rpmPadrao;tempoPorMetro;rpmMin;rpmMax\r\n4;Galoneira;4500;0,0900;;\r\n5;Reta, 1 agulha;5000;0,082;4600;5400\r\n');
    expect(validar(m).data).toEqual(galoneira);
    expect(validar(n).data).toEqual({ codigo: 5, descricao: 'Reta, 1 agulha', rpmPadrao: 5000, tempoPorMetro: 0.082, rpmMin: 4600, rpmMax: 5400 });
  });

  test('CSV do Google Planilhas ("," e decimal entre aspas)', () => {
    const [m] = ler('m.csv', 'codigo,descricao,rpmPadrao,tempoPorMetro,rpmMin,rpmMax\n4,Galoneira,4500,"0,0900",,\n');
    expect(validar(m).data).toEqual(galoneira);
  });

  test('CSV americano ("," e ponto decimal)', () => {
    const [m] = ler('m.csv', 'codigo,descricao,rpmPadrao,tempoPorMetro\n4,Galoneira,4500,0.09\n');
    expect(validar(m).data).toEqual(galoneira);
  });

  test('Excel com títulos em português', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Código', 'Modelo', 'RPM Padrão', 'Tempo por metro (min/m)', 'RPM Mín.', 'RPM Máx.'],
      [4, 'Galoneira', 4500, 0.09, '', ''],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Máquinas');
    const [m] = ler('m.xlsx', XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    expect(validar(m).data).toEqual(galoneira);
  });

  test('linha inválida aponta o campo', () => {
    const [m] = ler('m.csv', 'codigo;descricao;rpmPadrao;tempoPorMetro\n7;Sem tempo;4000;abc\n');
    expect(validar(m).error.flatten().fieldErrors.tempoPorMetro).toEqual(['Informe um número']);
  });
});
