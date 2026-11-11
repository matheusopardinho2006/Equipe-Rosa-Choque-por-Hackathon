import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { posApi, erroMsg } from '../services/api';
import { min4 } from '../utils/format';

// Análise de POs: lista filtrável com seleção. Todos os indicadores e gráficos
// são calculados SOMENTE sobre as POs selecionadas (filtradas e marcadas).

const COR_FIXO = '#686562';   // costura de máquina
const COR_MANUAL = '#D9C8BF'; // manual (MTM)

const pct = (v) => `${(Math.round(v * 10) / 10).toLocaleString('pt-BR')}%`;
const capacidade = (tp) => (tp > 0 ? Math.floor(60 / tp) : 0);
const manualDe = (p) => Math.max(0, (Number(p.tp) || 0) - (Number(p.tempoFixo) || 0));
const unicos = (lista, fn) => [...new Set(lista.map(fn).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));

const FILTROS_VAZIOS = { familia: '', tamanho: '', maquina: '', operacao: '', busca: '' };

function Filtro({ label, value, onChange, opcoes }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[#686562] min-w-[150px] flex-1">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-[#C8C6C1] rounded-xl px-3 py-2 text-sm text-[#222222] focus:outline-none focus:border-[#686562]"
      >
        <option value="">Todas</option>
        {opcoes.map((o) => <option key={o.valor ?? o} value={o.valor ?? o}>{o.rotulo ?? o}</option>)}
      </select>
    </label>
  );
}

function Indicador({ titulo, valor, detalhe }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col justify-between min-h-[104px]">
      <span className="text-xs text-[#686562]">{titulo}</span>
      <span className="text-2xl font-medium text-[#222222] mt-1 tabular-nums">{valor}</span>
      {detalhe && <span className="text-[11px] text-[#9E9B97] mt-1">{detalhe}</span>}
    </div>
  );
}

export default function AnalisePOs() {
  const nav = useNavigate();
  const [pos, setPos] = useState([]);
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [desmarcadas, setDesmarcadas] = useState(() => new Set()); // ids desmarcados manualmente

  useEffect(() => {
    posApi.listar().then(setPos).catch((e) => setErro(erroMsg(e)));
  }, []);

  const setFiltro = (k) => (v) => setFiltros((f) => ({ ...f, [k]: v }));

  // Opções dos filtros a partir das POs existentes
  const opcoes = useMemo(() => ({
    familia: unicos(pos, (p) => p.familia),
    tamanho: unicos(pos, (p) => p.tamanho),
    operacao: unicos(pos, (p) => p.operacao),
    maquina: unicos(pos, (p) => p.maquina?.codigo && `${p.maquina.codigo}|${p.maquina.descricao}`)
      .map((m) => { const [valor, desc] = m.split('|'); return { valor, rotulo: `${valor} · ${desc}` }; }),
  }), [pos]);

  const filtradas = useMemo(() => {
    const t = filtros.busca.trim().toLowerCase();
    return pos.filter((p) =>
      (!filtros.familia || p.familia === filtros.familia) &&
      (!filtros.tamanho || p.tamanho === filtros.tamanho) &&
      (!filtros.operacao || p.operacao === filtros.operacao) &&
      (!filtros.maquina || String(p.maquina?.codigo) === filtros.maquina) &&
      (!t || [p.codigoPO, p.operacao, p.familia, p.tamanho].some((v) => String(v || '').toLowerCase().includes(t)))
    );
  }, [pos, filtros]);

  const selecionadas = useMemo(() => filtradas.filter((p) => !desmarcadas.has(p._id)), [filtradas, desmarcadas]);
  const todasMarcadas = filtradas.length > 0 && selecionadas.length === filtradas.length;

  function alternar(id) {
    setDesmarcadas((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function alternarTodas() {
    setDesmarcadas((s) => {
      const n = new Set(s);
      filtradas.forEach((p) => (todasMarcadas ? n.add(p._id) : n.delete(p._id)));
      return n;
    });
  }

  // ---------- Indicadores das POs selecionadas ----------
  const analise = useMemo(() => {
    if (!selecionadas.length) return null;
    const somaTp = selecionadas.reduce((s, p) => s + (Number(p.tp) || 0), 0);
    const somaFixo = selecionadas.reduce((s, p) => s + (Number(p.tempoFixo) || 0), 0);
    const tps = selecionadas.map((p) => Number(p.tp) || 0);
    const caps = tps.map(capacidade);

    // Tempo manual por elemento MTM (soma nas POs selecionadas)
    const porElemento = new Map();
    selecionadas.forEach((p) => (p.itens || []).forEach((i) => {
      const atual = porElemento.get(i.codigo) || { codigo: i.codigo, descricao: i.descricao, tempo: 0, pos: 0 };
      atual.tempo += Number(i.tempo) || 0;
      atual.pos += 1;
      porElemento.set(i.codigo, atual);
    }));
    const totalManual = somaTp - somaFixo;
    const elementos = [...porElemento.values()]
      .filter((e) => e.tempo > 0)
      .sort((a, b) => b.tempo - a.tempo)
      .map((e) => ({ ...e, pct: totalManual > 0 ? (e.tempo / totalManual) * 100 : 0 }));

    // Por máquina
    const porMaquina = new Map();
    selecionadas.forEach((p) => {
      const k = `${p.maquina?.codigo} · ${p.maquina?.descricao}`;
      const a = porMaquina.get(k) || { maquina: k, qtd: 0, tp: 0, fixo: 0 };
      a.qtd += 1; a.tp += Number(p.tp) || 0; a.fixo += Number(p.tempoFixo) || 0;
      porMaquina.set(k, a);
    });

    return {
      qtd: selecionadas.length,
      pctFixo: somaTp > 0 ? (somaFixo / somaTp) * 100 : 0,
      tpMin: Math.min(...tps), tpMax: Math.max(...tps),
      capMin: Math.min(...caps), capMax: Math.max(...caps),
      elementos,
      maquinas: [...porMaquina.values()].sort((a, b) => b.qtd - a.qtd),
      maiorTp: Math.max(...tps),
    };
  }, [selecionadas]);

  const faixa = (a, b, fmt = (x) => x) => (a === b ? fmt(a) : `${fmt(a)} a ${fmt(b)}`);
  const filtrosAtivos = Object.values(filtros).some(Boolean);

  return (
    <div className="bg-[#F2F1EE] rounded-[28px] p-6 space-y-5">
      <div>
        <h1 className="text-3xl font-normal text-[#686562]">Análise de POs</h1>
        <p className="text-sm text-[#686562] mt-1">
          Filtre e selecione as POs. Os indicadores abaixo consideram apenas as POs selecionadas.
        </p>
      </div>

      {erro && <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">{erro}</div>}

      {/* Filtros */}
      <section className="bg-white rounded-3xl p-5">
        <div className="flex flex-wrap items-end gap-3">
          <Filtro label="Agrupamento família" value={filtros.familia} onChange={setFiltro('familia')} opcoes={opcoes.familia} />
          <Filtro label="Tamanho" value={filtros.tamanho} onChange={setFiltro('tamanho')} opcoes={opcoes.tamanho} />
          <Filtro label="Máquina" value={filtros.maquina} onChange={setFiltro('maquina')} opcoes={opcoes.maquina} />
          <Filtro label="Operação" value={filtros.operacao} onChange={setFiltro('operacao')} opcoes={opcoes.operacao} />
          <label className="flex flex-col gap-1 text-xs text-[#686562] min-w-[180px] flex-1">
            Busca
            <input
              value={filtros.busca}
              onChange={(e) => setFiltro('busca')(e.target.value)}
              placeholder="Código da PO, operação..."
              className="bg-white border border-[#C8C6C1] rounded-xl px-3 py-2 text-sm text-[#222222] focus:outline-none focus:border-[#686562]"
            />
          </label>
          {filtrosAtivos && (
            <button
              type="button"
              onClick={() => setFiltros(FILTROS_VAZIOS)}
              className="bg-[#F2F1EE] hover:bg-[#E5E3DD] text-[#55524F] text-xs rounded-full px-4 py-2.5"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      {/* Indicadores */}
      {analise ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Indicador titulo="POs selecionadas" valor={analise.qtd} detalhe={`de ${pos.length} cadastradas`} />
            <Indicador titulo="Costura de máquina (FIXO)" valor={pct(analise.pctFixo)} detalhe="do tempo total das POs selecionadas" />
            <Indicador titulo="Manual (MTM)" valor={pct(100 - analise.pctFixo)} detalhe="do tempo total das POs selecionadas" />
            <Indicador
              titulo="Capacidade teórica"
              valor={`${faixa(analise.capMin, analise.capMax)} peças/h`}
              detalhe={`TP de ${faixa(analise.tpMin, analise.tpMax, min4)} min · 100% de eficiência`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Composição do TP por PO */}
            <section className="lg:col-span-7 bg-white rounded-3xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-sm font-medium text-[#222222]">Composição do tempo por PO</h2>
                <div className="flex items-center gap-4 text-[11px] text-[#686562]">
                  <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: COR_FIXO }} />Costura (FIXO)</span>
                  <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: COR_MANUAL }} />Manual (MTM)</span>
                </div>
              </div>
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {[...selecionadas].sort((a, b) => b.tp - a.tp).map((p) => {
                  const larg = (v) => `${(v / analise.maiorTp) * 100}%`;
                  return (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => nav(`/pos/${p._id}`)}
                      className="w-full grid grid-cols-[110px_1fr_90px] items-center gap-3 text-xs text-left hover:bg-[#FAF9F7] rounded-lg px-1 py-0.5"
                      title={`FIXO ${min4(p.tempoFixo)} + manual ${min4(manualDe(p))} = ${min4(p.tp)} min`}
                    >
                      <span className="text-[#222222] truncate">{p.codigoPO}</span>
                      <span className="flex h-4 rounded-sm overflow-hidden bg-[#F2F1EE]">
                        <span style={{ width: larg(p.tempoFixo), background: COR_FIXO }} />
                        <span style={{ width: larg(manualDe(p)), background: COR_MANUAL }} />
                      </span>
                      <span className="text-right tabular-nums text-[#686562]">{min4(p.tp)} min</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Por máquina */}
            <section className="lg:col-span-5 bg-white rounded-3xl p-5">
              <h2 className="text-sm font-medium text-[#222222] mb-4">Por máquina</h2>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#686562] border-b border-[#F2F1EE]">
                    <th className="py-2 text-left font-normal">Máquina</th>
                    <th className="py-2 text-right font-normal">POs</th>
                    <th className="py-2 text-right font-normal">% costura</th>
                    <th className="py-2 text-right font-normal">Capacidade</th>
                  </tr>
                </thead>
                <tbody>
                  {analise.maquinas.map((m) => {
                    const doGrupo = selecionadas.filter((p) => `${p.maquina?.codigo} · ${p.maquina?.descricao}` === m.maquina).map((p) => capacidade(p.tp));
                    return (
                      <tr key={m.maquina} className="border-b border-[#F2F1EE] text-[#222222]">
                        <td className="py-2">{m.maquina}</td>
                        <td className="py-2 text-right tabular-nums">{m.qtd}</td>
                        <td className="py-2 text-right tabular-nums">{pct(m.tp > 0 ? (m.fixo / m.tp) * 100 : 0)}</td>
                        <td className="py-2 text-right tabular-nums whitespace-nowrap">{faixa(Math.min(...doGrupo), Math.max(...doGrupo))} p/h</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </div>

          {/* Elementos MTM que mais consomem tempo manual */}
          <section className="bg-white rounded-3xl p-5">
            <h2 className="text-sm font-medium text-[#222222]">Tempo manual por elemento MTM</h2>
            <p className="text-[11px] text-[#9E9B97] mb-4">Soma do tempo de cada elemento nas POs selecionadas, do maior para o menor</p>
            {analise.elementos.length ? (
              <div className="space-y-2">
                {analise.elementos.map((e) => (
                  <div key={e.codigo} className="grid grid-cols-[minmax(0,260px)_1fr_120px] items-center gap-3 text-xs">
                    <span className="truncate text-[#222222]" title={e.descricao}><b className="font-medium">{e.codigo}</b> · {e.descricao}</span>
                    <span className="h-3.5 bg-[#F2F1EE] rounded-sm overflow-hidden">
                      <span className="block h-full" style={{ width: `${(e.tempo / analise.elementos[0].tempo) * 100}%`, background: COR_MANUAL }} />
                    </span>
                    <span className="text-right tabular-nums text-[#686562]">{min4(e.tempo)} · {pct(e.pct)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9E9B97]">As POs selecionadas não têm tempo manual.</p>
            )}
          </section>
        </>
      ) : (
        <div className="bg-white rounded-3xl p-8 text-center text-sm text-[#9E9B97]">
          {pos.length ? 'Nenhuma PO selecionada. Ajuste os filtros ou marque POs na lista abaixo.' : 'Nenhuma PO gerada ainda.'}
        </div>
      )}

      {/* Lista de POs */}
      <section className="bg-white rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-medium text-[#222222]">Lista de POs</h2>
          <span className="text-xs text-[#686562]">{selecionadas.length} de {filtradas.length} selecionadas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[880px]">
            <thead>
              <tr className="bg-[#F2F1EE] text-[#686562]">
                <th className="py-2.5 px-3 rounded-tl-2xl w-10">
                  <input type="checkbox" checked={todasMarcadas} onChange={alternarTodas} aria-label="Selecionar todas" className="accent-[#686562] w-4 h-4" />
                </th>
                <th className="py-2.5 px-3 text-left font-normal">PO</th>
                <th className="py-2.5 px-3 text-left font-normal">Família · Tamanho</th>
                <th className="py-2.5 px-3 text-left font-normal">Operação</th>
                <th className="py-2.5 px-3 text-left font-normal">Máquina</th>
                <th className="py-2.5 px-3 text-right font-normal">FIXO</th>
                <th className="py-2.5 px-3 text-right font-normal">Manual</th>
                <th className="py-2.5 px-3 text-right font-normal">TP (min)</th>
                <th className="py-2.5 px-3 text-right font-normal">% costura</th>
                <th className="py-2.5 px-3 text-right font-normal rounded-tr-2xl">Peças/h</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((p) => {
                const marcada = !desmarcadas.has(p._id);
                return (
                  <tr key={p._id} className={`border-b border-[#F2F1EE] ${marcada ? 'text-[#222222]' : 'text-[#B5B2AD]'}`}>
                    <td className="py-2 px-3 text-center">
                      <input type="checkbox" checked={marcada} onChange={() => alternar(p._id)} aria-label={`Selecionar ${p.codigoPO}`} className="accent-[#686562] w-4 h-4" />
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <button type="button" onClick={() => nav(`/pos/${p._id}`)} className="font-medium underline-offset-2 hover:underline">{p.codigoPO}</button>
                    </td>
                    <td className="py-2 px-3">{p.familia} · {p.tamanho}</td>
                    <td className="py-2 px-3">{p.operacao}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{p.maquina?.codigo} · {p.maquina?.descricao}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{min4(p.tempoFixo)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{min4(manualDe(p))}</td>
                    <td className="py-2 px-3 text-right tabular-nums font-medium">{min4(p.tp)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{pct(p.tp > 0 ? (p.tempoFixo / p.tp) * 100 : 0)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{capacidade(p.tp)}</td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-[#9E9B97]">Nenhuma PO para esses filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
