import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { posApi, erroMsg } from '../services/api';
import { min4 } from '../utils/format';
import {
  lerLoteImportacao,
  salvarEstadoImportacao,
  salvarLoteImportacao,
  removerItemImportacao,
  limparLoteImportacao,
} from '../utils/importacaoStorage';

import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

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

function formatarErroItem(erro) {
  if (!erro) return '';
  if (typeof erro === 'string') return erro;
  return Object.entries(erro)
    .map(
      ([campo, msgs]) =>
        `${campo}: ${
          Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
        }`
    )
    .join(' · ');
}

// FILTRO REUTILIZÁVEL (idêntico à tela de Análise)
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

// CARD DE INDICADOR (idêntico à tela de Análise)
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

export default function ConfirmarImportacao() {
  const nav = useNavigate();
  const fileInputRef = useRef(null);

  const [nomeArquivo, setNomeArquivo] = useState('');
  const [itens, setItens] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [erro, setErro] = useState('');
  const [importando, setImportando] = useState(false);
  const [cadastrando, setCadastrando] = useState(false);

  useEffect(() => {
    const lote = lerLoteImportacao();
    setNomeArquivo(lote.nomeArquivo || '');
    setItens(lote.itens || []);
  }, []);

  function atualizarItens(novosItens, novoNome = nomeArquivo) {
    setItens(novosItens);
    setNomeArquivo(novoNome);
    salvarEstadoImportacao({
      nomeArquivo: novoNome,
      itens: novosItens,
    });
  }

  const setFiltro = (campo) => (valor) => {
    setFiltros((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  // OPÇÕES DOS FILTROS
  const opcoes = useMemo(
    () => ({
      familia: unicos(itens, (p) => p.familia),
      tamanho: unicos(itens, (p) => p.tamanho),
      operacao: unicos(itens, (p) => p.operacao),
      maquina: unicos(
        itens,
        (p) =>
          p.maquina?.codigo != null
            ? `${p.maquina.codigo}|${p.maquina.descricao ?? ''}`
            : ''
      ).map((m) => {
        const [valor, descricao] = m.split('|');
        return {
          valor,
          rotulo: descricao ? `${valor} · ${descricao}` : `Código ${valor}`,
        };
      }),
    }),
    [itens]
  );

  // FILTRAGEM
  const filtradas = useMemo(() => {
    const termo = filtros.busca.trim().toLowerCase();

    return itens.filter(
      (p) =>
        (!filtros.familia || p.familia === filtros.familia) &&
        (!filtros.tamanho || p.tamanho === filtros.tamanho) &&
        (!filtros.operacao || p.operacao === filtros.operacao) &&
        (!filtros.maquina ||
          String(p.maquina?.codigo) === filtros.maquina) &&
        (!termo ||
          [
            `#${p.linha}`,
            p.operacao,
            p.familia,
            p.tamanho,
            p.medidas,
            p.maquina?.descricao,
            ...(p.demanda?.elementos || []).map((e) => e.codigo),
          ].some((v) =>
            String(v ?? '').toLowerCase().includes(termo)
          ))
    );
  }, [itens, filtros]);

  const validos = useMemo(
    () => itens.filter((p) => p.ok),
    [itens]
  );

  const invalidos = useMemo(
    () => itens.filter((p) => !p.ok),
    [itens]
  );

  const filtradasValidas = useMemo(
    () => filtradas.filter((p) => p.ok),
    [filtradas]
  );

  const selecionadasValidas = useMemo(
    () => itens.filter((p) => p.ok && p.selecionado),
    [itens]
  );

  const selecionadasFiltradas = useMemo(
    () => filtradas.filter((p) => p.ok && p.selecionado),
    [filtradas]
  );

  const todasFiltradasMarcadas =
    filtradasValidas.length > 0 &&
    selecionadasFiltradas.length === filtradasValidas.length;

  // AÇÕES DE SELEÇÃO VERSÁTIL
  function alternar(uid) {
    atualizarItens(
      itens.map((item) =>
        item.uid === uid && item.ok
          ? { ...item, selecionado: !item.selecionado }
          : item
      )
    );
  }

  function alternarTodasFiltradas() {
    const uidsFiltrados = new Set(filtradasValidas.map((p) => p.uid));
    const novoValor = !todasFiltradasMarcadas;

    atualizarItens(
      itens.map((item) =>
        uidsFiltrados.has(item.uid)
          ? { ...item, selecionado: novoValor }
          : item
      )
    );
  }

  function selecionarTodasGlobal(marcar) {
    atualizarItens(
      itens.map((item) =>
        item.ok ? { ...item, selecionado: marcar } : item
      )
    );
  }

  function selecionarApenasFiltradas() {
    const uidsFiltrados = new Set(filtradasValidas.map((p) => p.uid));
    atualizarItens(
      itens.map((item) =>
        item.ok
          ? { ...item, selecionado: uidsFiltrados.has(item.uid) }
          : item
      )
    );
  }

  function inverterSelecaoFiltradas() {
    const uidsFiltrados = new Set(filtradasValidas.map((p) => p.uid));
    atualizarItens(
      itens.map((item) =>
        uidsFiltrados.has(item.uid)
          ? { ...item, selecionado: !item.selecionado }
          : item
      )
    );
  }

  // EXCLUIR ITEM DA LISTA DE IMPORTAÇÃO
  function excluirItem(item) {
    const confirmado = window.confirm(
      `Remover o procedimento da linha #${item.linha} (${
        item.operacao || 'Sem operação'
      }) da lista de importação?`
    );

    if (!confirmado) return;

    const novos = removerItemImportacao(item.uid);
    setItens(novos);
  }

  // IMPORTAR NOVO ARQUIVO DIRETO NESTA TELA
  async function importarOutroArquivo(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setErro('');
    setImportando(true);

    try {
      const resultado = await posApi.importar(arquivo);
      const lote = salvarLoteImportacao(resultado, arquivo.name);
      setNomeArquivo(lote.nomeArquivo);
      setItens(lote.itens);
      setFiltros({ ...FILTROS_VAZIOS });
    } catch (err) {
      setErro(erroMsg(err));
    } finally {
      setImportando(false);
      e.target.value = '';
    }
  }

  // CONFIRMAR E CADASTRAR POs SELECIONADAS
  async function confirmarCadastro() {
    if (cadastrando || selecionadasValidas.length === 0) return;

    setCadastrando(true);
    setErro('');

    try {
      const demandas = selecionadasValidas.map((x) => x.demanda);
      const criadas = await posApi.criarLote(demandas);

      limparLoteImportacao();

      if (criadas.length === 1 && criadas[0]?._id) {
        nav(`/pos/${criadas[0]._id}`);
      } else {
        nav('/');
      }
    } catch (err) {
      setErro(erroMsg(err));
    } finally {
      setCadastrando(false);
    }
  }

  // RESUMO DAS POs SELECIONADAS
  const resumo = useMemo(() => {
    if (!selecionadasValidas.length) return null;

    const quantidade = selecionadasValidas.length;
    const somaTp = selecionadasValidas.reduce(
      (s, p) => s + (Number(p.tp) || 0),
      0
    );
    const somaFixo = selecionadasValidas.reduce(
      (s, p) => s + (Number(p.tempoFixo) || 0),
      0
    );
    const somaManual = selecionadasValidas.reduce(
      (s, p) => s + manualDe(p),
      0
    );
    const caps = selecionadasValidas.map((p) => capacidade(p.tp));

    return {
      quantidade,
      tempoMedio: somaTp / quantidade,
      pctFixo: somaTp > 0 ? (somaFixo / somaTp) * 100 : 0,
      pctManual: somaTp > 0 ? (somaManual / somaTp) * 100 : 0,
      capacidadeMedia:
        caps.reduce((s, c) => s + c, 0) / quantidade,
      capMin: Math.min(...caps),
      capMax: Math.max(...caps),
    };
  }, [selecionadasValidas]);

  const filtrosAtivos = Object.values(filtros).some(Boolean);

  return (
    <div className="w-full min-h-[760px] bg-[#F2F1EE] rounded-[28px] p-6 lg:p-10 space-y-8">

      {/* CABEÇALHO PADRONIZADO */}
      <div>
        <Link
          to="/nova-po"
          className="inline-flex items-center text-sm text-[#736F6B] hover:text-[#222222] transition-colors mb-5"
        >
          ← Voltar para Nova PO
        </Link>

        <PageHeader
          titulo="Confirmação de Importação"
          subtitulo={`Revise os procedimentos importados${
            nomeArquivo ? ` do arquivo "${nomeArquivo}"` : ''
          }, filtre e selecione quais devem ser cadastrados ou edite-os antes de confirmar.`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.xlsx,.xls,.csv,.txt"
            onChange={importarOutroArquivo}
            className="hidden"
          />

          <Button
            variante="secundario"
            tamanho="grande"
            disabled={importando || cadastrando}
            onClick={() => fileInputRef.current?.click()}
          >
            {importando ? 'Importando...' : 'Importar outro arquivo'}
          </Button>

          <Button
            variante="primario"
            tamanho="grande"
            onClick={confirmarCadastro}
            disabled={cadastrando || selecionadasValidas.length === 0}
          >
            {cadastrando
              ? 'Cadastrando...'
              : `Cadastrar ${selecionadasValidas.length} PO(s) selecionada(s)`}
          </Button>
        </PageHeader>
      </div>

      {/* ERRO */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
          {erro}
        </div>
      )}

      {itens.length === 0 ? (
        <section className="bg-white rounded-[26px] p-10 text-center space-y-5">
          <p className="text-sm text-[#686562]">
            Nenhum procedimento pendente de confirmação no momento.
          </p>

          <div className="flex justify-center gap-3">
            <Button
              variante="secundario"
              tamanho="grande"
              onClick={() => nav('/nova-po')}
            >
              ← Ir para Nova PO
            </Button>

            <Button
              variante="primario"
              tamanho="grande"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar arquivo para importar
            </Button>
          </div>
        </section>
      ) : (
        <>
          {/* FILTROS E SELEÇÃO VERSÁTIL */}
          <section className="bg-white rounded-[26px] p-5 lg:p-7">

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-[23px] font-normal text-[#686562]">
                  Filtros e seleção de procedimentos
                </h2>

                <p className="text-sm text-[#686562] mt-2">
                  Refine por produto, máquina ou operação e utilize os atalhos para selecionar quais procedimentos cadastrar.
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
                  Buscar procedimento
                </span>

                <input
                  value={filtros.busca}
                  onChange={(e) =>
                    setFiltro('busca')(e.target.value)
                  }
                  placeholder="Operação, família, elemento..."
                  className={inputClass}
                />
              </label>
            </div>

            {/* BARRA DE ATALHOS DE SELEÇÃO */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-6 border-t border-[#E6E4DF]">
              <span className="text-xs font-medium text-[#686562]">
                Modos rápidos de seleção:
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variante="neutro"
                  tamanho="pequeno"
                  onClick={() => selecionarTodasGlobal(true)}
                  disabled={validos.length === 0}
                >
                  Selecionar todas ({validos.length})
                </Button>

                <Button
                  variante="neutro"
                  tamanho="pequeno"
                  onClick={() => selecionarTodasGlobal(false)}
                  disabled={selecionadasValidas.length === 0}
                >
                  Desmarcar todas
                </Button>

                {filtrosAtivos && (
                  <>
                    <Button
                      variante="neutro"
                      tamanho="pequeno"
                      onClick={selecionarApenasFiltradas}
                      disabled={filtradasValidas.length === 0}
                    >
                      Selecionar apenas filtradas ({filtradasValidas.length})
                    </Button>

                    <Button
                      variante="neutro"
                      tamanho="pequeno"
                      onClick={alternarTodasFiltradas}
                      disabled={filtradasValidas.length === 0}
                    >
                      {todasFiltradasMarcadas
                        ? 'Desmarcar filtradas'
                        : 'Marcar filtradas'}
                    </Button>
                  </>
                )}

                <Button
                  variante="neutro"
                  tamanho="pequeno"
                  onClick={inverterSelecaoFiltradas}
                  disabled={filtradasValidas.length === 0}
                >
                  Inverter seleção
                </Button>
              </div>
            </div>
          </section>

          {/* INDICADORES DOS PROCEDIMENTOS SELECIONADOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

            <Indicador
              titulo="Selecionadas para cadastro"
              valor={`${selecionadasValidas.length} de ${itens.length}`}
              detalhe="Procedimentos marcados para gerar PO"
              destaque
            />

            <Indicador
              titulo="Tempo médio (TP)"
              valor={
                resumo
                  ? `${min4(resumo.tempoMedio)} min`
                  : '0,0000 min'
              }
              detalhe={
                resumo
                  ? `FIXO: ${pct(resumo.pctFixo)} · Manual: ${pct(
                      resumo.pctManual
                    )}`
                  : 'Selecione procedimentos abaixo'
              }
            />

            <Indicador
              titulo="Capacidade teórica"
              valor={
                resumo
                  ? `${Math.round(resumo.capacidadeMedia)} peças/h`
                  : '0 peças/h'
              }
              detalhe={
                resumo
                  ? `${faixa(
                      resumo.capMin,
                      resumo.capMax
                    )} peças/h · 100% de eficiência`
                  : '100% de eficiência'
              }
            />

            <Indicador
              titulo="Status da importação"
              valor={`${validos.length} válido(s)`}
              detalhe={
                invalidos.length > 0
                  ? `${invalidos.length} com pendência (clique em Editar para corrigir)`
                  : 'Todos os procedimentos estão prontos'
              }
            />

          </div>

          {/* LISTAGEM DOS PROCEDIMENTOS IMPORTADOS */}
          <section className="bg-white rounded-[26px] p-5 lg:p-7">

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">

              <div>
                <h2 className="text-[23px] font-normal text-[#686562]">
                  Procedimentos importados
                </h2>

                <p className="text-sm text-[#686562] mt-2">
                  Marque os procedimentos que deseja cadastrar. Você pode editar ou excluir qualquer item antes da confirmação.
                </p>
              </div>

              <span className="text-sm text-[#686562]">
                {selecionadasFiltradas.length} de {filtradas.length} selecionadas na lista
              </span>

            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#E6E4DF]">

              <table className="w-full min-w-[1180px] border-collapse text-sm">

                <thead>
                  <tr className="bg-[#F2F1EE] text-[#686562]">

                    <th className="py-5 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={todasFiltradasMarcadas}
                        onChange={alternarTodasFiltradas}
                        disabled={filtradasValidas.length === 0}
                        aria-label="Selecionar todos os procedimentos filtrados"
                        className="w-4 h-4 accent-[#736F6B] cursor-pointer"
                      />
                    </th>

                    <th className="py-5 px-4 text-left font-semibold w-20">
                      Linha
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

                    <th className="py-5 px-4 text-left font-semibold">
                      Elementos MTM
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

                    <th className="py-5 px-4 text-center font-semibold">
                      Ações
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E6E4DF]">

                  {filtradas.map((p) => {
                    const marcada = Boolean(p.ok && p.selecionado);
                    const elementosTexto = (p.demanda?.elementos || [])
                      .map((el) =>
                        el.frequencia && el.frequencia !== 1
                          ? `${el.codigo}x${el.frequencia}`
                          : el.codigo
                      )
                      .join(', ');

                    return (
                      <tr
                        key={p.uid}
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
                            disabled={!p.ok}
                            onChange={() => alternar(p.uid)}
                            aria-label={`Selecionar linha ${p.linha}`}
                            className="w-4 h-4 accent-[#736F6B] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </td>

                        <td className="py-5 px-4 whitespace-nowrap font-semibold text-[#55524F]">
                          #{p.linha}
                        </td>

                        <td className="py-5 px-4">
                          <div>
                            {p.familia || '—'} · {p.tamanho || '—'}
                          </div>
                          {p.medidas && (
                            <div className="text-xs text-[#686562] mt-0.5">
                              {p.medidas} m
                            </div>
                          )}
                        </td>

                        <td className="py-5 px-4">
                          <div>{p.operacao || '—'}</div>
                          {!p.ok && (
                            <div className="text-xs text-red-700 mt-1">
                              Pendência: {formatarErroItem(p.erro)}
                            </div>
                          )}
                        </td>

                        <td className="py-5 px-4 whitespace-nowrap">
                          {p.maquina?.codigo != null
                            ? `${p.maquina.codigo}${
                                p.maquina.descricao
                                  ? ` · ${p.maquina.descricao}`
                                  : ''
                              }`
                            : '—'}
                        </td>

                        <td className="py-5 px-4">
                          <span className="text-xs font-medium">
                            {elementosTexto || '—'}
                          </span>
                        </td>

                        <td className="py-5 px-4 text-right tabular-nums">
                          {p.ok ? min4(p.tempoFixo) : '—'}
                        </td>

                        <td className="py-5 px-4 text-right tabular-nums">
                          {p.ok ? min4(manualDe(p)) : '—'}
                        </td>

                        <td className="py-5 px-4 text-right tabular-nums font-semibold">
                          {p.ok ? min4(p.tp) : '—'}
                        </td>

                        <td className="py-5 px-4 text-right tabular-nums">
                          {p.ok
                            ? pct(
                                p.tp > 0
                                  ? (p.tempoFixo / p.tp) * 100
                                  : 0
                              )
                            : '—'}
                        </td>

                        <td className="py-5 px-4 text-right tabular-nums">
                          {p.ok ? capacidade(p.tp) : '—'}
                        </td>

                        <td className="py-5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              variante="editar"
                              tamanho="pequeno"
                              onClick={() =>
                                nav(`/confirmar-importacao/editar/${p.uid}`)
                              }
                            >
                              Editar
                            </Button>

                            <Button
                              variante="excluir"
                              tamanho="pequeno"
                              onClick={() => excluirItem(p)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}

                  {filtradas.length === 0 && (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-16 text-center text-[#736F6B]"
                      >
                        Nenhum procedimento encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>

            </div>

            {/* BARRA INFERIOR DE AÇÃO */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-7 pt-6 border-t border-[#E6E4DF]">
              <Button
                variante="secundario"
                tamanho="grande"
                onClick={() => nav('/nova-po')}
                disabled={cadastrando}
              >
                ← Voltar para Nova PO
              </Button>

              <Button
                variante="primario"
                tamanho="grande"
                onClick={confirmarCadastro}
                disabled={cadastrando || selecionadasValidas.length === 0}
              >
                {cadastrando
                  ? 'Cadastrando POs...'
                  : `Confirmar e cadastrar ${selecionadasValidas.length} PO(s)`}
              </Button>
            </div>

          </section>
        </>
      )}

    </div>
  );
}
