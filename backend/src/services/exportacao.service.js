const ExcelJS = require('exceljs');

// Ficha PO no layout do modelo oficial (5 colunas, A–E):
//  1  | PO-SL-001 (A:D)                                   | Rev. 00
//  2  | Operação  | <operação> (B:E)
//  3  | Agrupamento família | Tamanho | Medidas da peça | Pontos/cm | Perímetro costura
//  4  | valores
//  5  | Cód. Eqp. | Equipamento | RPM - limite inferior | RPM - padrão | RPM - limite superior
//  6  | valores
//  7  | Código do elemento | Elementos (B:C) | Frequência | Tempos (em minutos)
//  8  | FIXO (linha amarela) | Tempo de costura | 1 | tempo
//  9+ | elementos MTM
//  .. | TP — Tempo total da operação (soma por fórmula)

const SERIF = 'Times New Roman';
const SANS = 'Arial';
const CINZA = 'FFD9D9D9';
const AMARELO = 'FFFFFF00';
const FINA = { style: 'thin', color: { argb: 'FF000000' } };
const BORDA = { top: FINA, left: FINA, bottom: FINA, right: FINA };
const CENTRO = { horizontal: 'center', vertical: 'middle', wrapText: true };

function estilo(cell, { font = SANS, bold = false, size = 11, fill, numFmt } = {}) {
  cell.font = { name: font, bold, size };
  cell.alignment = CENTRO;
  cell.border = BORDA;
  if (fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  if (numFmt) cell.numFmt = numFmt;
}

// Linha de títulos (fundo cinza, negrito)
function linhaTitulos(ws, r, titulos) {
  titulos.forEach((t, i) => {
    if (t == null) return;
    ws.getCell(r, i + 1).value = t;
    estilo(ws.getCell(r, i + 1), { bold: true, fill: CINZA });
  });
}

// Linha de valores (fonte serifada, como no modelo)
function linhaValores(ws, r, valores) {
  valores.forEach((v, i) => {
    ws.getCell(r, i + 1).value = v ?? '';
    estilo(ws.getCell(r, i + 1), { font: SERIF });
  });
}

/** Gera a ficha PO em Excel. Retorna Buffer. */
async function gerarExcelPO(po) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Auto-T&M';
  const ws = wb.addWorksheet(po.codigoPO);
  ws.columns = [{ width: 22 }, { width: 28 }, { width: 25 }, { width: 16 }, { width: 24 }];

  // 1 — Código e revisão
  ws.mergeCells('A1:D1');
  ws.getCell('A1').value = po.codigoPO;
  ws.getCell('E1').value = `Rev. ${po.revisao}`;
  ['A1', 'B1', 'C1', 'D1', 'E1'].forEach((c) => estilo(ws.getCell(c), { font: SERIF, bold: true, size: 16 }));
  ws.getRow(1).height = 42;

  // 2 — Operação
  ws.getCell('A2').value = 'Operação';
  estilo(ws.getCell('A2'), { bold: true, fill: CINZA });
  ws.mergeCells('B2:E2');
  ws.getCell('B2').value = po.operacao || '';
  ['B2', 'C2', 'D2', 'E2'].forEach((c) => estilo(ws.getCell(c)));

  // 3/4 — Produto
  linhaTitulos(ws, 3, ['Agrupamento família', 'Tamanho', 'Medidas da peça\n(em m)', 'Pontos/cm', 'Perímetro costura\n(em m)']);
  ws.getRow(3).height = 30;
  linhaValores(ws, 4, [po.familia, po.tamanho, po.medidas, po.pontosCm, po.perimetroM]);

  // 5/6 — Equipamento
  linhaTitulos(ws, 5, ['Cód. Eqp.', 'Equipamento', 'RPM - limite inferior', 'RPM - padrão', 'RPM - limite superior']);
  linhaValores(ws, 6, [po.maquina.codigo, po.maquina.descricao, po.maquina.rpmMin, po.maquina.rpmPadrao, po.maquina.rpmMax]);

  // 7 — Cabeçalho dos elementos
  linhaTitulos(ws, 7, ['Código do elemento', 'Elementos', null, 'Frequência', 'Tempos (em minutos)']);
  ws.mergeCells('B7:C7');

  // 8+ — FIXO e elementos MTM
  const linhas = [
    { codigo: 'FIXO', descricao: 'Tempo de costura', frequencia: 1, tempo: po.tempoFixo, fixo: true },
    ...po.itens.map((i) => ({ codigo: i.codigo, descricao: i.descricao, frequencia: i.frequencia, tempo: i.tempo })),
  ];
  let r = 8;
  for (const l of linhas) {
    ws.mergeCells(r, 2, r, 3);
    ws.getCell(r, 1).value = l.codigo;
    ws.getCell(r, 2).value = l.descricao;
    ws.getCell(r, 4).value = l.frequencia;
    ws.getCell(r, 5).value = l.tempo;
    const fill = l.fixo ? AMARELO : undefined;
    estilo(ws.getCell(r, 1), { font: SERIF, bold: true, fill });
    estilo(ws.getCell(r, 2), { font: l.fixo ? SERIF : SANS, fill });
    estilo(ws.getCell(r, 3), { font: l.fixo ? SERIF : SANS, fill });
    estilo(ws.getCell(r, 4), { font: l.fixo ? SERIF : SANS, fill });
    estilo(ws.getCell(r, 5), { font: l.fixo ? SERIF : SANS, fill, numFmt: '0.0000' });
    r++;
  }

  // TP — somatório (fórmula do Excel, com o valor já calculado)
  ws.mergeCells(r, 2, r, 4);
  ws.getCell(r, 1).value = 'TP';
  ws.getCell(r, 2).value = 'Tempo total da operação';
  ws.getCell(r, 5).value = { formula: `SUM(E8:E${r - 1})`, result: po.tp };
  [1, 2, 3, 4].forEach((c) => estilo(ws.getCell(r, c), { bold: true, fill: CINZA }));
  estilo(ws.getCell(r, 5), { bold: true, fill: CINZA, numFmt: '0.0000' });

  for (let i = 2; i <= r; i++) if (i !== 3) ws.getRow(i).height = 20;

  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  return wb.xlsx.writeBuffer();
}

module.exports = { gerarExcelPO };
