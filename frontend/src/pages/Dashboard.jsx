import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { elementosApi, posApi, erroMsg } from '../services/api';
import TabelaCrud from '../components/TabelaCrud';
import { min4 } from '../utils/format';

const vazio = { codigo: '', descricao: '', tempo: '' };

export default function Dashboard() {
  const [elementos, setElementos] = useState([]);
  const [qtdPOs, setQtdPOs] = useState(0);
  const [form, setForm] = useState(null); // null = fechado
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState('');

  const carregar = () => elementosApi.listar().then(setElementos).catch((e) => setErro(erroMsg(e)));
  useEffect(() => {
    carregar();
    posApi.listar().then((p) => setQtdPOs(p.length)).catch(() => {});
  }, []);

  async function salvar(e) {
    e.preventDefault();
    try {
      if (editando) await elementosApi.atualizar(editando, form);
      else await elementosApi.criar(form);
      setForm(null); setEditando(null); carregar();
    } catch (err) { setErro(erroMsg(err)); }
  }

  async function excluir(el) {
    if (!confirm(`Excluir elemento ${el.codigo}?`)) return;
    await elementosApi.remover(el.codigo).catch((e) => setErro(erroMsg(e)));
    carregar();
  }

  async function importar(e) {
    const f = e.target.files[0];
    if (!f) return;
    const r = await elementosApi.importar(f).catch((err) => setErro(erroMsg(err)));
    if (r) {
      const falhas = r.erros.map((x) => `linha ${x.linha}: ${Object.entries(x.erro).map(([k, v]) => `${k} (${v.join(', ')})`).join('; ')}`);
      alert(`${r.inseridos} novo(s), ${r.atualizados} atualizado(s), ${r.erros.length} com erro.${falhas.length ? '\n\n' + falhas.join('\n') : ''}`);
    }
    e.target.value = '';
    carregar();
  }

  return (
    <>
      <h1 style={{ margin: 0 }}>Dashboard</h1>
      <div className="grid">
        <div className="card"><span className="muted">Elementos MTM</span><strong style={{ fontSize: 28 }}>{elementos.length}</strong></div>
        <div className="card"><span className="muted">POs geradas</span><strong style={{ fontSize: 28 }}>{qtdPOs}</strong></div>
        <Link to="/nova-po" className="card" style={{ background: '#222', color: '#fff', textDecoration: 'none', justifyContent: 'center', alignItems: 'center' }}>+ Criar demanda</Link>
      </div>

      <section className="card">
        <div className="row">
          <h2 style={{ margin: 0, fontSize: 18 }}>Elementos padrão (MTM)</h2>
          <div className="row">
            <label style={{ flexDirection: 'row', alignItems: 'center' }}>Importar <input type="file" accept=".xlsx,.xls,.csv" onChange={importar} /></label>
            <button className="primary" onClick={() => { setForm(vazio); setEditando(null); }}>+ Novo elemento</button>
          </div>
        </div>
        {erro && <span className="erro">{erro}</span>}

        {form && (
          <form onSubmit={salvar} className="grid" style={{ border: '2px dashed #888', padding: 16 }}>
            <label>Código (agrupador.elemento)<input value={form.codigo} disabled={!!editando} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="7.1" /></label>
            <label>Descrição<input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></label>
            <label>Tempo (min)<input value={form.tempo} onChange={(e) => setForm({ ...form, tempo: e.target.value })} placeholder="0,18" /></label>
            <div className="row" style={{ alignSelf: 'end' }}>
              <button type="button" onClick={() => setForm(null)}>Cancelar</button>
              <button className="primary">Salvar</button>
            </div>
          </form>
        )}

        <TabelaCrud
          colunas={[
            { campo: 'codigo', titulo: 'Código' },
            { campo: 'descricao', titulo: 'Descrição' },
            { campo: 'tempo', titulo: 'Tempo (min)', num: true, formatar: min4 },
          ]}
          linhas={elementos}
          onEditar={(el) => { setForm({ codigo: el.codigo, descricao: el.descricao, tempo: el.tempo }); setEditando(el.codigo); }}
          onExcluir={excluir}
        />
      </section>
    </>
  );
}
