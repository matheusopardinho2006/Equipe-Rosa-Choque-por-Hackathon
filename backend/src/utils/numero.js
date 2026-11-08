// Arredonda para 4 casas (padrão da ficha PO) evitando erro de ponto flutuante.
const r4 = (n) => Math.round((n + Number.EPSILON) * 10000) / 10000;

module.exports = { r4 };
