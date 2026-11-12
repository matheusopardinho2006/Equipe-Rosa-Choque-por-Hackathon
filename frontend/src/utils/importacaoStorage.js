const CHAVE_STORAGE = 'karsten_importacao_pendente';

function normalizarDemanda(d = {}, item = {}) {
  return {
    familia: String(d.familia ?? item.familia ?? '').trim(),
    tamanho: String(d.tamanho ?? item.tamanho ?? '').trim(),
    medidas: String(d.medidas ?? item.medidas ?? '').trim(),
    pontosCm: d.pontosCm ?? item.pontosCm ?? '',
    perimetroM: d.perimetroM ?? item.perimetroM ?? '',
    operacao: String(d.operacao ?? item.operacao ?? '').trim(),
    maquina:
      d.maquina != null && d.maquina !== ''
        ? Number(d.maquina)
        : item.maquina?.codigo != null
        ? Number(item.maquina.codigo)
        : null,
    elementos: Array.isArray(d.elementos)
      ? d.elementos.map((el) => ({
          codigo: String(el.codigo ?? '').trim(),
          frequencia: Number(el.frequencia) || 1,
        }))
      : Array.isArray(item.itens)
      ? item.itens.map((i) => ({
          codigo: String(i.codigo ?? '').trim(),
          frequencia: Number(i.frequencia) || 1,
        }))
      : [],
  };
}

export function salvarLoteImportacao(resultado = [], nomeArquivo = '') {
  const agora = Date.now();
  const itens = (Array.isArray(resultado) ? resultado : []).map((r, idx) => {
    const demanda = normalizarDemanda(r.demanda, r);
    const ok = Boolean(r.ok);

    return {
      uid: `imp-${r.linha ?? idx + 1}-${agora}-${idx}`,
      linha: r.linha ?? idx + 1,
      ok,
      selecionado: ok,
      erro: r.erro || null,
      demanda,
      familia: r.familia ?? demanda.familia,
      tamanho: r.tamanho ?? demanda.tamanho,
      medidas: r.medidas ?? demanda.medidas,
      pontosCm: r.pontosCm ?? demanda.pontosCm,
      perimetroM: r.perimetroM ?? demanda.perimetroM,
      operacao: r.operacao ?? demanda.operacao,
      maquina: r.maquina ?? (demanda.maquina != null ? { codigo: demanda.maquina, descricao: '' } : null),
      tempoFixo: Number(r.tempoFixo) || 0,
      itens: Array.isArray(r.itens) ? r.itens : [],
      tp: Number(r.tp) || 0,
    };
  });

  const payload = { nomeArquivo, itens };
  sessionStorage.setItem(CHAVE_STORAGE, JSON.stringify(payload));
  return payload;
}

export function lerLoteImportacao() {
  try {
    const raw = sessionStorage.getItem(CHAVE_STORAGE);
    if (!raw) return { nomeArquivo: '', itens: [] };
    const parsed = JSON.parse(raw);
    return {
      nomeArquivo: parsed?.nomeArquivo || '',
      itens: Array.isArray(parsed?.itens) ? parsed.itens : [],
    };
  } catch {
    return { nomeArquivo: '', itens: [] };
  }
}

export function salvarEstadoImportacao(estado) {
  sessionStorage.setItem(
    CHAVE_STORAGE,
    JSON.stringify({
      nomeArquivo: estado?.nomeArquivo || '',
      itens: Array.isArray(estado?.itens) ? estado.itens : [],
    })
  );
}

export function buscarItemImportacao(uid) {
  const { itens } = lerLoteImportacao();
  return itens.find((item) => item.uid === uid) || null;
}

export function atualizarItemImportacao(uid, demanda, previaCalculada) {
  const atual = lerLoteImportacao();
  const demandaNormalizada = normalizarDemanda(demanda, previaCalculada);

  const novosItens = atual.itens.map((item) => {
    if (item.uid !== uid) return item;
    return {
      ...item,
      ok: true,
      selecionado: true,
      erro: null,
      demanda: demandaNormalizada,
      familia: previaCalculada.familia ?? demandaNormalizada.familia,
      tamanho: previaCalculada.tamanho ?? demandaNormalizada.tamanho,
      medidas: previaCalculada.medidas ?? demandaNormalizada.medidas,
      pontosCm: previaCalculada.pontosCm ?? demandaNormalizada.pontosCm,
      perimetroM: previaCalculada.perimetroM ?? demandaNormalizada.perimetroM,
      operacao: previaCalculada.operacao ?? demandaNormalizada.operacao,
      maquina: previaCalculada.maquina ?? item.maquina,
      tempoFixo: Number(previaCalculada.tempoFixo) || 0,
      itens: Array.isArray(previaCalculada.itens) ? previaCalculada.itens : [],
      tp: Number(previaCalculada.tp) || 0,
    };
  });

  salvarEstadoImportacao({ ...atual, itens: novosItens });
}

export function removerItemImportacao(uid) {
  const atual = lerLoteImportacao();
  const novosItens = atual.itens.filter((item) => item.uid !== uid);
  salvarEstadoImportacao({ ...atual, itens: novosItens });
  return novosItens;
}

export function limparLoteImportacao() {
  sessionStorage.removeItem(CHAVE_STORAGE);
}
