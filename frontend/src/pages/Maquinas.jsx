import { useEffect, useState, useRef, useMemo } from 'react';
import { maquinasApi, erroMsg } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { min4 } from '../utils/format';

const vazio = {
  codigo: '',
  descricao: '',
  rpmPadrao: '',
  rpmMin: '',
  rpmMax: '',
  tempoPorMetro: '',
};

export default function Maquinas() {
  const { isAdm } = useAuth() || { isAdm: true };
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState('');
  const [modeloFiltro, setModeloFiltro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState('');
  const fileInputRef = useRef(null);

  const carregar = () =>
    maquinasApi
      .listar()
      .then(setLista)
      .catch((e) => setErro(erroMsg(e)));

  useEffect(() => {
    carregar();
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Lista única de modelos para o filtro dropdown
  const modelosDisponiveis = useMemo(() => {
    const setModelos = new Set(lista.map((m) => m.descricao).filter(Boolean));
    return Array.from(setModelos);
  }, [lista]);

  // Filtragem por busca e modelo selecionado
  const maquinasFiltradas = useMemo(() => {
    return lista.filter((m) => {
      const termo = busca.trim().toLowerCase();
      const bateBusca =
        !termo ||
        String(m.codigo).toLowerCase().includes(termo) ||
        String(m.descricao || '').toLowerCase().includes(termo);
      const bateModelo = !modeloFiltro || m.descricao === modeloFiltro;
      return bateBusca && bateModelo;
    });
  }, [lista, busca, modeloFiltro]);

  async function salvar(e) {
    e.preventDefault();
    const dados = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== '' && v != null)
    );
    try {
      if (editando) await maquinasApi.atualizar(editando, dados);
      else await maquinasApi.criar(dados);
      setForm(vazio);
      setEditando(null);
      setModalAberto(false);
      setErro('');
      carregar();
    } catch (err) {
      setErro(erroMsg(err));
    }
  }

  function abrirNovaMaquina() {
    setForm(vazio);
    setEditando(null);
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(m) {
    setForm({ ...vazio, ...m });
    setEditando(m.codigo);
    setErro('');
    setModalAberto(true);
  }

  async function excluir(m) {
    if (!confirm(`Excluir máquina ${m.codigo} (${m.descricao})?`)) return;
    try {
      await maquinasApi.remover(m.codigo);
      carregar();
    } catch (err) {
      setErro(erroMsg(err));
    }
  }

  async function importarPlanilha(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    try {
      const texto = await arquivo.text();
      const linhas = texto
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(/[;,]/).map((c) => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 4) {
          const [codigo, descricao, rpmPadrao, tempoPorMetro, rpmMin, rpmMax] = cols;
          await maquinasApi
            .criar({
              codigo,
              descricao,
              rpmPadrao,
              tempoPorMetro,
              ...(rpmMin ? { rpmMin } : {}),
              ...(rpmMax ? { rpmMax } : {}),
            })
            .catch(() => null);
        }
      }
      carregar();
    } catch (err) {
      setErro(erroMsg(err));
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div className="pt-2 px-2">
      {/* Cabeçalho: Título + Subtítulo à esquerda | Botões empilhados à direita */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-[#000000] leading-tight">
            Máquinas
          </h1>
          <p className="text-sm text-[#222222] mt-1 max-w-md leading-snug">
            Gerencie o cadastro das máquinas disponíveis
            <br />
            no sistema
          </p>
        </div>

        <div className="flex flex-col gap-3 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={importarPlanilha}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-white hover:bg-[#F2F1EE] border border-[#555555] text-[#111111] rounded-xl px-5 py-2.5 text-sm font-normal w-44 text-center transition-colors cursor-pointer"
          >
            Importar Excel/CSV
          </button>

          <button
            type="button"
            onClick={abrirNovaMaquina}
            className="bg-[#736F6B] hover:bg-[#5E5A56] border border-[#4A4744] text-white rounded-xl px-5 py-2.5 text-sm font-normal w-44 text-center transition-colors cursor-pointer"
          >
            Nova máquina
          </button>
        </div>
      </div>

      {/* Linha de Filtros: Busca + Select de Modelos */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Busca por código,modelo ou descrição"
          className="bg-[#F2F1EE] border border-[#686562] rounded-xl px-5 py-2 text-sm text-[#333333] placeholder-[#736F6B] flex-1 min-w-[260px] max-w-[460px] focus:outline-none focus:border-[#222222]"
        />

        <select
          value={modeloFiltro}
          onChange={(e) => setModeloFiltro(e.target.value)}
          className="bg-[#F2F1EE] border border-[#686562] rounded-xl px-4 py-2 text-sm text-[#222222] w-48 focus:outline-none focus:border-[#222222] cursor-pointer"
        >
          <option value="">Todos os modelos</option>
          {modelosDisponiveis.map((mod) => (
            <option key={mod} value={mod}>
              {mod}
            </option>
          ))}
        </select>
      </div>

      {erro && !modalAberto && (
        <div className="mb-4 text-xs text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">
          {erro}
        </div>
      )}

      {/* Tabela de Máquinas Fiel ao Mockup */}
      <div className="bg-[#F2F1EE] rounded-2xl overflow-hidden min-h-[280px]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#D9D9D9] text-[#1E1E1E] divide-x divide-[#ECECEC]">
                <th className="py-4 px-4 text-center font-normal w-24">Código</th>
                <th className="py-4 px-4 text-center font-normal">Modelo</th>
                <th className="py-4 px-4 text-center font-normal">RPM Padrão</th>
                <th className="py-4 px-4 text-center font-normal">RPM Mín.</th>
                <th className="py-4 px-4 text-center font-normal">RPM Máx.</th>
                <th className="py-4 px-4 text-center font-normal">Tempo por metro</th>
                {isAdm && (
                  <th className="py-4 px-4 text-center font-normal w-36">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E0D8]">
              {maquinasFiltradas.map((m) => {
                const rpmMin = m.rpmMin ?? Math.round((m.rpmPadrao || 0) * 0.9);
                const rpmMax = m.rpmMax ?? Math.round((m.rpmPadrao || 0) * 1.1);
                return (
                  <tr
                    key={m.codigo}
                    className="hover:bg-[#EAE8E3] transition-colors text-[#111111]"
                  >
                    <td className="py-5 px-4 text-center">{m.codigo}</td>
                    <td className="py-5 px-4 text-center">{m.descricao}</td>
                    <td className="py-5 px-4 text-center">{m.rpmPadrao}</td>
                    <td className="py-5 px-4 text-center">{rpmMin}</td>
                    <td className="py-5 px-4 text-center">{rpmMax}</td>
                    <td className="py-5 px-4 text-center">
                      {min4(m.tempoPorMetro)}m
                    </td>
                    {isAdm && (
                      <td className="py-5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirEdicao(m)}
                            className="bg-[#686562] hover:bg-[#55524F] text-white text-xs px-3 py-1 rounded-full transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => excluir(m)}
                            className="bg-[#686562] hover:bg-red-700 text-white text-xs px-3 py-1 rounded-full transition-colors cursor-pointer"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {maquinasFiltradas.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdm ? 7 : 6}
                    className="py-10 text-center text-[#736F6B]"
                  >
                    Nenhuma máquina encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro / Edição de Máquina */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-[#C8C6C1]">
            <h2 className="text-lg font-bold text-[#222222] mb-4">
              {editando ? `Editar máquina ${editando}` : 'Nova máquina'}
            </h2>

            <form onSubmit={salvar} className="space-y-3.5">
              <div>
                <label className="block text-xs text-[#686562] mb-1">Código</label>
                <input
                  value={form.codigo}
                  onChange={set('codigo')}
                  disabled={!!editando}
                  required
                  className="w-full bg-[#F2F1EE] border border-[#C8C6C1] rounded-xl px-3 py-2 text-sm disabled:opacity-60 focus:outline-none focus:border-[#736F6B]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#686562] mb-1">
                  Modelo / Descrição
                </label>
                <input
                  value={form.descricao}
                  onChange={set('descricao')}
                  required
                  placeholder="Ex.: Reta, Interlock, Overloque"
                  className="w-full bg-[#F2F1EE] border border-[#C8C6C1] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#736F6B]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#686562] mb-1">RPM Padrão</label>
                <input
                  value={form.rpmPadrao}
                  onChange={set('rpmPadrao')}
                  required
                  placeholder="Ex.: 4000"
                  className="w-full bg-[#F2F1EE] border border-[#C8C6C1] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#736F6B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#686562] mb-1">RPM Mín.</label>
                  <input
                    value={form.rpmMin ?? ''}
                    onChange={set('rpmMin')}
                    placeholder="Padrão - 10%"
                    className="w-full bg-[#F2F1EE] border border-[#C8C6C1] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#736F6B]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#686562] mb-1">RPM Máx.</label>
                  <input
                    value={form.rpmMax ?? ''}
                    onChange={set('rpmMax')}
                    placeholder="Padrão + 10%"
                    className="w-full bg-[#F2F1EE] border border-[#C8C6C1] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#736F6B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#686562] mb-1">
                  Tempo por metro (min/m)
                </label>
                <input
                  value={form.tempoPorMetro}
                  onChange={set('tempoPorMetro')}
                  required
                  placeholder="Ex.: 0,0850"
                  className="w-full bg-[#F2F1EE] border border-[#C8C6C1] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#736F6B]"
                />
              </div>

              <p className="text-[11px] text-[#736F6B]">
                RPM mín./máx. em branco = calculado automaticamente (padrão ± 10%).
              </p>

              {erro && <div className="text-xs text-red-700">{erro}</div>}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalAberto(false);
                    setEditando(null);
                    setErro('');
                  }}
                  className="px-4 py-2 text-xs rounded-full bg-[#F2F1EE] text-[#55524F] hover:bg-[#E5E3DD] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs rounded-full bg-[#736F6B] hover:bg-[#5E5A56] text-white cursor-pointer"
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
