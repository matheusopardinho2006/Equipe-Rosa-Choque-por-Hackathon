import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/Stepper';
import { elementosApi, maquinasApi, posApi, erroMsg } from '../services/api';
import { toNum } from '../utils/format';

const ETAPAS = ['Produto', 'Máquina', 'Procedimentos', 'Revisar e gerar'];
const TAMANHOS = [
  'Solteiro',
  'Solteiro King',
  'Casal',
  'Queen',
  'King',
  'Super King',
  'Infantil',
  'Berço',
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
  String(v).trim() !== '' && Number.isFinite(toNum(v)) && toNum(v) > 0;

function validarEtapa(etapa, d) {
  const e = {};
  if (etapa === 0) {
    if (!d.familia.trim()) e.familia = 'Informe o agrupamento família';
    if (!d.tamanho.trim()) e.tamanho = 'Informe o tamanho';
    if (!d.medidas.trim()) e.medidas = 'Informe as medidas da peça';
    else if (!MEDIDAS.test(d.medidas.trim()))
      e.medidas = 'Use largura x comprimento (ex.: 1,80 x 2,50)';
    if (!positivo(d.pontosCm))
      e.pontosCm = 'Informe um número maior que zero (ex.: 2,5)';
    if (!positivo(d.perimetroM))
      e.perimetroM = 'Informe um número maior que zero (ex.: 6,96)';
    if (!d.operacao.trim()) e.operacao = 'Informe a operação';
  }
  if (etapa === 1 && !d.maquina) e.maquina = 'Selecione uma máquina';
  if (etapa === 2) {
    if (!d.elementos.length) e.elementos = 'Adicione ao menos um procedimento';
    else if (
      d.elementos.some((x) => !(Number.isInteger(x.frequencia) && x.frequencia > 0))
    )
      e.elementos = 'A frequência deve ser um número inteiro maior que zero';
  }
  return e;
}

function Campo({ label, erro, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-[#4A4845]">
      <span className="font-medium">{label}</span>
      {children}
      {erro && <span className="text-xs text-red-700">{erro}</span>}
    </label>
  );
}

export default function NovaPO() {
  const nav = useNavigate();
  const [etapa, setEtapa] = useState(0);
  const [demanda, setDemanda] = useState(inicial);
  const [maquinas, setMaquinas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [add, setAdd] = useState('');
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [importacao, setImportacao] = useState(null);

  useEffect(() => {
    maquinasApi.listar().then(setMaquinas);
    elementosApi.listar().then((l) => {
      setCatalogo(l);
      setAdd(l[0]?.codigo || '');
    });
  }, []);

  const set = (k) => (e) => {
    setDemanda({ ...demanda, [k]: e.target.value });
    setErros({ ...erros, [k]: undefined });
  };
  const elemento = (c) => catalogo.find((e) => e.codigo === c);
  const maquinaSel = maquinas.find((m) => m.codigo === demanda.maquina);

  async function importar(e) {
    const f = e.target.files[0];
    if (!f) return;
    setErro('');
    setImportacao(null);
    try {
      const r = await posApi.importar(f);
      if (r.length === 1 && r[0].ok) nav(`/pos/${r[0].id}`);
      else setImportacao(r);
    } catch (err) {
      setErro(erroMsg(err));
    }
    e.target.value = '';
  }

  async function avancar() {
    setErro('');
    const e = validarEtapa(etapa, demanda);
    setErros(e);
    if (Object.keys(e).length) return;
    if (etapa === 2) {
      try {
        await posApi.preview(demanda);
      } catch (err) {
        return setErro(erroMsg(err));
      }
    }
    setEtapa(etapa + 1);
  }

  function irPara(i) {
    if (i < etapa) {
      setErros({});
      setErro('');
      setEtapa(i);
    }
  }

  async function gerar() {
    setEnviando(true);
    try {
      const po = await posApi.criar(demanda);
      nav(`/pos/${po._id}`);
    } catch (err) {
      setErro(erroMsg(err));
    }
    setEnviando(false);
  }

  const elementos = (lista) => setDemanda({ ...demanda, elementos: lista });

  const inputClass =
    'h-10 bg-white border border-[#C8C6C1] rounded-xl px-3 text-sm text-[#222222] focus:outline-none focus:border-[#686562]';

  return (
    <div>
      <Stepper etapas={ETAPAS} atual={etapa} onChange={irPara} />

      <section className="bg-[#F2F1EE] border border-[#C8C6C1] rounded-3xl p-6 min-h-[380px] flex flex-col gap-4">
        {etapa === 0 && (
          <>
            <h2 className="text-xl font-bold text-[#222222] m-0">
              1. Dados do produto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <span className="text-xs text-[#686562]">
              Todos os campos são obrigatórios. O código da PO (ex.: PO-SL-001) e a revisão 00 são gerados automaticamente.
            </span>

            <label className="border-2 border-dashed border-[#A9A7A5] bg-white rounded-2xl p-4 flex flex-col gap-2 text-xs text-[#4A4845] cursor-pointer">
              <span>Ou importe um arquivo JSON / Excel / CSV / TXT com a demanda</span>
              <input
                type="file"
                accept=".json,.xlsx,.xls,.csv,.txt"
                onChange={importar}
                className="text-xs"
              />
            </label>

            {importacao && (
              <div className="bg-white rounded-2xl overflow-hidden border border-[#C8C6C1]">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#D9D9D9] text-[#222222]">
                      <th className="py-2 px-3 text-left">Linha</th>
                      <th className="py-2 px-3 text-left">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E0D8]">
                    {importacao.map((x) => (
                      <tr key={x.linha}>
                        <td className="py-2 px-3">{x.linha}</td>
                        <td className="py-2 px-3">
                          {x.ok ? (
                            <a
                              href={`/pos/${x.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                nav(`/pos/${x.id}`);
                              }}
                              className="underline font-semibold"
                            >
                              {x.codigoPO} criada
                            </a>
                          ) : (
                            <span className="text-red-700">
                              {typeof x.erro === 'string'
                                ? x.erro
                                : Object.entries(x.erro)
                                    .map(([k, v]) => `${k}: ${v.join(', ')}`)
                                    .join(' · ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {etapa === 1 && (
          <>
            <h2 className="text-xl font-bold text-[#222222] m-0">2. Máquina</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {maquinas.map((m) => {
                const selecionada = demanda.maquina === m.codigo;
                return (
                  <button
                    key={m.codigo}
                    type="button"
                    onClick={() => {
                      setDemanda({ ...demanda, maquina: m.codigo });
                      setErros({});
                    }}
                    className={`text-left p-5 rounded-2xl transition-all cursor-pointer ${
                      selecionada
                        ? 'bg-[#E5E3DD] border-2 border-[#686562] shadow-xs'
                        : 'bg-white border border-[#C8C6C1] hover:border-[#736F6B]'
                    }`}
                  >
                    <div className="text-xs text-[#686562]">Cód. {m.codigo}</div>
                    <strong className="text-lg text-[#222222] block mt-0.5">
                      {m.descricao}
                    </strong>
                    <div className="text-xs text-[#4A4845] mt-1">
                      RPM {m.rpmPadrao}
                    </div>
                  </button>
                );
              })}
            </div>
            {erros.maquina && (
              <span className="text-xs text-red-700">{erros.maquina}</span>
            )}
          </>
        )}

        {etapa === 2 && (
          <>
            <h2 className="text-xl font-bold text-[#222222] m-0">
              3. Procedimentos (MTM)
            </h2>
            <p className="text-xs text-[#686562] m-0">
              Adicione na ordem de execução. A costura de máquina (FIXO) entra automaticamente.
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={add}
                onChange={(e) => setAdd(e.target.value)}
                className="flex-1 min-w-[260px] h-10 bg-white border border-[#C8C6C1] rounded-xl px-3 text-sm text-[#222222]"
              >
                {catalogo.map((e) => (
                  <option key={e.codigo} value={e.codigo}>
                    {e.codigo} — {e.descricao}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  elementos([...demanda.elementos, { codigo: add, frequencia: 1 }]);
                  setErros({});
                }}
                className="h-10 bg-[#686562] hover:bg-[#55524F] text-white rounded-xl px-4 text-xs font-medium cursor-pointer"
              >
                + Adicionar
              </button>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden border border-[#C8C6C1]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#D9D9D9] text-[#222222]">
                    <th className="py-2.5 px-3 text-left w-12">#</th>
                    <th className="py-2.5 px-3 text-left w-24">Código</th>
                    <th className="py-2.5 px-3 text-left">Descrição</th>
                    <th className="py-2.5 px-3 text-left w-28">Freq.</th>
                    <th className="py-2.5 px-3 text-right w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E0D8]">
                  {demanda.elementos.map((el, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3">{i + 1}</td>
                      <td className="py-2.5 px-3 font-medium">{el.codigo}</td>
                      <td className="py-2.5 px-3">
                        {elemento(el.codigo)?.descricao}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={el.frequencia}
                          onChange={(e) =>
                            elementos(
                              demanda.elementos.map((x, j) =>
                                j === i
                                  ? { ...x, frequencia: Number(e.target.value) }
                                  : x
                              )
                            )
                          }
                          className="w-16 h-8 border border-[#C8C6C1] rounded-lg px-2 text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            elementos(demanda.elementos.filter((_, j) => j !== i))
                          }
                          className="border border-[#C8C6C1] hover:bg-red-50 rounded-lg px-2.5 py-1 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!demanda.elementos.length && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#736F6B]">
                        Nenhum procedimento adicionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {erros.elementos && (
              <span className="text-xs text-red-700">{erros.elementos}</span>
            )}
          </>
        )}

        {etapa === 3 && (
          <>
            <h2 className="text-xl font-bold text-[#222222] m-0">
              4. Revisar e gerar
            </h2>
            <p className="text-xs text-[#686562] m-0">
              Confira os dados. Os tempos são calculados ao gerar a PO.
            </p>
            <div className="bg-white rounded-2xl overflow-hidden border border-[#C8C6C1]">
              <table className="w-full text-xs border-collapse">
                <tbody className="divide-y divide-[#E2E0D8]">
                  <tr>
                    <th className="bg-[#D9D9D9] py-2.5 px-3 text-left w-44">
                      Operação
                    </th>
                    <td colSpan={3} className="py-2.5 px-3">
                      {demanda.operacao}
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-[#D9D9D9] py-2.5 px-3 text-left">
                      Agrupamento família
                    </th>
                    <td className="py-2.5 px-3">{demanda.familia}</td>
                    <th className="bg-[#D9D9D9] py-2.5 px-3 text-left w-40">
                      Tamanho
                    </th>
                    <td className="py-2.5 px-3">{demanda.tamanho}</td>
                  </tr>
                  <tr>
                    <th className="bg-[#D9D9D9] py-2.5 px-3 text-left">
                      Medidas da peça (em m)
                    </th>
                    <td className="py-2.5 px-3">{demanda.medidas}</td>
                    <th className="bg-[#D9D9D9] py-2.5 px-3 text-left">
                      Pontos/cm
                    </th>
                    <td className="py-2.5 px-3">{demanda.pontosCm}</td>
                  </tr>
                  <tr>
                    <th className="bg-[#D9D9D9] py-2.5 px-3 text-left">
                      Perímetro costura (em m)
                    </th>
                    <td colSpan={3} className="py-2.5 px-3">
                      {demanda.perimetroM}
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-[#D9D9D9] py-2.5 px-3 text-left">
                      Máquina
                    </th>
                    <td colSpan={3} className="py-2.5 px-3">
                      {maquinaSel?.codigo} · {maquinaSel?.descricao}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden border border-[#C8C6C1]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#D9D9D9] text-[#222222]">
                    <th className="py-2 px-3 text-left w-12">#</th>
                    <th className="py-2 px-3 text-left w-24">Código</th>
                    <th className="py-2 px-3 text-left">Procedimento</th>
                    <th className="py-2 px-3 text-left w-24">Freq.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E0D8]">
                  {demanda.elementos.map((el, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3">{i + 1}</td>
                      <td className="py-2 px-3">{el.codigo}</td>
                      <td className="py-2 px-3">
                        {elemento(el.codigo)?.descricao}
                      </td>
                      <td className="py-2 px-3">{el.frequencia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {erro && <span className="text-xs text-red-700">{erro}</span>}
      </section>

      <div className="flex justify-between items-center mt-4">
        <div>
          {etapa > 0 && (
            <button
              type="button"
              onClick={() => irPara(etapa - 1)}
              className="bg-white hover:bg-[#F2F1EE] border border-[#C8C6C1] text-[#222222] rounded-xl px-5 py-2.5 text-xs font-medium cursor-pointer"
            >
              ← Voltar
            </button>
          )}
        </div>
        <div>
          {etapa < 3 && (
            <button
              type="button"
              onClick={avancar}
              className="bg-[#686562] hover:bg-[#55524F] text-white rounded-xl px-6 py-2.5 text-xs font-semibold cursor-pointer"
            >
              Próximo →
            </button>
          )}
          {etapa === 3 && (
            <button
              type="button"
              onClick={gerar}
              disabled={enviando}
              className="bg-[#686562] hover:bg-[#55524F] text-white rounded-xl px-6 py-2.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {enviando ? 'Gerando…' : 'Gerar PO'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
