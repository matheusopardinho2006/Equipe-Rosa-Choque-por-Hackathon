const ExcelJS = require('exceljs');
const { gerarExcelPO, gerarExcelTodasPOs } = require('../src/services/exportacao.service');

function criarPO(codigoPO, revisao, operacao) {
  return {
    codigoPO,
    revisao,
    familia: 'Família teste',
    tamanho: 'M',
    medidas: '1,00 x 2,00',
    pontosCm: 4,
    perimetroM: 6,
    operacao,
    maquina: { codigo: 1, descricao: 'Máquina teste', rpmMin: 100, rpmPadrao: 200, rpmMax: 300 },
    tempoFixo: 0.5,
    itens: [{ codigo: '1.1', descricao: 'Elemento teste', frequencia: 1, tempo: 0.25 }],
    tp: 0.75,
  };
}

async function lerWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(buffer));
  return workbook;
}

describe('Exportação de POs', () => {
  test('mantém a exportação individual em uma ficha Excel', async () => {
    const workbook = await lerWorkbook(await gerarExcelPO(criarPO('PO-SL-001', '00', 'Operação individual')));

    expect(workbook.worksheets).toHaveLength(1);
    expect(workbook.worksheets[0].getCell('A1').value).toBe('PO-SL-001');
    expect(workbook.worksheets[0].getCell('B2').value).toBe('Operação individual');
  });

  test('exporta todas as POs em abas separadas no mesmo arquivo', async () => {
    const pos = [
      criarPO('PO-SL-001', '00', 'Operação um'),
      criarPO('PO-SL-002', '00', 'Operação dois'),
    ];
    const workbook = await lerWorkbook(await gerarExcelTodasPOs(pos));

    expect(workbook.worksheets).toHaveLength(2);
    expect(workbook.worksheets.map((sheet) => sheet.getCell('A1').value)).toEqual([
      'PO-SL-001',
      'PO-SL-002',
    ]);
    expect(workbook.worksheets.map((sheet) => sheet.getCell('B2').value)).toEqual([
      'Operação um',
      'Operação dois',
    ]);
  });
});
