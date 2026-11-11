import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { elementosApi, maquinasApi, posApi, erroMsg } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { min4 } from '../utils/format';

// Tela inicial: Cadastro de POs (números do sistema + histórico de POs geradas)
export default function Dashboard() {
  const nav = useNavigate();
  const { isAdm } = useAuth() || {};
  const [pos, setPos] = useState([]);
  const [qtdMaquinas, setQtdMaquinas] = useState(0);
  const [qtdElementos, setQtdElementos] = useState(0);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');

  const carregar = () => posApi.listar().then(setPos).catch((e) => setErro(erroMsg(e)));

  useEffect(() => {
    carregar();
    maquinasApi.listar().then((m) => setQtdMaquinas(m.length)).catch(() => {});
    elementosApi.listar().then((l) => setQtdElementos(l.length)).catch(() => {});
  }, []);

  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return pos;
    return pos.filter((p) =>
      [p.codigoPO, p.operacao, p.familia, p.tamanho, p.maquina?.descricao]
        .some((v) => String(v || '').toLowerCase().includes(t))
    );
  }, [pos, busca]);

  async function excluir(e, p) {
    e.stopPropagation();
    if (!confirm(`Excluir ${p.codigoPO} Rev. ${p.revisao}? Esta ação não pode ser desfeita.`)) return;
    try {
      await posApi.remover(p._id);
      setErro('');
      carregar();
    } catch (err) {
      setErro(erroMsg(err));
    }
  }

  const cards = [
    { titulo: 'POs geradas', valor: pos.length },
    { titulo: 'Máquinas', valor: qtdMaquinas, to: '/maquinas' },
    { titulo: 'Elementos MTM', valor: qtdElementos, to: '/elementos' },
  ];

  return (
    <div className="bg-[#F2F1EE] rounded-[28px] p-6">
      <div className="mb-5">
        <h1 className="text-3xl font-normal text-[#686562]">Cadastro de POs</h1>
        <p className="text-sm text-[#686562] mt-1">Crie novas fichas de Processo Operacional e consulte as já geradas</p>
      </div>

      {/* Números do sistema + criar PO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => {
          const conteudo = (
            <>
              <span className="text-base text-[#686562]">{c.titulo}</span>
              <span className="text-2xl font-medium text-[#686562] mt-2">{c.valor}</span>
            </>
          );
          const cls = 'bg-white rounded-2xl p-4 text-center flex flex-col justify-between min-h-[96px]';
          return c.to ? (
            <Link key={c.titulo} to={c.to} className={`${cls} hover:bg-[#FAF9F7] transition-colors`}>{conteudo}</Link>
          ) : (
            <div key={c.titulo} className={cls}>{conteudo}</div>
          );
        })}
        <Link
          to="/nova-po"
          className="bg-[#686562] hover:bg-[#55524F] text-white rounded-2xl p-4 text-center flex flex-col justify-center items-center text-lg leading-snug transition-colors min-h-[96px]"
        >
          <span className="text-2xl leading-none">+</span>
          <span>Nova PO</span>
        </Link>
      </div>

      {erro && (
        <div className="mb-4 text-xs text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">{erro}</div>
      )}

      {/* Histórico de POs */}
      <section className="bg-white rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-normal text-[#686562]">Histórico de POs</h2>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar PO, operação, família ou máquina"
            className="bg-[#F2F1EE] text-[#686562] placeholder-[#9E9B97] text-xs rounded-full px-5 py-2.5 w-72 max-w-full focus:outline-none focus:ring-1 focus:ring-[#686562]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[760px]">
            <thead>
              <tr className="bg-[#F2F1EE] text-[#686562]">
                <th className="py-3 px-4 text-left font-normal rounded-tl-2xl">PO</th>
                <th className="py-3 px-4 text-left font-normal">Operação</th>
                <th className="py-3 px-4 text-left font-normal">Família · Tamanho</th>
                <th className="py-3 px-4 text-left font-normal">Máquina</th>
                <th className="py-3 px-4 text-right font-normal">TP (min)</th>
                <th className="py-3 px-4 text-right font-normal">Data</th>
                <th className="py-3 px-4 text-center font-normal rounded-tr-2xl w-40">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((p) => (
                <tr
                  key={p._id}
                  onClick={() => nav(`/pos/${p._id}`)}
                  className="hover:bg-[#FAF9F7] transition-colors text-[#686562] cursor-pointer border-b border-[#F2F1EE]"
                >
                  <td className="py-2.5 px-4 font-medium text-[#222222] whitespace-nowrap">
                    {p.codigoPO} <span className="text-xs text-[#9E9B97]">Rev. {p.revisao}</span>
                  </td>
                  <td className="py-2.5 px-4">{p.operacao}</td>
                  <td className="py-2.5 px-4">{p.familia} · {p.tamanho}</td>
                  <td className="py-2.5 px-4 whitespace-nowrap">{p.maquina?.codigo} · {p.maquina?.descricao}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{min4(p.tp)}</td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); nav(`/pos/${p._id}`); }}
                      className="bg-[#686562] hover:bg-[#55524F] text-white text-xs px-3.5 py-1 rounded-full transition-colors"
                    >
                      Abrir
                    </button>{' '}
                    {isAdm && (
                      <button
                        type="button"
                        onClick={(e) => excluir(e, p)}
                        className="bg-[#686562] hover:bg-red-700 text-white text-xs px-3.5 py-1 rounded-full transition-colors"
                      >
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#9E9B97]">
                    {pos.length ? 'Nenhuma PO encontrada para essa busca.' : 'Nenhuma PO gerada ainda. Clique em "+ Nova PO" para começar.'}
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
