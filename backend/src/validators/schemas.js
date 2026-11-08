const { z } = require('zod');
const { parseElementos } = require('../utils/elementos');

// Mensagens em português para campos ausentes
z.setErrorMap((issue, ctx) =>
  issue.code === 'invalid_type' && issue.received === 'undefined' ? { message: 'Campo obrigatório' } : { message: ctx.defaultError }
);

// Aceita número ou string com vírgula ("6,96")
const num = z.preprocess((v) => (typeof v === 'string' ? Number(v.replace(',', '.').trim()) : v), z.number({ invalid_type_error: 'Informe um número' }));
const texto = z.preprocess((v) => (v == null ? v : String(v)), z.string());

const maquinaSchema = z.object({
  codigo: num.pipe(z.number().int().positive()),
  descricao: z.string().min(1),
  rpmPadrao: num.pipe(z.number().positive()),
  rpmMin: num.optional(),
  rpmMax: num.optional(),
  tempoPorMetro: num.pipe(z.number().nonnegative()),
});

const elementoSchema = z.object({
  codigo: z.string().regex(/^\d+\.\d+$/, 'Use o formato agrupador.elemento, ex.: 2.1').optional(),
  agrupador: num.optional(),
  elemento: num.optional(),
  descricao: z.string().trim().min(1, 'Informe a descrição'),
  tempo: num.pipe(z.number().nonnegative('Tempo não pode ser negativo')),
});

const roteiro = z.preprocess(
  parseElementos,
  z
    .array(
      z.object({
        codigo: z.string().regex(/^\d+\.\d+$/, 'Código MTM inválido (use 2.1)'),
        frequencia: z.number().positive('Frequência deve ser > 0'),
      })
    )
    .min(1, 'Informe ao menos um elemento')
);

// ENTRADA DO USUÁRIO. Código da PO e revisão são gerados pelo sistema.
// Todos os dados do produto são obrigatórios.
const obrigatorio = (msg) => texto.pipe(z.string().trim().min(1, msg));

// "1,80 x 2,50" | "1.8x2.5" | "1,80 X 2,50" | "1,80 × 2,50"
const MEDIDAS = /^\d+([.,]\d+)?\s*[xX×]\s*\d+([.,]\d+)?$/;

const demandaSchema = z.object({
  familia: obrigatorio('Informe o agrupamento família'),
  tamanho: obrigatorio('Informe o tamanho'),
  medidas: obrigatorio('Informe as medidas da peça').pipe(z.string().regex(MEDIDAS, 'Use o formato largura x comprimento, ex.: 1,80 x 2,50')),
  pontosCm: num.pipe(z.number().positive('Pontos/cm deve ser > 0')),
  perimetroM: num.pipe(z.number().positive('Perímetro deve ser > 0')),
  operacao: obrigatorio('Informe a operação'),
  maquina: num.pipe(z.number().int('Código da máquina inválido')),
  elementos: roteiro,
});

module.exports = { maquinaSchema, elementoSchema, demandaSchema };
