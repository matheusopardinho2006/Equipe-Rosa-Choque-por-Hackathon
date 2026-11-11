import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { posApi, erroMsg } from '../services/api';
import { min4 } from '../utils/format';

import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

const COR_FIXO = '#736F6B';
const COR_MANUAL = '#D9C8BF';

const FILTROS_VAZIOS = {
  familia: '',
  tamanho: '',
  maquina: '',
  operacao: '',
  busca: '',
};

const pct = (v) =>
  `${(Math.round(v * 10) / 10).toLocaleString('pt-BR')}%`;

const capacidade = (tp) =>
  Number(tp) > 0 ? Math.floor(60 / Number(tp)) : 0;

const manualDe = (p) =>
  Math.max(
    0,
    (Number(p.tp) || 0) - (Number(p.tempoFixo) || 0)
  );

const unicos = (lista, fn) =>
  [...new Set(lista.map(fn).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), 'pt-BR')
  );

const faixa = (a, b, fmt = (x) => x) =>
  a === b ? fmt(a) : `${fmt(a)} a ${fmt(b)}`;

const inputClass =
  'w-full h-12 bg-white border border-[#C8C6C1] ' +
  'rounded-xl px-4 text-sm text-[#222222] ' +
  'focus:outline-none focus:border-[#736F6B] ' +
  'placeholder:text-[#9E9B97]';

// FILTRO REUTILIZÁVEL
function Filtro({ label, value, onChange, opcoes }) {
  return (
    <label className="flex flex-col gap-2 min-w-0">
      <span className="text-sm font-medium text-[#686562]">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} cursor-pointer`}
      >
        <option value="">Todas</option>

        {opcoes.map((o) => (
          <option
            key={o.valor ?? o}
            value={o.valor ?? o}
          >
            {o.rotulo ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

// CARD DE INDICADOR
function Indicador({ titulo, valor, detalhe, destaque }) {
  return (
    <div
      className={`rounded-[22px] p-6 min-h-[155px] flex flex-col justify-between ${
        destaque
          ? 'bg-[#736F6B] text-white'
          : 'bg-white text-[#222222]'
      }`}
    >
      <span
        className={`text-sm font-medium ${
          destaque
            ? 'text-[#F2F1EE]'
            : 'text-[#686562]'
        }`}
      >
        {titulo}
      </span>

      <div className="mt-4">
        <div className="text-[27px] lg:text-[30px] font-semibold leading-tight tabular-nums break-words">
          {valor}
        </div>

        {detalhe && (
          <p
            className={`text-sm mt-2 ${
              destaque
                ? 'text-[#F2F1EE]'
                : 'text-[#686562]'
            }`}
          >
            {detalhe}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AnalisePOs() {
  const nav = useNavigate();

  const [pos, setPos] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);

  const [desmarcadas, setDesmarcadas] = useState(
    () => new Set()
  );

  // CARREGAMENTO DAS POs
  useEffect(() => {
    let ativo = true;

    posApi
      .listar()
      .then((dados) => {
        if (ativo) {
          setPos(Array.isArray(dados) ? dados : []);
        }
      })
      .catch((e) => {
        if (ativo) setErro(erroMsg(e));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const setFiltro = (campo) => (valor) => {
    setFiltros((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  // OPÇÕES DOS FILTROS
  const opcoes = useMemo(
    () => ({
      familia: unicos(pos, (p) => p.familia),
      tamanho: unicos(pos, (p) => p.tamanho),
      operacao: unicos(pos, (p) => p.operacao),

      maquina: unicos(
        pos,
        (p) =>
          p.maquina?.codigo != null
            ? `${p.maquina.codigo}|${p.maquina.descricao ?? ''}`
            : ''
      ).map((m) => {
        const [valor, descricao] = m.split('|');

        return {
          valor,
          rotulo: `${valor} · ${descricao}`,
        };
      }),
    }),
    [pos]
  );

  // FILTRAGEM
  const filtradas = useMemo(() => {
    const termo = filtros.busca.trim().toLowerCase();

    return pos.filter(
      (p) =>
        (!filtros.familia ||
          p.familia === filtros.familia) &&
        (!filtros.tamanho ||
          p.tamanho === filtros.tamanho) &&
        (!filtros.operacao ||
          p.operacao === filtros.operacao) &&
        (!filtros.maquina ||
          String(p.maquina?.codigo) === filtros.maquina) &&
        (!termo ||
          [
            p.codigoPO,
            p.operacao,
            p.familia,
            p.tamanho,
            p.maquina?.descricao,
          ].some((v) =>
            String(v ?? '').toLowerCase().includes(termo)
          ))
    );
  }, [pos, filtros]);

  // POs SELECIONADAS
  const selecionadas = useMemo(
    () =>
      filtradas.filter((p) => !desmarcadas.has(p._id)),
    [filtradas, desmarcadas]
  );

  const todasMarcadas =
    filtradas.length > 0 &&
    selecionadas.length === filtradas.length;

  function alternar(id) {
    setDesmarcadas((anterior) => {
      const novo = new Set(anterior);

      if (novo.has(id)) {
        novo.delete(id);
      } else {
        novo.add(id);
      }

      return novo;
    });
  }

  function alternarTodas() {
    setDesmarcadas((anterior) => {
      const novo = new Set(anterior);

      filtradas.forEach((p) => {
        if (todasMarcadas) {
          novo.add(p._id);
        } else {
          novo.delete(p._id);
        }
      });

      return novo;
    });
  }

  // CÁLCULOS DA ANÁLISE
  const analise = useMemo(() => {
    if (!selecionadas.length) return null;

    const quantidade = selecionadas.length;

    const somaTp = selecionadas.reduce(
      (s, p) => s + (Number(p.tp) || 0),
      0
    );

    const somaFixo = selecionadas.reduce(
      (s, p) => s + (Number(p.tempoFixo) || 0),
      0
    );

    const somaManual = selecionadas.reduce(
      (s, p) => s + manualDe(p),
      0
    );

    const tps = selecionadas.map(
      (p) => Number(p.tp) || 0
    );

    const caps = tps.map(capacidade);

    const pctFixo =
      somaTp > 0 ? (somaFixo / somaTp) * 100 : 0;

    // AGRUPAMENTO POR MÁQUINA
    const porMaquina = new Map();

    selecionadas.forEach((p) => {
      const codigo = p.maquina?.codigo ?? '-';
      const descricao = p.maquina?.descricao ?? 'Não informada';
      const chave = `${codigo} · ${descricao}`;

      const atual = porMaquina.get(chave) || {
        maquina: chave,
        qtd: 0,
        tp: 0,
        fixo: 0,
        capacidades: [],
      };

      atual.qtd += 1;
      atual.tp += Number(p.tp) || 0;
      atual.fixo += Number(p.tempoFixo) || 0;
      atual.capacidades.push(capacidade(p.tp));

      porMaquina.set(chave, atual);
    });

    // AGRUPAMENTO POR ELEMENTO MTM
    const porElemento = new Map();

    selecionadas.forEach((p) => {
      (p.itens || []).forEach((i) => {
        const atual = porElemento.get(i.codigo) || {
          codigo: i.codigo,
          descricao: i.descricao,
          tempo: 0,
          ocorrencias: 0,
        };

        atual.tempo += Number(i.tempo) || 0;
        atual.ocorrencias += 1;

        porElemento.set(i.codigo, atual);
      });
    });

    const elementos = [...porElemento.values()]
      .filter((e) => e.tempo > 0)
      .sort((a, b) => b.tempo - a.tempo)
      .map((e) => ({
        ...e,
        percentual:
          somaManual > 0
            ? (e.tempo / somaManual) * 100
            : 0,
      }));

    return {
      quantidade,
      tempoMedio: somaTp / quantidade,
      pctFixo,

      pctManual:
        somaTp > 0
          ? (somaManual / somaTp) * 100
          : 0,

      capacidadeMedia:
        caps.reduce((s, c) => s + c, 0) / quantidade,

      capMin: Math.min(...caps),
      capMax: Math.max(...caps),

      tpMin: Math.min(...tps),
      tpMax: Math.max(...tps),
      maiorTp: Math.max(...tps),

      maquinas: [...porMaquina.values()].sort(
        (a, b) => b.qtd - a.qtd
      ),

      elementos,
    };
  }, [selecionadas]);

  const filtrosAtivos = Object.values(filtros).some(Boolean);

  return (
    <div className="w-full min-h-[760px] bg-[#F2F1EE] rounded-[28px] p-6 lg:p-10 space-y-8">

      {/* CABEÇALHO PADRONIZADO */}
      <PageHeader
        titulo="Análise de Procedimentos"
        subtitulo="Acompanhe os tempos, compare máquinas e visualize o desempenho das POs."
      />

      {/* ERRO */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
          {erro}
        </div>
      )}

      {/* FILTROS */}
      <section className="bg-white rounded-[26px] p-5 lg:p-7">

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-[23px] font-normal text-[#686562]">
              Filtros de análise
            </h2>

            <p className="text-sm text-[#686562] mt-2">
              Refine os resultados por produto, máquina ou operação.
            </p>
          </div>

          {filtrosAtivos && (
            <Button
              variante="neutro"
              tamanho="medio"
              onClick={() => setFiltros({ ...FILTROS_VAZIOS })}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">

          <Filtro
            label="Agrupamento família"
            value={filtros.familia}
            onChange={setFiltro('familia')}
            opcoes={opcoes.familia}
          />

          <Filtro
            label="Tamanho"
            value={filtros.tamanho}
            onChange={setFiltro('tamanho')}
            opcoes={opcoes.tamanho}
          />

          <Filtro
            label="Máquina"
            value={filtros.maquina}
            onChange={setFiltro('maquina')}
            opcoes={opcoes.maquina}
          />

          <Filtro
            label="Operação"
            value={filtros.operacao}
            onChange={setFiltro('operacao')}
            opcoes={opcoes.operacao}
          />

          <label className="flex flex-col gap-2 min-w-0">
            <span className="text-sm font-medium text-[#686562]">
              Buscar PO
            </span>

            <input
              value={filtros.busca}
              onChange={(e) =>
                setFiltro('busca')(e.target.value)
              }
              placeholder="Código, operação..."
              className={inputClass}
            />
          </label>
        </div>
      </section>

      {/* CONTEÚDO DA ANÁLISE */}
      {carregando ? (
        <div className="bg-white rounded-[26px] p-10 text-center text-[#686562] text-sm">
          Carregando análise...
        </div>
      ) : analise ? (
        <>

          {/* INDICADORES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

            <Indicador
              titulo="Tempo médio"
              valor={`${min4(analise.tempoMedio)} min`}
              detalhe={`${analise.quantidade} PO(s) selecionada(s)`}
              destaque
            />

            <Indicador
              titulo="Costura de máquina"
              valor={pct(analise.pctFixo)}
              detalhe="Percentual do tempo total (FIXO)"
            />

            <Indicador
              titulo="Manual (MTM)"
              valor={pct(analise.pctManual)}
              detalhe="Percentual do tempo total"
            />

            <Indicador
              titulo="Capacidade teórica"
              valor={`${Math.round(analise.capacidadeMedia)} peças/h`}
              detalhe={`${faixa(
                analise.capMin,
                analise.capMax
              )} peças/h · 100% de eficiência`}
            />

          </div>

          {/* GRÁFICOS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {/* DISTRIBUIÇÃO POR PO */}
            <section className="bg-white rounded-[26px] p-5 lg:p-7 min-w-0">

              <h2 className="text-[23px] font-normal text-[#686562]">
                Distribuição de tempo por PO
              </h2>

              <p className="text-sm text-[#686562] mt-2">
                Comparação entre costura de máquina e tempo manual.
              </p>

              {/* LEGENDA */}
              <div className="flex flex-wrap items-center gap-5 mt-5 mb-7">

                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-[#736F6B]" />
                  <span className="text-xs text-[#686562]">
                    Costura (FIXO)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-[#D9C8BF]" />
                  <span className="text-xs text-[#686562]">
                    Manual (MTM)
                  </span>
                </div>

              </div>

              <div className="space-y-5 max-h-[370px] overflow-y-auto pr-2">

                {[...selecionadas]
                  .sort(
                    (a, b) =>
                      (Number(b.tp) || 0) -
                      (Number(a.tp) || 0)
                  )
                  .map((p) => {
                    const total = Number(p.tp) || 0;
                    const fixo = Number(p.tempoFixo) || 0;
                    const manual = manualDe(p);
                    const maximo = analise.maiorTp;

                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => nav(`/pos/${p._id}`)}
                        className="w-full text-left group cursor-pointer"
                        title={`Abrir ${p.codigoPO}`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">

                          <span className="text-sm font-medium text-[#222222] group-hover:underline truncate">
                            {p.codigoPO}
                          </span>

                          <span className="text-xs text-[#686562] tabular-nums shrink-0">
                            {min4(total)} min
                          </span>

                        </div>

                        <div className="flex w-full h-7 rounded-lg bg-[#F2F1EE] overflow-hidden">

                          <div
                            style={{
                              width:
                                maximo > 0
                                  ? `${(fixo / maximo) * 100}%`
                                  : '0%',
                              background: COR_FIXO,
                            }}
                            title={`FIXO: ${min4(fixo)} min`}
                          />

                          <div
                            style={{
                              width:
                                maximo > 0
                                  ? `${(manual / maximo) * 100}%`
                                  : '0%',
                              background: COR_MANUAL,
                            }}
                            title={`Manual: ${min4(manual)} min`}
                          />

                        </div>
                      </button>
                    );
                  })}

              </div>

              <p className="text-xs text-[#9E9B97] mt-6">
                As barras usam a mesma escala. Clique em uma PO
                para visualizar sua ficha completa.
              </p>

            </section>

            {/* COMPARAÇÃO ENTRE MÁQUINAS */}
            <section className="bg-white rounded-[26px] p-5 lg:p-7 min-w-0">

              <h2 className="text-[23px] font-normal text-[#686562]">
                Comparação entre máquinas
              </h2>

              <p className="text-sm text-[#686562] mt-2">
                Tempo médio de operação por máquina.
              </p>

              <div className="space-y-6 mt-8 max-h-[370px] overflow-y-auto pr-2">

                {analise.maquinas.map((m) => {
                  const media = m.qtd > 0 ? m.tp / m.qtd : 0;

                  const maiorMedia = Math.max(
                    ...analise.maquinas.map(
                      (x) => (x.qtd > 0 ? x.tp / x.qtd : 0)
                    ),
                    0
                  );

                  const largura =
                    maiorMedia > 0
                      ? (media / maiorMedia) * 100
                      : 0;

                  return (
                    <div key={m.maquina}>

                      <div className="flex items-center justify-between gap-3 mb-2">

                        <span className="text-sm font-medium text-[#222222] truncate">
                          {m.maquina}
                        </span>

                        <span className="text-xs text-[#686562] shrink-0">
                          {m.qtd} PO(s)
                        </span>

                      </div>

                      <div className="flex items-center gap-3">

                        <div className="flex-1 h-7 rounded-lg bg-[#F2F1EE] overflow-hidden">
                          <div
                            className="h-full bg-[#736F6B] rounded-lg"
                            style={{
                              width: `${largura}%`,
                            }}
                          />
                        </div>

                        <span className="text-xs text-[#686562] tabular-nums w-[85px] text-right">
                          {min4(media)} min
                        </span>

                      </div>

                      <p className="text-xs text-[#9E9B97] mt-2">
                        {pct(
                          m.tp > 0
                            ? (m.fixo / m.tp) * 100
                            : 0
                        )} de costura · Capacidade{' '}
                        {faixa(
                          Math.min(...m.capacidades),
                          Math.max(...m.capacidades)
                        )} peças/h
                      </p>

                    </div>
                  );
                })}

              </div>
            </section>
          </div>

          {/* TEMPO MANUAL POR ELEMENTO */}
          <section className="bg-white rounded-[26px] p-5 lg:p-7">

            <div className="mb-7">
              <h2 className="text-[23px] font-normal text-[#686562]">
                Tempo manual por elemento MTM
              </h2>

              <p className="text-sm text-[#686562] mt-2">
                Elementos que mais consomem tempo nas POs
                selecionadas, ordenados do maior para o menor.
              </p>
            </div>

            {analise.elementos.length > 0 ? (
              <div className="space-y-5 max-h-[420px] overflow-y-auto pr-2">

                {analise.elementos.map((e) => {
                  const maior = analise.elementos[0].tempo;

                  return (
                    <div
                      key={e.codigo}
                      className="grid grid-cols-1 md:grid-cols-[minmax(0,250px)_1fr_150px] items-center gap-3"
                    >
                      <div
                        className="text-sm text-[#222222] truncate"
                        title={e.descricao}
                      >
                        <span className="font-semibold">
                          {e.codigo}
                        </span>
                        {' · '}
                        {e.descricao}
                      </div>

                      <div className="h-6 bg-[#F2F1EE] rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-[#D9C8BF] rounded-lg"
                          style={{
                            width:
                              maior > 0
                                ? `${(e.tempo / maior) * 100}%`
                                : '0%',
                          }}
                        />
                      </div>

                      <span className="text-sm text-[#686562] tabular-nums md:text-right">
                        {min4(e.tempo)} min · {pct(e.percentual)}
                      </span>

                    </div>
                  );
                })}

              </div>
            ) : (
              <p className="text-sm text-[#686562]">
                As POs selecionadas não possuem tempo manual.
              </p>
            )}

          </section>
        </>
      ) : (
        <div className="bg-white rounded-[26px] p-10 text-center text-sm text-[#686562]">
          {pos.length
            ? 'Nenhuma PO selecionada. Ajuste os filtros ou marque POs no histórico abaixo.'
            : 'Nenhuma PO gerada ainda.'}
        </div>
      )}

      {/* HISTÓRICO DE POs */}
      <section className="bg-white rounded-[26px] p-5 lg:p-7">

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">

          <div>
            <h2 className="text-[23px] font-normal text-[#686562]">
              Histórico de POs
            </h2>

            <p className="text-sm text-[#686562] mt-2">
              Selecione as POs que deseja incluir na análise.
            </p>
          </div>

          <span className="text-sm text-[#686562]">
            {selecionadas.length} de {filtradas.length} selecionadas
          </span>

        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E6E4DF]">

          <table className="w-full min-w-[1120px] border-collapse text-sm">

            <thead>
              <tr className="bg-[#F2F1EE] text-[#686562]">

                <th className="py-5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={todasMarcadas}
                    onChange={alternarTodas}
                    aria-label="Selecionar todas as POs filtradas"
                    className="w-4 h-4 accent-[#736F6B] cursor-pointer"
                  />
                </th>

                <th className="py-5 px-4 text-left font-semibold">
                  PO
                </th>

                <th className="py-5 px-4 text-left font-semibold">
                  Família · Tamanho
                </th>

                <th className="py-5 px-4 text-left font-semibold">
                  Operação
                </th>

                <th className="py-5 px-4 text-left font-semibold">
                  Máquina
                </th>

                <th className="py-5 px-4 text-right font-semibold">
                  FIXO
                </th>

                <th className="py-5 px-4 text-right font-semibold">
                  Manual
                </th>

                <th className="py-5 px-4 text-right font-semibold">
                  TP (min)
                </th>

                <th className="py-5 px-4 text-right font-semibold">
                  % Costura
                </th>

                <th className="py-5 px-4 text-right font-semibold">
                  Peças/h
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6E4DF]">

              {filtradas.map((p) => {
                const marcada = !desmarcadas.has(p._id);

                return (
                  <tr
                    key={p._id}
                    className={`hover:bg-[#FAF9F7] transition-colors ${
                      marcada
                        ? 'text-[#222222]'
                        : 'text-[#9E9B97]'
                    }`}
                  >
                    <td className="py-5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={marcada}
                        onChange={() => alternar(p._id)}
                        aria-label={`Selecionar ${p.codigoPO}`}
                        className="w-4 h-4 accent-[#736F6B] cursor-pointer"
                      />
                    </td>

                    <td className="py-5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => nav(`/pos/${p._id}`)}
                        className="font-semibold text-[#55524F] hover:underline cursor-pointer"
                      >
                        {p.codigoPO}
                      </button>
                    </td>

                    <td className="py-5 px-4">
                      {p.familia} · {p.tamanho}
                    </td>

                    <td className="py-5 px-4">
                      {p.operacao}
                    </td>

                    <td className="py-5 px-4 whitespace-nowrap">
                      {p.maquina?.codigo} · {p.maquina?.descricao}
                    </td>

                    <td className="py-5 px-4 text-right tabular-nums">
                      {min4(p.tempoFixo)}
                    </td>

                    <td className="py-5 px-4 text-right tabular-nums">
                      {min4(manualDe(p))}
                    </td>

                    <td className="py-5 px-4 text-right tabular-nums font-semibold">
                      {min4(p.tp)}
                    </td>

                    <td className="py-5 px-4 text-right tabular-nums">
                      {pct(
                        p.tp > 0
                          ? (p.tempoFixo / p.tp) * 100
                          : 0
                      )}
                    </td>

                    <td className="py-5 px-4 text-right tabular-nums">
                      {capacidade(p.tp)}
                    </td>

                  </tr>
                );
              })}

              {filtradas.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="py-16 text-center text-[#736F6B]"
                  >
                    Nenhuma PO encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}

            </tbody>
          </table>

        </div>
      </section>

    </div>
  );
}

