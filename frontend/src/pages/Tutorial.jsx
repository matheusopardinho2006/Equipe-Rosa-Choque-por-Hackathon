
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

const guias = [
  {
    id: 'maquinas',
    numero: '01',
    titulo: 'Cadastro de máquinas',
    descricao: 'Cadastre e consulte os equipamentos disponíveis.',
    rota: '/maquinas',
    botao: 'Ir para máquinas',
    passos: [
      'Acesse Cadastro de Máquinas pelo menu lateral.',
      'Consulte a lista de equipamentos cadastrados.',
      'Para adicionar uma máquina, informe os dados solicitados, incluindo código, descrição e parâmetros de RPM.',
      'Salve o cadastro e confira se o equipamento aparece na listagem.',
      'Utilize as opções de edição ou exclusão quando precisar manter o cadastro atualizado.',
    ],
    dica: 'Cadastre a máquina antes de gerar uma PO que utilize esse equipamento.',
  },
  {
    id: 'elementos',
    numero: '02',
    titulo: 'Cadastro de elementos MTM',
    descricao: 'Gerencie os procedimentos utilizados nos cálculos.',
    rota: '/elementos',
    botao: 'Ir para elementos MTM',
    passos: [
      'Acesse Cadastro de elementos MTM pelo menu lateral.',
      'Consulte os procedimentos já cadastrados.',
      'Cadastre um novo elemento informando seu código, descrição e tempo.',
      'Confira os dados antes de salvar.',
      'Utilize as ações disponíveis para editar ou remover elementos cadastrados.',
    ],
    dica: 'Os códigos dos elementos MTM são utilizados durante a criação das POs.',
  },
  {
    id: 'nova-po',
    numero: '03',
    titulo: 'Criar uma PO',
    descricao: 'Gere uma ficha de Processo Operacional em quatro etapas.',
    rota: '/nova-po',
    botao: 'Criar nova PO',
    passos: [
      'Abra a opção de criação de uma nova PO.',
      'Na etapa Produto, informe família, tamanho, medidas, pontos por centímetro, perímetro de costura e operação.',
      'Na etapa Máquina, selecione um equipamento cadastrado.',
      'Na etapa Procedimentos, pesquise os elementos MTM pelo código ou descrição e adicione-os na ordem de execução.',
      'Ajuste a frequência de cada procedimento, quando necessário.',
      'Na última etapa, confira as informações e clique em Gerar PO.',
    ],
    dica: 'A costura de máquina (FIXO) é incluída automaticamente no cálculo. Não é necessário adicioná-la como elemento MTM.',
  },
  {
    id: 'importacao',
    numero: '04',
    titulo: 'Importar demandas',
    descricao: 'Cadastre procedimentos a partir de arquivos.',
    rota: '/nova-po',
    botao: 'Abrir criação de PO',
    passos: [
      'Acesse a página Nova PO.',
      'Na primeira etapa, localize a área Importar demanda.',
      'Selecione um arquivo JSON, Excel, CSV ou TXT.',
      'Aguarde o processamento do arquivo.',
      'Na tela de confirmação, confira os procedimentos identificados.',
      'Corrija os dados necessários antes de confirmar a importação.',
    ],
    dica: 'Revise as informações importadas antes de confirmar o cadastro.',
  },
  {
    id: 'revisao',
    numero: '05',
    titulo: 'Revisar uma PO',
    descricao: 'Atualize as informações de uma ficha existente.',
    rota: '/analise',
    botao: 'Consultar POs',
    passos: [
      'Localize a PO desejada na listagem ou no histórico.',
      'Abra a ficha para consultar suas informações.',
      'Clique em Editar PO.',
      'Altere os dados do produto, a máquina ou os procedimentos MTM.',
      'Avance pelas etapas e confira as alterações.',
      'Clique em Salvar alterações para enviar a atualização.',
      'Retorne à ficha e confira os dados atualizados.',
    ],
    dica: 'Ao editar uma PO, o sistema solicita o recálculo dos tempos. Confirme o resultado na ficha após salvar.',
  },
  {
    id: 'exportacao',
    numero: '06',
    titulo: 'Exportar para Excel',
    descricao: 'Obtenha a ficha técnica em formato de planilha.',
    rota: '/analise',
    botao: 'Consultar POs',
    passos: [
      'Localize a PO que deseja exportar.',
      'Abra a ficha de Processo Operacional.',
      'Confira os dados do produto, equipamento e procedimentos.',
      'Clique em Exportar Excel.',
      'Aguarde o download do arquivo .xlsx.',
    ],
    dica: 'Confira o código e a revisão da ficha antes de utilizar o arquivo exportado.',
  },
  {
    id: 'analise',
    numero: '07',
    titulo: 'Análise e histórico',
    descricao: 'Compare tempos, consulte indicadores e encontre POs.',
    rota: '/analise',
    botao: 'Abrir análise',
    passos: [
      'Acesse Análise de POs pelo menu lateral.',
      'Utilize a busca para localizar procedimentos.',
      'Aplique os filtros de família, tamanho, máquina ou operação.',
      'Selecione as POs que deseja comparar.',
      'Consulte os indicadores de tempo e capacidade teórica.',
      'Analise os gráficos e abra uma ficha para visualizar seus detalhes.',
    ],
    dica: 'Os filtros ajudam a comparar operações com características semelhantes.',
  },
];

export default function Tutorial() {
  const nav = useNavigate();

  const [busca, setBusca] = useState('');
  const [abertos, setAbertos] = useState([]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');

    if (!termo) return guias;

    return guias.filter((guia) =>
      [
        guia.titulo,
        guia.descricao,
        guia.dica,
        ...guia.passos,
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(termo)
    );
  }, [busca]);

  function alternar(id) {
    setAbertos((anteriores) =>
      anteriores.includes(id)
        ? anteriores.filter((item) => item !== id)
        : [...anteriores, id]
    );
  }

  function expandirTodos() {
    setAbertos(filtrados.map((guia) => guia.id));
  }

  function recolherTodos() {
    setAbertos([]);
  }

  return (
    <section className="w-full min-h-[760px] bg-[#F2F1EE] rounded-[28px] p-6 lg:p-10">
      <PageHeader
        titulo="Tutorial de uso"
        subtitulo="Aprenda a utilizar as principais funcionalidades do Auto-T&M."
      />

      {/* APRESENTAÇÃO */}
      <div className="bg-white rounded-[26px] p-6 lg:p-8 mt-7 mb-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <span className="text-xs font-semibold tracking-wider text-[#736F6B] uppercase">
              Central de ajuda
            </span>

            <h2 className="text-2xl font-semibold text-[#222222] mt-3">
              Como podemos ajudar?
            </h2>

            <p className="text-sm text-[#686562] mt-3 max-w-2xl leading-relaxed">
              Encontre instruções para cadastrar equipamentos,
              configurar elementos MTM, gerar fichas de Processo
              Operacional e analisar os resultados.
            </p>
          </div>

          <div className="shrink-0 bg-[#F2F1EE] rounded-2xl px-6 py-5 text-center">
            <span className="block text-3xl font-semibold text-[#222222]">
              {guias.length}
            </span>
            <span className="text-xs text-[#686562]">
              guias disponíveis
            </span>
          </div>
        </div>

        {/* BUSCA */}
        <div className="mt-7">
          <label
            htmlFor="busca-tutorial"
            className="block text-sm font-medium text-[#686562] mb-2"
          >
            Buscar no tutorial
          </label>

          <input
            id="busca-tutorial"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex.: cadastrar máquina, revisar PO, exportar..."
            className="w-full h-12 bg-white border border-[#C8C6C1] rounded-xl px-4 text-sm text-[#222222] placeholder:text-[#9E9B97] focus:outline-none focus:border-[#736F6B]"
          />
        </div>
      </div>

      {/* LISTA DE GUIAS */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-[#222222]">
            Guias passo a passo
          </h2>

          <p className="text-sm text-[#686562] mt-1">
            {filtrados.length} de {guias.length} guias encontrados
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variante="secundario"
            tamanho="pequeno"
            onClick={expandirTodos}
          >
            Expandir todos
          </Button>

          <Button
            variante="secundario"
            tamanho="pequeno"
            onClick={recolherTodos}
          >
            Recolher todos
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filtrados.map((guia) => {
          const aberto = abertos.includes(guia.id);

          return (
            <article
              key={guia.id}
              className="bg-white rounded-[22px] overflow-hidden border border-[#E6E4DF]"
            >
              <button
                type="button"
                onClick={() => alternar(guia.id)}
                aria-expanded={aberto}
                aria-controls={`conteudo-${guia.id}`}
                className="w-full flex items-center gap-4 p-5 lg:p-6 text-left hover:bg-[#FAF9F7] transition-colors cursor-pointer"
              >
                <span className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl bg-[#F2F1EE] text-[#736F6B] font-semibold text-sm">
                  {guia.numero}
                </span>

                <span className="flex-1 min-w-0">
                  <span className="block text-base font-semibold text-[#222222]">
                    {guia.titulo}
                  </span>

                  <span className="block text-sm text-[#686562] mt-1">
                    {guia.descricao}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className={`text-[#736F6B] text-xl transition-transform ${
                    aberto ? 'rotate-180' : ''
                  }`}
                >
                  ⌄
                </span>
              </button>

              {aberto && (
                <div
                  id={`conteudo-${guia.id}`}
                  className="border-t border-[#E6E4DF] px-5 lg:px-6 pb-6 pt-6"
                >
                  <ol className="space-y-5">
                    {guia.passos.map((passo, indice) => (
                      <li
                        key={indice}
                        className="flex items-start gap-4"
                      >
                        <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-[#F2F1EE] text-[#736F6B] text-xs font-semibold">
                          {indice + 1}
                        </span>

                        <p className="text-sm text-[#55524F] leading-relaxed pt-1.5">
                          {passo}
                        </p>
                      </li>
                    ))}
                  </ol>

                  <div className="bg-[#FAF9F7] border border-[#E6E4DF] rounded-xl p-4 mt-6">
                    <p className="text-sm text-[#686562] leading-relaxed">
                      <strong className="text-[#222222]">
                        Dica:
                      </strong>{' '}
                      {guia.dica}
                    </p>
                  </div>

                  <div className="mt-6">
                    <Button
                      variante="primario"
                      tamanho="medio"
                      onClick={() => nav(guia.rota)}
                    >
                      {guia.botao} →
                    </Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}

        {filtrados.length === 0 && (
          <div className="bg-white rounded-[22px] p-10 text-center">
            <h3 className="text-base font-semibold text-[#222222]">
              Nenhum guia encontrado
            </h3>

            <p className="text-sm text-[#686562] mt-2">
              Tente buscar por outro termo ou limpe o campo de pesquisa.
            </p>

            <div className="mt-5">
              <Button
                variante="secundario"
                tamanho="medio"
                onClick={() => setBusca('')}
              >
                Limpar busca
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* RODAPÉ */}
      <div className="mt-8 text-center">
        <p className="text-xs text-[#9E9B97]">
          Auto-T&M · Guia de utilização do sistema
        </p>
      </div>
    </section>
  );
}
