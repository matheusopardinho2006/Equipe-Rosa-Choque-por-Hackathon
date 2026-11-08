export const min4 = (n) => Number(n ?? 0).toFixed(4).replace('.', ',');
export const toNum = (v) => (typeof v === 'string' ? Number(v.replace(',', '.').trim()) : Number(v));
