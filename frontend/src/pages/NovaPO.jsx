import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Stepper from '../components/Stepper';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import {
  elementosApi,
  maquinasApi,
  posApi,
  erroMsg,
} from '../services/api';
import { toNum } from '../utils/format';
import {
  salvarLoteImportacao,
  buscarItemImportacao,
  atualizarItemImportacao,
} from '../utils/importacaoStorage';

const ETAPAS_CRIACAO = [
  'Produto',
  'Máquina',
  'Procedimentos',
  'Revisar e gerar',
];

const ETAPAS_EDICAO = [
  'Produto',
  'Máquina',
  'Procedimentos',
  'Revisar e salvar',
];

const TAMANHOS = [
  'Solteiro', 'Solteiro King', 'Casal', 'Queen',
  'King', 'Super King', 'Infantil', 'Berço',
];

const inicial = {
  familia: '',
  tamanho: '',
  perimetroM: '',
  pontosCm: '',
  operacao: '',
  medidas: '',
  maquina: null,
  elementos: [],
};

const MEDIDAS = /^\d+([.,]\d+)?\s*[xX×]\s*\d+([.,]\d+)?$/;

const positivo = (v) =>
  String(v).trim() !== '' &&
  Number.isFinite(toNum(v)) &&
  toNum(v) > 0;

const inputClass =
  'w-full h-12 bg-white border border-[#C8C6C1] rounded-xl px-4 ' +
  'text-sm text-[#222222] placeholder:text-[#9E9B97] ' +
  'focus:outline-none focus:border-[#736F6B]';

function validarEtapa(etapa, d) {
  const e = {};

  if (etapa === 0) {
    if (!d.familia.trim())
      e.familia = 'Informe o agrupamento família';

    if (!d.tamanho.trim())
      e.tamanho = 'Informe o tamanho';

    if (!d.medidas.trim()) {
      e.medidas = 'Informe as medidas da peça';
    } else if (!MEDIDAS.test(d.medidas.trim())) {
      e.medidas = 'Use largura x comprimento (ex.: 1,80 x 2,50)';
    }

    if (!positivo(d.pontosCm))
      e.pontosCm = 'Informe um número maior que zero';

    if (!positivo(d.perimetroM))
      e.perimetroM = 'Informe um número maior que zero';

    if (!d.operacao.trim())
      e.operacao = 'Informe a operação';
  }

  if (etapa === 1 && !d.maquina) {
    e.maquina = 'Selecione uma máquina';
  }

  if (etapa === 2) {
    if (!d.elementos.length) {
      e.elementos = 'Adicione ao menos um procedimento';
    } else if (
      d.elementos.some(
        (x) => !Number.isInteger(x.frequencia) || x.frequencia <= 0
      )
    ) {
      e.elementos = 'A frequência deve ser um inteiro maior que zero';
    }
  }

  return e;
}

function Campo({ label, erro, children }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[#686562]">
      <span className="font-medium">{label}</span>
      {children}
      {erro && <span className="text-xs text-red-700">{erro}</span>}
    </label>
  );
}

export default function NovaPO() {
  const nav = useNavigate();
  const { id: poId, uid: importUid } = useParams();

  const modoEdicaoPO = Boolean(poId);
  const modoEdicaoImportacao = Boolean(importUid);
  const modoEdicao = modoEdicaoPO || modoEdicaoImportacao;

  const etapas = modoEdicao ? ETAPAS_EDICAO : ETAPAS_CRIACAO;

  const [etapa, setEtapa] = useState(0);
  const [demanda, setDemanda] = useState(inicial);
  const [maquinas, setMaquinas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [codigoDigitado, setCodigoDigitado] = useState('');
  const [erroCodigo, setErroCodigo] = useState('');
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(modoEdicao);
  const [codigoPOEditando, setCodigoPOEditando] = useState('');
  const [linhaImportada, setLinhaImportada] = useState(null);

  useEffect(() => {
    maquinasApi.listar()
      .then(setMaquinas)
      .catch((err) => setErro(erroMsg(err)));

    elementosApi.listar()
      .then(setCatalogo)
      .catch((err) => setErro(erroMsg(err)));
  }, []);

  // CARREGAR DADOS QUANDO FOR EDIÇÃO DE PO EXISTENTE OU DE ITEM IMPORTADO
  useEffect(() => {
    setEtapa(0);
    setErros({});
    setErro('');

    if (modoEdicaoPO) {
      setCarregandoDados(true);
      posApi
        .buscar(poId)
        .then((po) => {
          setCodigoPOEditando(po.codigoPO || '');
          setDemanda({
            familia: po.familia || '',
            tamanho: po.tamanho || '',
            medidas: po.medidas || '',
            pontosCm:
              po.pontosCm != null
                ? String(po.pontosCm).replace('.', ',')
                : '',
            perimetroM:
              po.perimetroM != null
                ? String(po.perimetroM).replace('.', ',')
                : '',
            operacao: po.operacao || '',
            maquina:
              po.maquina?.codigo != null
                ? Number(po.maquina.codigo)
                : null,
            elementos: (po.itens || []).map((i) => ({
              codigo: String(i.codigo ?? '').trim(),
              frequencia: Number(i.frequencia) || 1,
            })),
          });
        })
        .catch((err) => setErro(erroMsg(err)))
        .finally(() => setCarregandoDados(false));
      return;
    }

    if (modoEdicaoImportacao) {
      setCarregandoDados(true);
      const item = buscarItemImportacao(importUid);
      if (!item) {
        setErro('Procedimento importado não encontrado para edição.');
        setCarregandoDados(false);
        return;
      }

      const d = item.demanda || {};
      setLinhaImportada(item.linha);
      setDemanda({
        familia: d.familia || '',
        tamanho: d.tamanho || '',
        medidas: d.medidas || '',
        pontosCm:
          d.pontosCm != null && d.pontosCm !== ''
            ? String(d.pontosCm).replace('.', ',')
            : '',
        perimetroM:
          d.perimetroM != null && d.perimetroM !== ''
            ? String(d.perimetroM).replace('.', ',')
            : '',
        operacao: d.operacao || '',
        maquina:
          d.maquina != null && d.maquina !== ''
            ? Number(d.maquina)
            : null,
        elementos: Array.isArray(d.elementos)
          ? d.elementos.map((el) => ({
              codigo: String(el.codigo ?? '').trim(),
              frequencia: Number(el.frequencia) || 1,
            }))
          : [],
      });
      setCarregandoDados(false);
      return;
    }

    setCarregandoDados(false);
    setCodigoPOEditando('');
    setLinhaImportada(null);
    setDemanda(inicial);
  }, [poId, importUid, modoEdicaoPO, modoEdicaoImportacao]);

  const set = (campo) => (e) => {
    const valor = e.target.value;

    setDemanda((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    setErros((anterior) => ({
      ...anterior,
      [campo]: undefined,
    }));
  };

  const indice = useMemo(
    () => new Map(catalogo.map((e) => [e.codigo, e])),
    [catalogo]
  );

  const elemento = (codigo) => indice.get(codigo);

  const sugestoes = useMemo(() => {
    const termo = codigoDigitado.trim().toLowerCase();
    if (!termo || /[,;\s]/.test(termo)) return [];

    return catalogo.filter(
      (e) =>
        String(e.codigo).toLowerCase().startsWith(termo) ||
        String(e.descricao).toLowerCase().includes(termo)
    ).slice(0, 8);
  }, [catalogo, codigoDigitado]);

  const maquinaSel = maquinas.find(
    (m) => m.codigo === demanda.maquina
  );

  async function importar(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setErro('');
    setImportando(true);

    try {
      const resultado = await posApi.importar(arquivo);
      salvarLoteImportacao(resultado, arquivo.name);
      nav('/confirmar-importacao');
    } catch (err) {
      setErro(erroMsg(err));
    } finally {
      setImportando(false);
      e.target.value = '';
    }
  }

  async function avancar() {
    setErro('');

    const novosErros = validarEtapa(etapa, demanda);
    setErros(novosErros);

    if (Object.keys(novosErros).length) return;

    if (etapa === 2) {
      try {
        await posApi.preview(demanda);
      } catch (err) {
        setErro(erroMsg(err));
        return;
      }
    }

    setEtapa((anterior) => anterior + 1);
  }

  function irPara(i) {
    if (i < etapa) {
      setErros({});
      setErro('');
      setEtapa(i);
    }
  }

  async function salvarOuGerar() {
    if (enviando) return;

    setEnviando(true);
    setErro('');

    try {
      if (modoEdicaoPO) {
        const poAtualizada = await posApi.atualizar(poId, demanda);
        nav(`/pos/${poAtualizada._id || poId}`);
      } else if (modoEdicaoImportacao) {
        const previa = await posApi.preview(demanda);
        atualizarItemImportacao(importUid, demanda, previa);
        nav('/confirmar-importacao');
      } else {
        const po = await posApi.criar(demanda);
        nav(`/pos/${po._id}`);
      }
    } catch (err) {
      setErro(erroMsg(err));
    } finally {
      setEnviando(false);
    }
  }

  function adicionarCodigos(texto) {
    const partes = String(texto)
      .split(/[,;\s]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (!partes.length) return;

    const novos = [];
    const invalidos = [];

    for (const parte of partes) {
      const [cod, freq] = parte.split(/[xX*]/);
      const codigo = cod.trim();
      const frequencia = freq ? Number(freq.replace(',', '.')) : 1;

      if (
        !indice.has(codigo) ||
        !Number.isInteger(frequencia) ||
        frequencia <= 0
      ) {
        invalidos.push(parte);
      } else {
        novos.push({ codigo, frequencia });
      }
    }

    if (novos.length) {
      setDemanda((d) => ({
        ...d,
        elementos: [...d.elementos, ...novos],
      }));
      setErros({});
    }

    setErroCodigo(
      invalidos.length
        ? `Código(s) não encontrado(s) ou frequência inválida: ${invalidos.join(', ')}`
        : ''
    );

    setCodigoDigitado(invalidos.join(', '));
  }

  function atualizarElementos(lista) {
    setDemanda((anterior) => ({
      ...anterior,
      elementos: lista,
    }));
  }

  const tituloCabecalho = modoEdicaoPO
    ? `Editar ${codigoPOEditando || 'PO'}`
    : modoEdicaoImportacao
    ? `Editar Procedimento Importado${
        linhaImportada != null ? ` (Linha #${linhaImportada})` : ''
      }`
    : 'Nova PO';

  const subtituloCabecalho = modoEdicaoPO
    ? 'Atualize os dados do produto, máquina ou procedimentos para recalcular a ficha de Processo Operacional.'
    : modoEdicaoImportacao
    ? 'Ajuste as informações deste procedimento antes de confirmar sua importação.'
    : 'Preencha as informações para gerar uma nova ficha de Processo Operacional.';

  return (
    <div className="w-full min-h-[760px] bg-[#F2F1EE] rounded-[28px] p-6 lg:p-10">

      {/* CABEÇALHO */}
      <PageHeader
        titulo={tituloCabecalho}
        subtitulo={subtituloCabecalho}
      >
        {modoEdicaoPO && (
          <Button
            variante="secundario"
            tamanho="grande"
            onClick={() => nav(`/pos/${poId}`)}
          >
            ← Cancelar edição
          </Button>
        )}

        {modoEdicaoImportacao && (
          <Button
            variante="secundario"
            tamanho="grande"
            onClick={() => nav('/confirmar-importacao')}
          >
            ← Voltar à confirmação
          </Button>
        )}
      </PageHeader>

      {/* ETAPAS */}
      <div className="bg-white rounded-2xl p-4 lg:p-6 mb-7">
        <Stepper
          etapas={etapas}
          atual={etapa}
          onChange={irPara}
        />
      </div>

      {carregandoDados ? (
        <section className="bg-white rounded-3xl p-8 text-center text-sm text-[#686562]">
          Carregando informações do procedimento...
        </section>
      ) : (
        <section className="bg-white rounded-3xl p-5 lg:p-8 min-h-[430px] flex flex-col gap-6">

          {/* ETAPA 1 — PRODUTO */}
          {etapa === 0 && (
            <>
              <div>
                <h2 className="text-2xl font-semibold text-[#222222]">
                  1. Dados do produto
                </h2>
                <p className="text-sm text-[#736F6B] mt-2">
                  Informe as características da peça e os dados necessários para o cálculo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                <Campo label="Agrupamento família" erro={erros.familia}>
                  <input
                    className={inputClass}
                    value={demanda.familia}
                    onChange={set('familia')}
                    placeholder="Sobre-lençol"
                  />
                </Campo>

                <Campo label="Tamanho" erro={erros.tamanho}>
                  <input
                    className={inputClass}
                    value={demanda.tamanho}
                    onChange={set('tamanho')}
                    placeholder="Solteiro"
                    list="tamanhos"
                  />
                </Campo>

                <datalist id="tamanhos">
                  {TAMANHOS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>

                <Campo label="Medidas da peça (em m)" erro={erros.medidas}>
                  <input
                    className={inputClass}
                    value={demanda.medidas}
                    onChange={set('medidas')}
                    placeholder="1,80 x 2,50"
                  />
                </Campo>

                <Campo label="Pontos/cm" erro={erros.pontosCm}>
                  <input
                    className={inputClass}
                    value={demanda.pontosCm}
                    onChange={set('pontosCm')}
                    placeholder="2,5"
                    inputMode="decimal"
                  />
                </Campo>

                <Campo label="Perímetro costura (em m)" erro={erros.perimetroM}>
                  <input
                    className={inputClass}
                    value={demanda.perimetroM}
                    onChange={set('perimetroM')}
                    placeholder="6,96"
                    inputMode="decimal"
                  />
                </Campo>

                <Campo label="Operação" erro={erros.operacao}>
                  <input
                    className={inputClass}
                    value={demanda.operacao}
                    onChange={set('operacao')}
                    placeholder="Bainhar no corpo do SL - 1 lado"
                  />
                </Campo>

              </div>

              <p className="text-sm text-[#736F6B]">
                {modoEdicaoPO
                  ? `Todos os campos são obrigatórios. O código ${
                      codigoPOEditando || 'da PO'
                    } será mantido e os tempos serão recalculados.`
                  : 'Todos os campos são obrigatórios. O código da PO e a revisão 00 são gerados automaticamente.'}
              </p>

              {/* IMPORTAÇÃO (apenas no fluxo de criação) */}
              {!modoEdicao && (
                <div className="border-2 border-dashed border-[#C8C6C1] bg-[#FAF9F7] rounded-2xl p-5 lg:p-6">

                  <h3 className="text-base font-medium text-[#222222]">
                    Importar demanda
                  </h3>

                  <p className="text-sm text-[#736F6B] mt-2 mb-4">
                    Ou importe um arquivo JSON, Excel, CSV ou TXT com um ou mais procedimentos para revisar e confirmar antes de cadastrar.
                  </p>

                  <input
                    type="file"
                    accept=".json,.xlsx,.xls,.csv,.txt"
                    onChange={importar}
                    disabled={importando}
                    className="block w-full text-sm text-[#686562] file:mr-4 file:rounded-xl file:border-0 file:bg-[#736F6B] file:px-5 file:py-3 file:text-sm file:font-medium file:text-white hover:file:bg-[#5E5A56] file:cursor-pointer"
                  />

                  {importando && (
                    <p className="text-sm text-[#736F6B] mt-3">
                      Processando arquivo para confirmação...
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ETAPA 2 — MÁQUINA */}
          {etapa === 1 && (
            <>
              <div>
                <h2 className="text-2xl font-semibold text-[#222222]">
                  2. Selecionar máquina
                </h2>
                <p className="text-sm text-[#736F6B] mt-2">
                  Escolha a máquina que será utilizada na operação.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {maquinas.map((m) => {
                  const selecionada = demanda.maquina === m.codigo;

                  return (
                    <button
                      key={m.codigo}
                      type="button"
                      onClick={() => {
                        setDemanda((anterior) => ({
                          ...anterior,
                          maquina: m.codigo,
                        }));
                        setErros({});
                      }}
                      className={`text-left p-6 rounded-2xl transition-all cursor-pointer ${
                        selecionada
                          ? 'bg-[#E5E3DD] border-2 border-[#736F6B] shadow-sm'
                          : 'bg-[#FAF9F7] border border-[#C8C6C1] hover:border-[#736F6B]'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-sm text-[#736F6B]">
                          Código {m.codigo}
                        </span>

                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selecionada
                              ? 'border-[#736F6B]'
                              : 'border-[#C8C6C1]'
                          }`}
                        >
                          {selecionada && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#736F6B]" />
                          )}
                        </span>
                      </div>

                      <strong className="text-xl text-[#222222] block mt-4">
                        {m.descricao}
                      </strong>

                      <p className="text-sm text-[#686562] mt-2">
                        RPM padrão: {m.rpmPadrao}
                      </p>
                    </button>
                  );
                })}
              </div>

              {!maquinas.length && (
                <p className="text-sm text-[#736F6B]">
                  Nenhuma máquina cadastrada.
                </p>
              )}

              {erros.maquina && (
                <span className="text-sm text-red-700">
                  {erros.maquina}
                </span>
              )}
            </>
          )}

          {/* ETAPA 3 — PROCEDIMENTOS */}
          {etapa === 2 && (
            <>
              <div>
                <h2 className="text-2xl font-semibold text-[#222222]">
                  3. Procedimentos (MTM)
                </h2>

                <p className="text-sm text-[#736F6B] mt-2">
                  Adicione os procedimentos na ordem de execução.
                  A costura de máquina (FIXO) entra automaticamente.
                </p>
              </div>

              <div className="relative">
                <div className="flex flex-col sm:flex-row gap-3">

                  <input
                    type="text"
                    value={codigoDigitado}
                    onChange={(e) => {
                      setCodigoDigitado(e.target.value);
                      setErroCodigo('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        adicionarCodigos(codigoDigitado);
                      }
                    }}
                    placeholder="Digite o código ou a descrição do procedimento"
                    autoComplete="off"
                    className={`${inputClass} flex-1 min-w-0`}
                  />

                  <Button
                    variante="primario"
                    tamanho="grande"
                    className="min-w-[150px]"
                    onClick={() => adicionarCodigos(codigoDigitado)}
                  >
                    + Adicionar
                  </Button>
                </div>

                {/* AUTOCOMPLETE */}
                {sugestoes.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 sm:right-[165px] mt-2 bg-white border border-[#C8C6C1] rounded-xl shadow-lg overflow-hidden">
                    {sugestoes.map((e) => (
                      <li key={e.codigo}>
                        <button
                          type="button"
                          onClick={() => adicionarCodigos(e.codigo)}
                          className="w-full flex items-center gap-4 px-4 py-3 text-left text-sm hover:bg-[#F2F1EE] cursor-pointer"
                        >
                          <span className="font-semibold text-[#222222] w-16 shrink-0">
                            {e.codigo}
                          </span>

                          <span className="flex-1 text-[#55524F] truncate">
                            {e.descricao}
                          </span>

                          <span className="text-[#686562] text-xs tabular-nums">
                            {String(e.tempo).replace('.', ',')} min
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-sm text-[#736F6B]">
                {catalogo.length} procedimentos cadastrados.
                Busque pelo código ou pela descrição.
                Para repetir um procedimento, utilize a frequência (ex.: 4.1x2).
              </p>

              {erroCodigo && (
                <span className="text-sm text-red-700">
                  {erroCodigo}
                </span>
              )}

              {/* TABELA DE PROCEDIMENTOS */}
              <div className="overflow-x-auto rounded-2xl border border-[#E6E4DF]">
                <table className="w-full min-w-[650px] text-sm border-collapse">

                  <thead>
                    <tr className="bg-[#F2F1EE] text-[#686562]">
                      <th className="py-4 px-4 text-left w-12">#</th>
                      <th className="py-4 px-4 text-left w-28">Código</th>
                      <th className="py-4 px-4 text-left">Descrição</th>
                      <th className="py-4 px-4 text-center w-28">Freq.</th>
                      <th className="py-4 px-4 text-center w-20">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E6E4DF]">
                    {demanda.elementos.map((el, i) => (
                      <tr
                        key={i}
                        className="hover:bg-[#FAF9F7] text-[#222222]"
                      >
                        <td className="py-4 px-4">{i + 1}</td>

                        <td className="py-4 px-4 font-medium">
                          {el.codigo}
                        </td>

                        <td className="py-4 px-4">
                          {elemento(el.codigo)?.descricao}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={el.frequencia}
                            onChange={(e) =>
                              atualizarElementos(
                                demanda.elementos.map((x, j) =>
                                  j === i
                                    ? {
                                        ...x,
                                        frequencia: Number(e.target.value),
                                      }
                                    : x
                                )
                              )
                            }
                            className="w-20 h-10 border border-[#C8C6C1] rounded-xl px-3 text-sm text-center text-[#222222] focus:outline-none focus:border-[#736F6B]"
                          />
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Button
                            variante="excluir"
                            tamanho="pequeno"
                            onClick={() =>
                              atualizarElementos(
                                demanda.elementos.filter((_, j) => j !== i)
                              )
                            }
                            aria-label={`Remover procedimento ${el.codigo}`}
                          >
                            ✕
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {!demanda.elementos.length && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-[#736F6B]"
                        >
                          Nenhum procedimento adicionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {erros.elementos && (
                <span className="text-sm text-red-700">
                  {erros.elementos}
                </span>
              )}
            </>
          )}

          {/* ETAPA 4 — REVISAR E GERAR / SALVAR */}
          {etapa === 3 && (
            <>
              <div>
                <h2 className="text-2xl font-semibold text-[#222222]">
                  {modoEdicao ? '4. Revisar e salvar' : '4. Revisar e gerar'}
                </h2>

                <p className="text-sm text-[#736F6B] mt-2">
                  {modoEdicaoPO
                    ? 'Confira as alterações antes de atualizar a PO. Os tempos serão recalculados automaticamente.'
                    : modoEdicaoImportacao
                    ? 'Confira as alterações antes de retornar à tela de confirmação de importação.'
                    : 'Confira as informações antes de gerar a PO. Os tempos serão calculados automaticamente.'}
                </p>
              </div>

              <div className="bg-[#FAF9F7] rounded-2xl p-5 lg:p-6">
                <h3 className="text-lg font-semibold text-[#222222] mb-5">
                  Dados do produto
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  {[
                    ['Operação', demanda.operacao],
                    ['Agrupamento família', demanda.familia],
                    ['Tamanho', demanda.tamanho],
                    ['Medidas da peça', demanda.medidas],
                    ['Pontos/cm', demanda.pontosCm],
                    ['Perímetro de costura', demanda.perimetroM],
                    [
                      'Máquina',
                      `${maquinaSel?.codigo ?? ''} · ${maquinaSel?.descricao ?? ''}`,
                    ],
                  ].map(([titulo, valor]) => (
                    <div key={titulo}>
                      <p className="text-sm text-[#736F6B] mb-1">
                        {titulo}
                      </p>

                      <p className="text-base font-medium text-[#222222]">
                        {valor}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#222222] mb-4">
                  Procedimentos selecionados
                </h3>

                <div className="overflow-x-auto rounded-2xl border border-[#E6E4DF]">
                  <table className="w-full min-w-[500px] text-sm border-collapse">

                    <thead>
                      <tr className="bg-[#F2F1EE] text-[#686562]">
                        <th className="py-4 px-4 text-left w-12">#</th>
                        <th className="py-4 px-4 text-left w-28">Código</th>
                        <th className="py-4 px-4 text-left">Procedimento</th>
                        <th className="py-4 px-4 text-center w-28">Freq.</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#E6E4DF]">
                      {demanda.elementos.map((el, i) => (
                        <tr key={i} className="text-[#222222]">
                          <td className="py-4 px-4">{i + 1}</td>

                          <td className="py-4 px-4 font-medium">
                            {el.codigo}
                          </td>

                          <td className="py-4 px-4">
                            {elemento(el.codigo)?.descricao}
                          </td>

                          <td className="py-4 px-4 text-center">
                            {el.frequencia}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ERRO GERAL */}
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-3">
              {erro}
            </div>
          )}
        </section>
      )}

      {/* BOTÕES DE NAVEGAÇÃO */}
      <div className="flex justify-between items-center gap-4 mt-7">

        <div>
          {etapa > 0 && (
            <Button
              variante="secundario"
              tamanho="grande"
              className="min-w-[150px]"
              onClick={() => irPara(etapa - 1)}
            >
              ← Voltar
            </Button>
          )}
        </div>

        <div>
          {etapa < 3 && (
            <Button
              variante="primario"
              tamanho="grande"
              className="min-w-[150px]"
              onClick={avancar}
              disabled={carregandoDados}
            >
              Próximo →
            </Button>
          )}

          {etapa === 3 && (
            <Button
              variante="primario"
              tamanho="grande"
              className="min-w-[150px]"
              onClick={salvarOuGerar}
              disabled={enviando || carregandoDados}
            >
              {enviando
                ? modoEdicao
                  ? 'Salvando...'
                  : 'Gerando...'
                : modoEdicao
                ? 'Salvar alterações'
                : 'Gerar PO'}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
