// Dados do kit do hackathon.
// ATENÇÃO: tempoPorMetro da máquina 1 foi DEDUZIDO do gabarito (0,6709 / 6,96 m ≈ 0,0964).
// Máquinas 2 e 3 são FICTÍCIAS — substituir quando a organização enviar a aba TEMPO-CM.
module.exports = {
  maquinas: [
    { codigo: 1, descricao: 'Interlock', rpmPadrao: 5000, rpmMin: 4500, rpmMax: 5500, tempoPorMetro: 0.0964 },
    { codigo: 2, descricao: 'Reta (fictícia)', rpmPadrao: 4000, tempoPorMetro: 0.085 },
    { codigo: 3, descricao: 'Overloque (fictícia)', rpmPadrao: 6000, tempoPorMetro: 0.078 },
  ],
  elementos: [
    { codigo: '1.1', descricao: 'Costurar Elemento (sem tempo)', tempo: 0 },
    { codigo: '2.1', descricao: 'Apanhar peça e posicionar na mesa', tempo: 0.15 },
    { codigo: '2.2', descricao: 'Apanhar, posicionar e costurar etiqueta', tempo: 0.2 },
    { codigo: '2.3', descricao: 'Apanhar a outra extremidade da peça', tempo: 0.3 },
    { codigo: '3.1', descricao: 'Ajeitar peça', tempo: 0.12 },
    { codigo: '4.1', descricao: 'Dobrar duas vezes para fazer o início da bainha', tempo: 0.4 },
    { codigo: '5.1', descricao: 'Posicionar no calcador ajustando a peça no aparelho', tempo: 0.35 },
    { codigo: '5.2', descricao: 'Posicionar o elástico embutindo na bainha', tempo: 0.1 },
    { codigo: '6.1', descricao: 'Cortar para separar', tempo: 0.25 },
  ],
};
