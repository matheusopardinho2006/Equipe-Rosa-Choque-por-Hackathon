// Identificação da PO a partir do Agrupamento família.
//   "Sobre-lençol" → sigla "SL"  →  código PO-SL-001, PO-SL-002, ...

const STOPWORDS = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS', 'E', 'COM', 'PARA']);
const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();

/** Sigla da família: iniciais das palavras; palavra única → 2 primeiras letras. */
function siglaFamilia(familia) {
  const palavras = norm(familia).split(/[\s\-_/]+/).filter((p) => p && !STOPWORDS.has(p));
  if (!palavras.length) return 'XX';
  if (palavras.length === 1) return palavras[0].replace(/[^A-Z0-9]/g, '').slice(0, 2).padEnd(2, 'X');
  return palavras.map((p) => p.replace(/[^A-Z0-9]/g, '')[0] || '').join('').slice(0, 4);
}

const formatarCodigo = (sigla, seq) => `PO-${sigla}-${String(seq).padStart(3, '0')}`;

module.exports = { siglaFamilia, formatarCodigo };
