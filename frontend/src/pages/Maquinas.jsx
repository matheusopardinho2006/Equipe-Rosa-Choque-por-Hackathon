import { useEffect, useMemo, useRef, useState } from 'react';
import { maquinasApi, erroMsg } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { min4 } from '../utils/format';

import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

const vazio = {
  codigo: '',
  descricao: '',
  rpmPadrao: '',
  rpmMin: '',
  rpmMax: '',
  tempoPorMetro: '',
};

export default function Maquinas() {
  const { isAdm } = useAuth() || {};

  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState('');
  const [modeloFiltro, setModeloFiltro] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState(null);

  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [importando, setImportando] = useState(false);

  const fileInputRef = useRef(null);

  const carregar = () =>
    maquinasApi
      .listar()
      .then(setLista)
      .catch((e) => setErro(erroMsg(e)));

  useEffect(() => {
    carregar();
  }, []);

  const set = (campo) => (e) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: e.target.value,
    }));
  };

  // Modelos disponíveis para filtragem
  const modelosDisponiveis = useMemo(
    () =>
      [
        ...new Set(
          lista.map((m) => m.descricao).filter(Boolean)
        ),
      ].sort(),
    [lista]
  );

  // Busca e filtro
  const maquinasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return lista.filter(
      (m) =>
        (!termo ||
          String(m.codigo ?? '')
            .toLowerCase()
            .includes(termo) ||
          String(m.descricao ?? '')
            .toLowerCase()
            .includes(termo)) &&
        (!modeloFiltro || m.descricao === modeloFiltro)
    );
  }, [lista, busca, modeloFiltro]);

  // Criar ou atualizar máquina
  async function salvar(e) {
    e.preventDefault();

    if (salvando) return;

    const dados = Object.fromEntries(
      Object.entries(form).filter(
        ([, valor]) => valor !== '' && valor != null
      )
    );

    setSalvando(true);

    try {
      if (editando !== null) {
        await maquinasApi.atualizar(editando, dados);
      } else {
        await maquinasApi.criar(dados);
      }

      await carregar();

      setForm(vazio);
      setEditando(null);
      setModalAberto(false);
      setErro('');
    } catch (err) {
      setErro(erroMsg(err));
    } finally {
      setSalvando(false);
    }
  }

  function abrirNovaMaquina() {
    setForm(vazio);
    setEditando(null);
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(maquina) {
    setForm({
      ...vazio,
      ...maquina,
    });

    setEditando(maquina.codigo);
    setErro('');
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
    setErro('');
  }

  // Excluir máquina
  async function excluir(maquina) {
    const confirmado = window.confirm(
      `Excluir máquina ${maquina.codigo} (${maquina.descricao})?`
    );

    if (!confirmado) return;

    try {
      await maquinasApi.remover(maquina.codigo);
      await carregar();
      setErro('');
    } catch (err) {
      setErro(erroMsg(err));
    }
  }

  // Importar Excel/CSV: o backend lê o arquivo, valida cada linha e
  // cria (ou atualiza, se o código já existir) as máquinas.
  async function importarPlanilha(e) {
    const arquivo = e.target.files?.[0];

    if (!arquivo) return;

    setImportando(true);
    setErro('');

    try {
      const r = await maquinasApi.importar(arquivo);
      await carregar();

      const falhas = (r.erros || []).map(
        (x) =>
          `linha ${x.linha}: ${Object.entries(x.erro)
            .map(([campo, msgs]) => `${campo} (${msgs.join(', ')})`)
            .join('; ')}`
      );

      window.alert(
        `${r.inseridos || 0} nova(s), ${r.atualizados || 0} atualizada(s), ${falhas.length} com erro.` +
          (falhas.length ? `\n\n${falhas.join('\n')}` : '')
      );

      if (falhas.length) {
        setErro(`${falhas.length} linha(s) não foram importadas. Verifique o arquivo.`);
      }
    } catch (err) {
      setErro(erroMsg(err));
    } finally {
      setImportando(false);
      e.target.value = '';
    }
  }

  const campoStyle =
    'w-full h-12 bg-[#F2F1EE] border border-[#C8C6C1] ' +
    'rounded-xl px-4 text-sm text-[#222222] ' +
    'focus:outline-none focus:border-[#736F6B] ' +
    'disabled:opacity-60';

  const labelStyle =
    'block text-sm font-medium text-[#686562] mb-2';

  return (
    <div className="w-full min-h-[760px] bg-[#F2F1EE] rounded-[28px] p-6 lg:p-10">

      {/* CABEÇALHO PADRONIZADO */}
      <PageHeader
        titulo="Cadastro de Máquinas"
        subtitulo="Gerencie o cadastro das máquinas disponíveis no sistema"
      >
        {isAdm && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={importarPlanilha}
              className="hidden"
            />

            <Button
              variante="secundario"
              tamanho="grande"
              disabled={importando}
              onClick={() => fileInputRef.current?.click()}
              className="min-w-[175px]"
            >
              {importando ? 'Importando...' : 'Importar Excel/CSV'}
            </Button>

            <Button
              variante="primario"
              tamanho="grande"
              onClick={abrirNovaMaquina}
              className="min-w-[175px]"
            >
              + Nova máquina
            </Button>
          </>
        )}
      </PageHeader>

      {/* BUSCA E FILTROS */}
      <div className="flex flex-col lg:flex-row gap-4 mb-7">

        <div className="flex-1">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por código ou modelo..."
            aria-label="Buscar máquinas"
            className="w-full h-12 bg-white border border-[#C8C6C1] rounded-xl px-5 text-sm text-[#222222] placeholder:text-[#9E9B97] focus:outline-none focus:border-[#736F6B]"
          />
        </div>

        <select
          value={modeloFiltro}
          onChange={(e) => setModeloFiltro(e.target.value)}
          aria-label="Filtrar por modelo"
          className="w-full lg:w-[190px] h-12 bg-white border border-[#C8C6C1] rounded-xl px-4 text-sm font-medium text-[#55524F] focus:outline-none focus:border-[#736F6B] cursor-pointer"
        >
          <option value="">Todos os modelos</option>

          {modelosDisponiveis.map((modelo) => (
            <option key={modelo} value={modelo}>
              {modelo}
            </option>
          ))}
        </select>

      </div>

      {/* ERROS */}
      {erro && !modalAberto && (
        <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 px-5 py-3 rounded-xl">
          {erro}
        </div>
      )}

      {/* TABELA */}
      <section className="bg-white rounded-3xl p-5 lg:p-7">

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">

          <h2 className="text-xl font-semibold text-[#222222]">
            Máquinas cadastradas
          </h2>

          <span className="text-sm text-[#736F6B]">
            {maquinasFiltradas.length} de {lista.length} máquinas
          </span>

        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E6E4DF]">

          <table className="w-full min-w-[850px] border-collapse text-sm">

            <thead>
              <tr className="bg-[#F2F1EE] text-[#686562]">

                {[
                  'Código',
                  'Modelo',
                  'RPM Padrão',
                  'RPM Mín.',
                  'RPM Máx.',
                  'Tempo por metro',
                ].map((titulo, i) => (
                  <th
                    key={titulo}
                    className={`py-5 px-4 font-semibold ${
                      i < 2 ? 'text-left' : 'text-center'
                    }`}
                  >
                    {titulo}
                  </th>
                ))}

                {isAdm && (
                  <th className="py-5 px-4 text-center font-semibold">
                    Ações
                  </th>
                )}

              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6E4DF]">

              {maquinasFiltradas.map((maquina) => {
                const rpmMin =
                  maquina.rpmMin ??
                  Math.round(
                    (maquina.rpmPadrao || 0) * 0.9
                  );

                const rpmMax =
                  maquina.rpmMax ??
                  Math.round(
                    (maquina.rpmPadrao || 0) * 1.1
                  );

                return (
                  <tr
                    key={maquina.codigo}
                    className="hover:bg-[#FAF9F7] transition-colors text-[#222222]"
                  >

                    <td className="py-5 px-4 text-left font-medium">
                      {maquina.codigo}
                    </td>

                    <td className="py-5 px-4 text-left">
                      {maquina.descricao}
                    </td>

                    <td className="py-5 px-4 text-center">
                      {maquina.rpmPadrao}
                    </td>

                    <td className="py-5 px-4 text-center">
                      {rpmMin}
                    </td>

                    <td className="py-5 px-4 text-center">
                      {rpmMax}
                    </td>

                    <td className="py-5 px-4 text-center">
                      {min4(maquina.tempoPorMetro)}m
                    </td>

                    {isAdm && (
                      <td className="py-5 px-4">

                        <div className="flex items-center justify-center gap-2">

                          <Button
                            variante="editar"
                            tamanho="pequeno"
                            onClick={() => abrirEdicao(maquina)}
                          >
                            Editar
                          </Button>

                          <Button
                            variante="excluir"
                            tamanho="pequeno"
                            onClick={() => excluir(maquina)}
                          >
                            Excluir
                          </Button>

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
                    className="py-16 text-center text-[#736F6B]"
                  >
                    Nenhuma máquina encontrada.
                  </td>
                </tr>
              )}

            </tbody>
          </table>

        </div>
      </section>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-[28px] p-6 md:p-9 w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-xl">

            <div className="mb-7">
              <h2 className="text-2xl font-semibold text-[#222222]">
                {editando !== null
                  ? `Editar máquina ${editando}`
                  : 'Nova máquina'}
              </h2>

              <p className="text-sm text-[#736F6B] mt-2">
                Preencha as informações da máquina.
              </p>
            </div>

            <form onSubmit={salvar} className="space-y-5">

              <div>
                <label className={labelStyle}>
                  Código
                </label>

                <input
                  value={form.codigo}
                  onChange={set('codigo')}
                  disabled={editando !== null}
                  required
                  className={campoStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>
                  Modelo / Descrição
                </label>

                <input
                  value={form.descricao}
                  onChange={set('descricao')}
                  required
                  placeholder="Ex.: Reta, Interlock, Overloque"
                  className={campoStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>
                  RPM Padrão
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.rpmPadrao}
                  onChange={set('rpmPadrao')}
                  required
                  placeholder="Ex.: 4000"
                  className={campoStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className={labelStyle}>
                    RPM Mín.
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.rpmMin ?? ''}
                    onChange={set('rpmMin')}
                    placeholder="Padrão - 10%"
                    className={campoStyle}
                  />
                </div>

                <div>
                  <label className={labelStyle}>
                    RPM Máx.
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.rpmMax ?? ''}
                    onChange={set('rpmMax')}
                    placeholder="Padrão + 10%"
                    className={campoStyle}
                  />
                </div>

              </div>

              <div>
                <label className={labelStyle}>
                  Tempo por metro (min/m)
                </label>

                <input
                  type="text"
                  inputMode="decimal"
                  value={form.tempoPorMetro}
                  onChange={set('tempoPorMetro')}
                  required
                  placeholder="Ex.: 0,0850"
                  className={campoStyle}
                />
              </div>

              <p className="text-xs text-[#736F6B]">
                RPM mín./máx. em branco: cálculo automático
                com variação de ±10% do RPM padrão.
              </p>

              {erro && (
                <div className="text-sm text-red-700 bg-red-50 rounded-xl p-3">
                  {erro}
                </div>
              )}

              {/* BOTÕES DO MODAL */}
              <div className="flex justify-end gap-3 pt-4">

                <Button
                  variante="neutro"
                  tamanho="medio"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  variante="primario"
                  tamanho="medio"
                  disabled={salvando}
                >
                  {salvando
                    ? 'Salvando...'
                    : 'Salvar máquina'}
                </Button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
