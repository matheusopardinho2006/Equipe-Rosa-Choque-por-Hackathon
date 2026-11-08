// Normaliza o roteiro de operações para [{ codigo, frequencia }].
// Aceita: "2.1, 1.1, 3.1" | "2.1x2; 3.1" | ["2.1", "1.1"] | [{ codigo: "2.1", frequencia: 2 }] | [2.1, 1.1]
function parseItem(item) {
  if (item && typeof item === 'object') {
    return { codigo: String(item.codigo).replace(',', '.').trim(), frequencia: item.frequencia == null || item.frequencia === '' ? 1 : Number(String(item.frequencia).replace(',', '.')) };
  }
  const [codigo, freq] = String(item).split(/x|\*/i).map((p) => p.trim());
  return { codigo: codigo.replace(',', '.'), frequencia: freq ? Number(freq.replace(',', '.')) : 1 };
}

function parseElementos(valor) {
  if (valor == null || valor === '') return [];
  const lista = Array.isArray(valor) ? valor : String(valor).split(/[;|\n]|,(?=\s*\d+[.,]\d)|,\s+/);
  return lista.map((s) => (typeof s === 'string' ? s.trim() : s)).filter((s) => s !== '' && s != null).map(parseItem);
}

module.exports = { parseElementos };
