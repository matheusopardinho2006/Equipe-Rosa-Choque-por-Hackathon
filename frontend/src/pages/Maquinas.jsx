import { useEffect, useState } from 'react';
import { maquinasApi, erroMsg } from '../services/api';
import TabelaCrud from '../components/TabelaCrud';
import { min4 } from '../utils/format';

const vazio = { codigo: '', descricao: '', rpmPadrao: '', rpmMin: '', rpmMax: '', tempoPorMetro: '' };

export default function Maquinas() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState('');

  const carregar = () => maquinasApi.listar().then(setLista).catch((e) => setErro(erroMsg(e)));
  useEffect(() => { carregar(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function salvar(e) {
    e.preventDefault();
    const dados = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '' && v != null));
    try {
      if (editando) await maquinasApi.atualizar(editando, dados);
      else await maquinasApi.criar(dados);
      setForm(vazio); setEditando(null); setErro(''); carregar();
    } catch (err) { setErro(erroMsg(err)); }
  }

  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <section className="card" style={{ flex: '999 1 420px', minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Máquinas</h1>
        <TabelaCrud
          colunas={[
            { campo: 'codigo', titulo: 'Cód.' },
            { campo: 'descricao', titulo: 'Descrição/Modelo' },
            { campo: 'rpmPadrao', titulo: 'RPM', num: true },
            { campo: 'tempoPorMetro', titulo: 'min/m', num: true, formatar: min4 },
          ]}
          linhas={lista}
          onEditar={(m) => { setForm({ ...vazio, ...m }); setEditando(m.codigo); }}
          onExcluir={async (m) => { if (confirm(`Excluir máquina ${m.codigo}?`)) { await maquinasApi.remover(m.codigo); carregar(); } }}
        />
      </section>

      <form className="card" style={{ flex: '1 1 300px' }} onSubmit={salvar}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{editando ? `Editar máquina ${editando}` : 'Nova máquina'}</h2>
        <label>Código<input value={form.codigo} onChange={set('codigo')} disabled={!!editando} /></label>
        <label>Descrição/Modelo<input value={form.descricao} onChange={set('descricao')} /></label>
        <label>RPM padrão<input value={form.rpmPadrao} onChange={set('rpmPadrao')} /></label>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <label>RPM mín.<input value={form.rpmMin ?? ''} onChange={set('rpmMin')} /></label>
          <label>RPM máx.<input value={form.rpmMax ?? ''} onChange={set('rpmMax')} /></label>
        </div>
        <label>Tempo por metro (min/m)<input value={form.tempoPorMetro} onChange={set('tempoPorMetro')} /></label>
        <span className="muted">RPM mín./máx. em branco = padrão ± 10%.</span>
        {erro && <span className="erro">{erro}</span>}
        <div className="row">
          <button type="button" onClick={() => { setForm(vazio); setEditando(null); }}>Limpar</button>
          <button className="primary">Salvar</button>
        </div>
      </form>
    </div>
  );
}
