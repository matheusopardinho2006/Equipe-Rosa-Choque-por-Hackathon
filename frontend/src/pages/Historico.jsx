import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { posApi, erroMsg } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { min4 } from '../utils/format';

export default function Historico() {
  const nav = useNavigate();
  const { isAdm } = useAuth();
  const [pos, setPos] = useState([]);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');

  const carregar = () => posApi.listar({ busca: busca || undefined }).then(setPos).catch((e) => setErro(erroMsg(e)));
  useEffect(() => { carregar(); }, [busca]);

  async function excluir(p) {
    if (!confirm(`Excluir ${p.codigoPO} Rev. ${p.revisao}? Esta ação não pode ser desfeita.`)) return;
    try {
      await posApi.remover(p._id);
      setErro('');
      carregar();
    } catch (e) { setErro(erroMsg(e)); }
  }

  return (
    <section className="card">
      <div className="row">
        <h1 style={{ margin: 0, fontSize: 22 }}>Histórico de POs</h1>
        <input placeholder="Buscar PO ou família" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      {erro && <span className="erro">{erro}</span>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>PO / Rev.</th><th>Agrupamento família</th><th>Tamanho</th><th>Máquina</th><th className="num">TP (min)</th><th>Data</th><th className="num">Ações</th></tr></thead>
          <tbody>
            {pos.map((p) => (
              <tr key={p._id}>
                <td><Link to={`/pos/${p._id}`}>{p.codigoPO} · Rev. {p.revisao}</Link></td>
                <td>{p.familia}</td><td>{p.tamanho || '—'}</td><td>{p.maquina?.codigo} · {p.maquina?.descricao}</td>
                <td className="num">{min4(p.tp)}</td><td>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="num" style={{ whiteSpace: 'nowrap' }}>
                  <button onClick={() => nav(`/pos/${p._id}`)}>Analisar</button>{' '}
                  {isAdm && <button onClick={() => excluir(p)}>Excluir</button>}
                </td>
              </tr>
            ))}
            {!pos.length && <tr><td colSpan={7} className="muted">Nenhuma PO encontrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
