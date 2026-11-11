import { useEffect, useState, useRef, useMemo } from 'react';
import { elementosApi, erroMsg } from '../services/api';

import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

const vazio = {
  codigo: '',
  descricao: '',
  tempo: '',
};

const estiloCampo =
  'w-full h-12 bg-[#F2F1EE] border border-[#C8C6C1] ' +
  'rounded-xl px-4 text-sm text-[#222222] ' +
  'placeholder:text-[#9E9B97] ' +
  'focus:outline-none focus:border-[#736F6B] ' +
  'disabled:opacity-60';

const estiloLabel =
  'block text-sm font-medium text-[#686562] mb-2';

export default function ElementosMTM() {
  const [elementos, setElementos] = useState([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(null);
  const [editando, setEditando] = useState(null);

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [importando, setImportando] = useState(false);

  const fileInputRef = useRef(null);

  // CARREGAR ELEMENTOS
  const carregar = () => {
    return elementosApi
      .listar()
      .then(setElementos)
      .catch((e) => setErro(erroMsg(e)));
  };

  useEffect(() => {
    carregar();
  }, []);

  // LIMPAR NOTIFICAÇÕES APÓS 5 SEGUNDOS
  useEffect(() => {
    if (!erro && !sucesso) return;

    const timer = setTimeout(() => {
      setErro('');
      setSucesso('');
    }, 5000);

    return () => clearTimeout(timer);
  }, [erro, sucesso]);

  // FILTRAR ELEMENTOS
  const elementosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return elementos;

    return elementos.filter((el) =>
      [el.codigo, el.descricao, el.agrupador].some(
        (valor) =>
          String(valor ?? '')
            .toLowerCase()
            .includes(termo)
      )
    );
  }, [elementos, busca]);

  // ABRIR CADASTRO
  function abrirNovo() {
    setForm({ ...vazio });
    setEditando(null);
    setErro('');
  }

  // ABRIR EDIÇÃO
  function abrirEdicao(el) {
    setForm({
      codigo: el.codigo,
      descricao: el.descricao,
      tempo: el.tempo,
    });

    setEditando(el.codigo);
    setErro('');
  }

  // FECHAR MODAL
  function fecharModal() {
    setForm(null);
    setEditando(null);
    setErro('');
  }

  // ATUALIZAR CAMPOS
  function atualizarCampo(campo, valor) {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  // SALVAR ELEMENTO
  async function salvar(e) {
    e.preventDefault();

    if (salvando) return;

    setSalvando(true);
    setErro('');
    setSucesso('');

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
      await carregar();
    } catch (err) {
      setErro(erroMsg(err));
    } finally {
      setSalvando(false);
    }
  }

  // EXCLUIR ELEMENTO
  async function excluir(el) {
    if (!window.confirm(`Excluir elemento ${el.codigo}?`)) {
      return;
    }

    setErro('');
    setSucesso('');

    try {
      await elementosApi.remover(el.codigo);
      setSucesso(`Elemento ${el.codigo} removido.`);
      await carregar();
    } catch (err) {
      setErro(erroMsg(err));
    }
  }

  // IMPORTAR EXCEL / CSV
  async function importar(e) {
    const arquivo = e.target.files?.[0];

    if (!arquivo) return;

    setImportando(true);
    setErro('');
    setSucesso('');

    try {
      const resultado = await elementosApi.importar(arquivo);

      if (resultado) {
        const falhas = (resultado.erros || []).map((x) => {
          const detalhes =
            typeof x.erro === 'string'
              ? x.erro
              : Object.entries(x.erro || {})
                  .map(
                    ([k, v]) =>
                      `${k} (${
                        Array.isArray(v)
                          ? v.join(', ')
                          : String(v)
                      })`
                  )
                  .join('; ');

          return `Linha ${x.linha}: ${detalhes}`;
        });

        window.alert(
          `${resultado.inseridos || 0} novo(s), ` +
            `${resultado.atualizados || 0} atualizado(s), ` +
            `${resultado.erros?.length || 0} com erro.` +
            (falhas.length
              ? '\n\n' + falhas.join('\n')
              : '')
        );

        if (falhas.length === 0) {
          setSucesso('Arquivo importado com sucesso!');
        } else {
          setErro('Importação concluída com algumas falhas.');
        }
      }

      await carregar();
    } catch (err) {
      setErro(erroMsg(err));
    } finally {
      setImportando(false);
      e.target.value = '';
    }
  }

  return (
    <div className="w-full min-h-[760px] bg-[#F2F1EE] rounded-[28px] p-6 lg:p-10">

      {/* NOTIFICAÇÕES */}
      {(erro || sucesso) && (
        <div
          className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-[420px]"
          role="status"
        >
          {erro && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-5 py-4 rounded-xl shadow-md text-sm">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-5 py-4 rounded-xl shadow-md text-sm">
              {sucesso}
            </div>
          )}
        </div>
      )}

      {/* CABEÇALHO PADRONIZADO */}
      <PageHeader
        titulo="Cadastro de Elementos MTM"
        subtitulo={`Procedimentos padrão utilizados no roteiro das POs (${elementos.length} cadastrados)`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={importar}
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
          onClick={abrirNovo}
          className="min-w-[175px]"
        >
          + Novo elemento
        </Button>
      </PageHeader>

      {/* CONTAINER PRINCIPAL */}
      <section className="bg-white rounded-3xl p-5 lg:p-7">

        {/* CABEÇALHO DA TABELA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

          <h2 className="text-xl font-semibold text-[#222222]">
            Elementos padrão (MTM)
          </h2>

          <span className="text-sm text-[#736F6B]">
            {elementosFiltrados.length} de {elementos.length} elementos
          </span>

        </div>

        {/* BUSCA */}
        <div className="mb-6">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar código, descrição ou agrupador..."
            aria-label="Buscar elementos MTM"
            className="w-full h-12 bg-[#F2F1EE] border border-[#C8C6C1] rounded-xl px-5 text-sm text-[#222222] placeholder:text-[#9E9B97] focus:outline-none focus:border-[#736F6B]"
          />
        </div>

        {/* TABELA */}
        <div className="overflow-x-auto rounded-2xl border border-[#E6E4DF]">

          <table className="w-full min-w-[760px] border-collapse text-sm">

            <thead>
              <tr className="bg-[#F2F1EE] text-[#686562]">

                <th className="py-5 px-4 text-center font-semibold w-28">
                  Código
                </th>

                <th className="py-5 px-4 text-center font-semibold w-40">
                  Agrupador
                </th>

                <th className="py-5 px-4 text-left font-semibold">
                  Descrição
                </th>

                <th className="py-5 px-4 text-center font-semibold w-36">
                  Tempo (min)
                </th>

                <th className="py-5 px-4 text-center font-semibold w-44">
                  Ações
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6E4DF]">

              {elementosFiltrados.map((el) => (
                <tr
                  key={el.codigo || el.id}
                  className="hover:bg-[#FAF9F7] transition-colors text-[#222222]"
                >

                  <td className="py-5 px-4 text-center font-medium text-[#222222]">
                    {el.codigo}
                  </td>

                  <td className="py-5 px-4 text-center text-[#222222]">
                    {el.agrupador
                      ? `Agrupador ${el.agrupador}`
                      : 'Agrupador'}
                  </td>

                  <td className="py-5 px-4 text-left text-[#222222]">
                    {el.descricao}
                  </td>

                  <td className="py-5 px-4 text-center text-[#222222]">
                    {el.tempo}
                  </td>

                  <td className="py-5 px-4 text-center">
                    <div className="inline-flex items-center gap-2">

                      <Button
                        variante="editar"
                        tamanho="pequeno"
                        onClick={() => abrirEdicao(el)}
                      >
                        Editar
                      </Button>

                      <Button
                        variante="excluir"
                        tamanho="pequeno"
                        onClick={() => excluir(el)}
                      >
                        Excluir
                      </Button>

                    </div>
                  </td>

                </tr>
              ))}

              {elementosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center text-[#736F6B]"
                  >
                    Nenhum elemento MTM encontrado.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

      </section>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-[28px] p-6 md:p-9 w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-xl">

            <div className="mb-7">
              <h3 className="text-2xl font-semibold text-[#222222]">
                {editando
                  ? `Editar elemento ${editando}`
                  : 'Novo elemento MTM'}
              </h3>

              <p className="text-sm text-[#736F6B] mt-2">
                Preencha as informações do procedimento.
              </p>
            </div>

            <form onSubmit={salvar} className="space-y-5">

              {/* CÓDIGO */}
              <div>
                <label className={estiloLabel}>
                  Código (agrupador.elemento)
                </label>

                <input
                  type="text"
                  required
                  disabled={!!editando}
                  value={form.codigo}
                  onChange={(e) =>
                    atualizarCampo('codigo', e.target.value)
                  }
                  placeholder="Ex.: 2.1"
                  className={estiloCampo}
                />
              </div>

              {/* DESCRIÇÃO */}
              <div>
                <label className={estiloLabel}>
                  Descrição
                </label>

                <input
                  type="text"
                  required
                  value={form.descricao}
                  onChange={(e) =>
                    atualizarCampo('descricao', e.target.value)
                  }
                  placeholder="Ex.: Apanhar e posicionar peça"
                  className={estiloCampo}
                />
              </div>

              {/* TEMPO */}
              <div>
                <label className={estiloLabel}>
                  Tempo (min)
                </label>

                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={form.tempo}
                  onChange={(e) =>
                    atualizarCampo('tempo', e.target.value)
                  }
                  placeholder="Ex.: 0,15"
                  className={estiloCampo}
                />
              </div>

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
                  {salvando ? 'Salvando...' : 'Salvar elemento'}
                </Button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
