import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';

const { elementosApi, posApi, erroMsg, maquinasApi } = api;

const vazio = { codigo: '', descricao: '', tempo: '' };

export default function Dashboard() {
  const [elementos, setElementos] = useState([]);
  const [qtdPOs, setQtdPOs] = useState(0);
  const [qtdMaquinas, setQtdMaquinas] = useState(0);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const fileInputRef = useRef(null);

  const carregar = () => {
    elementosApi
      ?.listar()
      .then(setElementos)
      .catch((e) =>
        setErro(erroMsg ? erroMsg(e) : 'Erro ao listar elementos MTM.')
      );
  };

  useEffect(() => {
    carregar();
    posApi
      ?.listar()
      .then((p) => setQtdPOs(p.length))
      .catch(() => {});
    if (maquinasApi?.listar) {
      maquinasApi
        .listar()
        .then((m) => setQtdMaquinas(m.length))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (erro || sucesso) {
      const timer = setTimeout(() => {
        setErro('');
        setSucesso('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [erro, sucesso]);

  async function salvar(e) {
    e.preventDefault();
    try {
      if (editando) {
        await elementosApi.atualizar(editando, form);
        setSucesso('Elemento MTM atualizado com sucesso!');
      } else {
        await elementosApi.criar(form);
        setSucesso('Elemento MTM criado com sucesso!');
      }
      setForm(null);
      setEditando(null);
      carregar();
    } catch (err) {
      setErro(erroMsg ? erroMsg(err) : 'Erro ao salvar elemento.');
    }
  }

  async function excluir(el) {
    if (!confirm(`Excluir elemento ${el.codigo}?`)) return;
    try {
      await elementosApi.remover(el.codigo);
      setSucesso(`Elemento ${el.codigo} removido.`);
      carregar();
    } catch (e) {
      setErro(erroMsg ? erroMsg(e) : 'Erro ao excluir elemento.');
    }
  }

  async function importar(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const r = await elementosApi.importar(f);
      if (r) {
        const falhas =
          r.erros?.map(
            (x) =>
              `linha ${x.linha}: ${Object.entries(x.erro)
                .map(([k, v]) => `${k} (${v.join(', ')})`)
                .join('; ')}`
          ) || [];
        alert(
          `${r.inseridos || 0} novo(s), ${r.atualizados || 0} atualizado(s), ${
            r.erros?.length || 0
          } com erro.${falhas.length ? '\n\n' + falhas.join('\n') : ''}`
        );
        setSucesso('Arquivo importado com sucesso!');
      }
    } catch (err) {
      setErro(erroMsg ? erroMsg(err) : 'Erro ao importar arquivo.');
    } finally {
      e.target.value = '';
      carregar();
    }
  }

  const elementosFiltrados = elementos.filter((el) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      String(el.codigo || '')
        .toLowerCase()
        .includes(termo) ||
      String(el.descricao || '')
        .toLowerCase()
        .includes(termo) ||
      String(el.agrupador || '')
        .toLowerCase()
        .includes(termo)
    );
  });

  return (
    <div className="bg-[#F2F1EE] rounded-[28px] p-6">
      {/* Alertas Flutuantes */}
      {(erro || sucesso) && (
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
          {erro && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl shadow-md text-xs">
              {erro}
            </div>
          )}
          {sucesso && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl shadow-md text-xs">
              {sucesso}
            </div>
          )}
        </div>
      )}

      {/* Título Principal */}
      <h1 className="text-3xl font-normal text-[#686562] mb-5">Dashboard</h1>

      {/* 4 Cards Superiores (Elementos MTM, Máquinas, POs gerados, + Criar demandas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 text-center flex flex-col justify-between min-h-[96px]">
          <span className="text-base text-[#686562]">Elementos MTM</span>
          <span className="text-lg font-medium text-[#686562] mt-2">
            {elementos.length}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 text-center flex flex-col justify-between min-h-[96px]">
          <span className="text-base text-[#686562]">Máquinas</span>
          <span className="text-lg font-medium text-[#686562] mt-2">
            {qtdMaquinas}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 text-center flex flex-col justify-between min-h-[96px]">
          <span className="text-base text-[#686562]">POs gerados</span>
          <span className="text-lg font-medium text-[#686562] mt-2">
            {qtdPOs}
          </span>
        </div>

        <Link
          to="/nova-po"
          className="bg-[#686562] hover:bg-[#55524F] text-white rounded-2xl p-4 text-center flex flex-col justify-center items-center text-lg font-normal leading-snug transition-colors cursor-pointer min-h-[96px]"
        >
          <span>+ Criar</span>
          <span>demandas</span>
        </Link>
      </div>

      {/* Container Branco Interno: Elementos padrão (MTM) */}
      <section className="bg-white rounded-3xl p-5">
        {/* Barra de Ferramentas */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-normal text-[#686562]">
            Elementos padrão (MTM)
          </h2>

          <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar código ou descrição"
              className="bg-[#F2F1EE] text-[#686562] placeholder-[#686562] text-xs rounded-full px-5 py-2.5 w-60 focus:outline-none focus:ring-1 focus:ring-[#686562]"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={importar}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#F2F1EE] hover:bg-[#E5E3DD] text-[#55524F] text-xs rounded-full px-4 py-2.5 transition-colors cursor-pointer"
            >
              Importar Exel/CSV
            </button>

            <button
              type="button"
              onClick={() => {
                setForm(vazio);
                setEditando(null);
              }}
              className="bg-[#686562] hover:bg-[#55524F] text-white text-xs rounded-full px-4 py-2.5 transition-colors cursor-pointer"
            >
              + Novo Elemento
            </button>
          </div>
        </div>

        {/* Tabela de Elementos MTM */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#F2F1EE] text-[#686562]">
                <th className="py-3 px-4 text-center font-normal rounded-tl-2xl w-24">
                  Código
                </th>
                <th className="py-3 px-4 text-center font-normal w-36">
                  Agrupador
                </th>
                <th className="py-3 px-4 text-left font-normal pl-8">
                  Descrição
                </th>
                <th className="py-3 px-4 text-center font-normal w-36">
                  Tempo (min)
                </th>
                <th className="py-3 px-4 text-center font-normal rounded-tr-2xl w-44">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {elementosFiltrados.map((el) => {
                return (
                  <tr
                    key={el.codigo || el.id}
                    className="hover:bg-[#FAF9F7] transition-colors text-[#686562]"
                  >
                    <td className="py-2.5 px-4 text-center">{el.codigo}</td>
                    <td className="py-2.5 px-4 text-center">
                      {el.agrupador ? `Agrupador ${el.agrupador}` : 'Agrupador'}
                    </td>
                    <td className="py-2.5 px-4 text-left pl-8">{el.descricao}</td>
                    <td className="py-2.5 px-4 text-center">{el.tempo}</td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setForm({
                              codigo: el.codigo,
                              descricao: el.descricao,
                              tempo: el.tempo,
                            });
                            setEditando(el.codigo);
                          }}
                          className="bg-[#686562] hover:bg-[#55524F] text-white text-xs px-3.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => excluir(el)}
                          className="bg-[#686562] hover:bg-red-700 text-white text-xs px-3.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {elementosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#9E9B97]">
                    Nenhum elemento MTM encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de Cadastro / Edição de Elemento MTM */}
      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-[#C8C6C1]">
            <h3 className="text-lg font-bold text-[#222222] mb-4">
              {editando ? `Editar Elemento (${editando})` : 'Novo Elemento MTM'}
            </h3>

            <form onSubmit={salvar} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#686562] mb-1">
                  Código (agrupador.elemento)
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editando}
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="Ex.: 2.1"
                  className="w-full bg-[#F2F1EE] border border-[#C8C6C1] rounded-xl px-3 py-2 text-sm text-[#222222] focus:outline-none focus:border-[#686562] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#686562] mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  placeholder="Ex.: Apanhar e posicionar peça"
                  className="w-full bg-[#F2F1EE] border border-[#C8C6C1] rounded-xl px-3 py-2 text-sm text-[#222222] focus:outline-none focus:border-[#686562]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#686562] mb-1">
                  Tempo (min)
                </label>
                <input
                  type="text"
                  required
                  value={form.tempo}
                  onChange={(e) => setForm({ ...form, tempo: e.target.value })}
                  placeholder="Ex.: 0,15"
                  className="w-full bg-[#F2F1EE] border border-[#C8C6C1] rounded-xl px-3 py-2 text-sm text-[#222222] focus:outline-none focus:border-[#686562]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm(null);
                    setEditando(null);
                  }}
                  className="px-4 py-2 text-xs rounded-full bg-[#F2F1EE] text-[#55524F] hover:bg-[#E5E3DD] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs rounded-full bg-[#686562] hover:bg-[#55524F] text-white cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
