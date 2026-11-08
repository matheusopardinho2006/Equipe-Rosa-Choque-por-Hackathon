import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/Stepper';
import { elementosApi, maquinasApi, posApi, erroMsg } from '../services/api';
import { toNum } from '../utils/format';

const ETAPAS = ['Produto', 'Máquina', 'Procedimentos', 'Revisar e gerar'];
const TAMANHOS = ['Solteiro', 'Solteiro King', 'Casal', 'Queen', 'King', 'Super King', 'Infantil', 'Berço'];

// Todos os dados do produto são obrigatórios. Código da PO e revisão são gerados pelo backend.
const inicial = { familia: '', tamanho: '', perimetroM: '', pontosCm: '', operacao: '', medidas: '', maquina: null, elementos: [] };

const MEDIDAS = /^\d+([.,]\d+)?\s*[xX×]\s*\d+([.,]\d+)?$/;
const positivo = (v) => String(v).trim() !== '' && Number.isFinite(toNum(v)) && toNum(v) > 0;

/** Valida só os campos da etapa atual. Retorna { campo: mensagem }. */
function validarEtapa(etapa, d) {
  const e = {};
  if (etapa === 0) {
    if (!d.familia.trim()) e.familia = 'Informe o agrupamento família';
    if (!d.tamanho.trim()) e.tamanho = 'Informe o tamanho';
    if (!d.medidas.trim()) e.medidas = 'Informe as medidas da peça';
    else if (!MEDIDAS.test(d.medidas.trim())) e.medidas = 'Use largura x comprimento (ex.: 1,80 x 2,50)';
    if (!positivo(d.pontosCm)) e.pontosCm = 'Informe um número maior que zero (ex.: 2,5)';
    if (!positivo(d.perimetroM)) e.perimetroM = 'Informe um número maior que zero (ex.: 6,96)';
    if (!d.operacao.trim()) e.operacao = 'Informe a operação';
  }
  if (etapa === 1 && !d.maquina) e.maquina = 'Selecione uma máquina';
  if (etapa === 2) {
    if (!d.elementos.length) e.elementos = 'Adicione ao menos um procedimento';
    else if (d.elementos.some((x) => !(Number.isInteger(x.frequencia) && x.frequencia > 0))) e.elementos = 'A frequência deve ser um número inteiro maior que zero';
  }
  return e;
}

function Campo({ label, erro, children }) {
  return (
    <label>
      {label}
      {children}
      {erro && <span className="erro">{erro}</span>}
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
  const [importacao, setImportacao] = useState(null); // resultado por linha do arquivo

  useEffect(() => {
    maquinasApi.listar().then(setMaquinas);
    elementosApi.listar().then((l) => { setCatalogo(l); setAdd(l[0]?.codigo || ''); });
  }, []);

  const set = (k) => (e) => { setDemanda({ ...demanda, [k]: e.target.value }); setErros({ ...erros, [k]: undefined }); };
  const elemento = (c) => catalogo.find((e) => e.codigo === c);
  const maquinaSel = maquinas.find((m) => m.codigo === demanda.maquina);

  // Importa JSON/Excel/CSV/TXT e já cria as POs
  async function importar(e) {
    const f = e.target.files[0];
    if (!f) return;
    setErro(''); setImportacao(null);
    try {
      const r = await posApi.importar(f);
      if (r.length === 1 && r[0].ok) nav(`/pos/${r[0].id}`);
      else setImportacao(r);
    } catch (err) { setErro(erroMsg(err)); }
    e.target.value = '';
  }

  // Só avança se a etapa atual estiver válida. Ao entrar em "Revisar",
  // o backend valida tudo de novo (sem mostrar tempos).
  async function avancar() {
    setErro('');
    const e = validarEtapa(etapa, demanda);
    setErros(e);
    if (Object.keys(e).length) return;
    if (etapa === 2) {
      try { await posApi.preview(demanda); }
      catch (err) { return setErro(erroMsg(err)); }
    }
    setEtapa(etapa + 1);
  }

  // Permite voltar livremente; avançar pelo stepper só até a etapa já validada
  function irPara(i) {
    if (i < etapa) { setErros({}); setErro(''); setEtapa(i); }
  }

  async function gerar() {
    setEnviando(true);
    try {
      const po = await posApi.criar(demanda);
      nav(`/pos/${po._id}`);
    } catch (err) { setErro(erroMsg(err)); }
    setEnviando(false);
  }

  const elementos = (lista) => setDemanda({ ...demanda, elementos: lista });

  return (
    <>
      <Stepper etapas={ETAPAS} atual={etapa} onChange={irPara} />

      <section className="card" style={{ minHeight: 380 }}>
        {etapa === 0 && (
          <>
            <h2 style={{ margin: 0 }}>1. Dados do produto</h2>
            <div className="grid">
              <Campo label="Agrupamento família" erro={erros.familia}><input value={demanda.familia} onChange={set('familia')} placeholder="Sobre-lençol" /></Campo>
              <Campo label="Tamanho" erro={erros.tamanho}><input value={demanda.tamanho} onChange={set('tamanho')} placeholder="Solteiro" list="tamanhos" /></Campo>
              <datalist id="tamanhos">{TAMANHOS.map((t) => <option key={t} value={t} />)}</datalist>
              <Campo label="Medidas da peça (em m)" erro={erros.medidas}><input value={demanda.medidas} onChange={set('medidas')} placeholder="1,80 x 2,50" /></Campo>
              <Campo label="Pontos/cm" erro={erros.pontosCm}><input value={demanda.pontosCm} onChange={set('pontosCm')} placeholder="2,5" inputMode="decimal" /></Campo>
              <Campo label="Perímetro costura (em m)" erro={erros.perimetroM}><input value={demanda.perimetroM} onChange={set('perimetroM')} placeholder="6,96" inputMode="decimal" /></Campo>
              <Campo label="Operação" erro={erros.operacao}><input value={demanda.operacao} onChange={set('operacao')} placeholder="Bainhar no corpo do SL - 1 lado" /></Campo>
            </div>
            <span className="muted">Todos os campos são obrigatórios. O código da PO (ex.: PO-SL-001) e a revisão 00 são gerados automaticamente.</span>
            <label style={{ border: '2px dashed #aaa', padding: 14 }}>
              Ou importe um arquivo JSON / Excel / CSV / TXT com a demanda
              <input type="file" accept=".json,.xlsx,.xls,.csv,.txt" onChange={importar} />
            </label>
            {importacao && (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Linha</th><th>Resultado</th></tr></thead>
                  <tbody>
                    {importacao.map((x) => (
                      <tr key={x.linha}>
                        <td>{x.linha}</td>
                        <td>
                          {x.ok
                            ? <a href={`/pos/${x.id}`} onClick={(e) => { e.preventDefault(); nav(`/pos/${x.id}`); }}>{x.codigoPO} criada</a>
                            : <span className="erro">{typeof x.erro === 'string' ? x.erro : Object.entries(x.erro).map(([k, v]) => `${k}: ${v.join(', ')}`).join(' · ')}</span>}
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
            <h2 style={{ margin: 0 }}>2. Máquina</h2>
            <div className="grid">
              {maquinas.map((m) => (
                <button key={m.codigo} type="button" onClick={() => { setDemanda({ ...demanda, maquina: m.codigo }); setErros({}); }}
                  style={{ textAlign: 'left', padding: 18, border: demanda.maquina === m.codigo ? '3px solid #222' : '1px solid #888', background: demanda.maquina === m.codigo ? '#ececec' : '#fff' }}>
                  <div className="muted">Cód. {m.codigo}</div>
                  <strong style={{ fontSize: 18 }}>{m.descricao}</strong>
                  <div>RPM {m.rpmPadrao}</div>
                </button>
              ))}
            </div>
            {erros.maquina && <span className="erro">{erros.maquina}</span>}
          </>
        )}

        {etapa === 2 && (
          <>
            <h2 style={{ margin: 0 }}>3. Procedimentos (MTM)</h2>
            <p className="muted" style={{ margin: 0 }}>Adicione na ordem de execução. A costura de máquina (FIXO) entra automaticamente.</p>
            <div className="row" style={{ justifyContent: 'flex-start' }}>
              <select value={add} onChange={(e) => setAdd(e.target.value)} style={{ flex: '1 1 320px' }}>
                {catalogo.map((e) => <option key={e.codigo} value={e.codigo}>{e.codigo} — {e.descricao}</option>)}
              </select>
              <button type="button" onClick={() => { elementos([...demanda.elementos, { codigo: add, frequencia: 1 }]); setErros({}); }}>+ Adicionar</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Código</th><th>Descrição</th><th>Freq.</th><th /></tr></thead>
                <tbody>
                  {demanda.elementos.map((el, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td><td>{el.codigo}</td><td>{elemento(el.codigo)?.descricao}</td>
                      <td>
                        <input type="number" min="1" step="1" value={el.frequencia} style={{ width: 70 }}
                          onChange={(e) => elementos(demanda.elementos.map((x, j) => (j === i ? { ...x, frequencia: Number(e.target.value) } : x)))} />
                      </td>
                      <td className="num"><button type="button" onClick={() => elementos(demanda.elementos.filter((_, j) => j !== i))}>✕</button></td>
                    </tr>
                  ))}
                  {!demanda.elementos.length && <tr><td colSpan={5} className="muted">Nenhum procedimento adicionado.</td></tr>}
                </tbody>
              </table>
            </div>
            {erros.elementos && <span className="erro">{erros.elementos}</span>}
          </>
        )}

        {etapa === 3 && (
          <>
            <h2 style={{ margin: 0 }}>4. Revisar e gerar</h2>
            <p className="muted" style={{ margin: 0 }}>Confira os dados. Os tempos são calculados ao gerar a PO.</p>
            <div className="table-wrap">
              <table>
                <tbody>
                  <tr><th>Operação</th><td colSpan={3}>{demanda.operacao}</td></tr>
                  <tr><th>Agrupamento família</th><td>{demanda.familia}</td><th>Tamanho</th><td>{demanda.tamanho}</td></tr>
                  <tr><th>Medidas da peça (em m)</th><td>{demanda.medidas}</td><th>Pontos/cm</th><td>{demanda.pontosCm}</td></tr>
                  <tr><th>Perímetro costura (em m)</th><td colSpan={3}>{demanda.perimetroM}</td></tr>
                  <tr><th>Máquina</th><td colSpan={3}>{maquinaSel?.codigo} · {maquinaSel?.descricao}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Código</th><th>Procedimento</th><th>Freq.</th></tr></thead>
                <tbody>
                  {demanda.elementos.map((el, i) => <tr key={i}><td>{i + 1}</td><td>{el.codigo}</td><td>{elemento(el.codigo)?.descricao}</td><td>{el.frequencia}</td></tr>)}
                </tbody>
              </table>
            </div>
          </>
        )}
        {erro && <span className="erro">{erro}</span>}
      </section>

      <div className="row">
        <div>{etapa > 0 && <button onClick={() => irPara(etapa - 1)}>← Voltar</button>}</div>
        <div>
          {etapa < 3 && <button className="primary" onClick={avancar}>Próximo →</button>}
          {etapa === 3 && <button className="primary" onClick={gerar} disabled={enviando}>{enviando ? 'Gerando…' : 'Gerar PO'}</button>}
        </div>
      </div>
    </>
  );
}
