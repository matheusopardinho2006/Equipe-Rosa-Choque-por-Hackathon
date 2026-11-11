import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { posApi, erroMsg } from '../services/api';
import { min4 } from '../utils/format';

import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

// ESTILOS ORIGINAIS DA FICHA TÉCNICA
const SERIF = {
  fontFamily: "'Times New Roman', Times, serif",
};

const cel = {
  border: '1px solid #000',
  padding: '8px 10px',
  textAlign: 'center',
  verticalAlign: 'middle',
};

const tit = {
  ...cel,
  background: '#d9d9d9',
  fontWeight: 700,
};

const val = {
  ...cel,
  ...SERIF,
};

const amarelo = {
  ...val,
  background: '#ffff00',
};

const num = (v) =>
  v == null || v === '' ? '' : String(v);

export default function FichaPO() {
  const { id } = useParams();

  const [po, setPo] = useState(null);
  const [aviso, setAviso] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setPo(null);
    setErro('');
    setAviso(false);

    posApi
      .buscar(id)
      .then(setPo)
      .catch((e) => setErro(erroMsg(e)));
  }, [id]);

  // ERRO
  if (erro) {
    return (
      <div className="w-full min-h-[760px] bg-[#F2F1EE] rounded-[28px] p-6 lg:p-10">
        <PageHeader
          titulo="Ficha de PO"
          subtitulo="Não foi possível carregar a ficha."
        />

        <div className="bg-white rounded-2xl p-6">
          <p className="text-sm text-red-700 mb-5">
            {erro}
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-[#736F6B] hover:bg-[#5E5A56] text-white text-sm font-medium transition-colors"
          >
            ← Voltar ao cadastro
          </Link>
        </div>
      </div>
    );
  }

  // CARREGANDO
  if (!po) {
    return (
      <div className="w-full min-h-[760px] bg-[#F2F1EE] rounded-[28px] p-6 lg:p-10">
        <PageHeader
          titulo="Ficha de PO"
          subtitulo="Carregando informações da ficha..."
        />

        <div className="bg-white rounded-2xl p-6">
          <p className="text-sm text-[#686562]">
            Carregando ficha de PO...
          </p>
        </div>
      </div>
    );
  }

  const m = po.maquina;
  const itens = po.itens || [];

  // CÁLCULOS ORIGINAIS
  const manual = Math.max(
    0,
    po.tp - po.tempoFixo
  );

  const pctFixo =
    po.tp > 0
      ? Math.max(
          0,
          Math.min(100, (po.tempoFixo / po.tp) * 100)
        )
      : 0;

  const pctManual = 100 - pctFixo;

  const fmtPct = (v) =>
    `${(Math.round(v * 10) / 10).toLocaleString('pt-BR')}%`;

  // INDICADORES
  const resumo = [
    {
      titulo: 'Tempo total (TP)',
      valor: `${min4(po.tp)} min`,
      destaque: true,
    },
    {
      titulo: 'Costura de máquina (FIXO)',
      valor: `${min4(po.tempoFixo)} min`,
      descricao: `${fmtPct(pctFixo)} do TP`,
    },
    {
      titulo: 'Manual (MTM)',
      valor: `${min4(manual)} min`,
      descricao: `${fmtPct(pctManual)} do TP · ${itens.length} elemento(s)`,
    },
    {
      titulo: 'Capacidade teórica',
      valor: `${
        po.tp > 0
          ? Math.floor(60 / po.tp)
          : 0
      } peças/h`,
      descricao: '100% de eficiência',
    },
  ];

  // INFORMAÇÕES DA OPERAÇÃO
  const info = [
    {
      titulo: 'Operação',
      valor: po.operacao,
    },
    {
      titulo: 'Produto',
      valor: `${po.familia} · ${po.tamanho}`,
      descricao: `Medidas ${po.medidas} m`,
    },
    {
      titulo: 'Costura',
      valor: `${String(po.perimetroM).replace('.', ',')} m`,
      descricao: `${String(po.pontosCm).replace('.', ',')} pontos/cm`,
    },
    {
      titulo: 'Máquina',
      valor: `${m?.codigo ?? ''} · ${m?.descricao ?? ''}`,
      descricao: `RPM ${m?.rpmMin ?? '-'} / ${m?.rpmPadrao ?? '-'} / ${m?.rpmMax ?? '-'}`,
    },
  ];

  return (
    <section className="w-full min-h-[760px] bg-[#F2F1EE] rounded-[28px] p-6 lg:p-10 space-y-8">

      {/* CABEÇALHO */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center text-sm text-[#736F6B] hover:text-[#222222] transition-colors mb-5"
        >
          ← Cadastro de POs
        </Link>

        <PageHeader
          titulo={po.codigoPO}
          subtitulo={`Ficha de Processo Operacional${
            po.createdAt
              ? ` · Gerada em ${new Date(
                  po.createdAt
                ).toLocaleDateString('pt-BR')}`
              : ''
          }`}
        >
          <span className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-white border border-[#C8C6C1] text-[#686562] text-sm font-medium">
            Rev. {po.revisao}
          </span>

          <Button
            variante="secundario"
            tamanho="grande"
            className="min-w-[130px]"
            onClick={() => setAviso(true)}
          >
            Revisar
          </Button>

          <Button
            variante="primario"
            tamanho="grande"
            className="min-w-[160px]"
            onClick={() => posApi.baixarExcel(po)}
          >
            Exportar Excel
          </Button>
        </PageHeader>
      </div>

      {/* AVISO DE REVISÃO */}
      {aviso && (
        <div className="bg-white border border-[#C8C6C1] rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div>
            <p className="text-sm font-semibold text-[#222222]">
              Revisão de PO
            </p>

            <p className="text-sm text-[#686562] mt-1">
              Esta funcionalidade ainda não está disponível.
            </p>
          </div>

          <Button
            variante="primario"
            tamanho="medio"
            onClick={() => setAviso(false)}
          >
            Entendi
          </Button>
        </div>
      )}

      {/* RESUMO DOS TEMPOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {resumo.map((r) => (
          <div
            key={r.titulo}
            className={`rounded-[22px] p-6 min-h-[150px] flex flex-col justify-between ${
              r.destaque
                ? 'bg-[#736F6B] text-white'
                : 'bg-white text-[#222222]'
            }`}
          >
            <span
              className={`text-sm font-medium ${
                r.destaque
                  ? 'text-[#F2F1EE]'
                  : 'text-[#686562]'
              }`}
            >
              {r.titulo}
            </span>

            <div className="mt-4">
              <div className="text-[27px] lg:text-[30px] font-semibold tabular-nums leading-tight">
                {r.valor}
              </div>

              {r.descricao && (
                <p
                  className={`text-sm mt-2 ${
                    r.destaque
                      ? 'text-[#F2F1EE]'
                      : 'text-[#686562]'
                  }`}
                >
                  {r.descricao}
                </p>
              )}
            </div>
          </div>
        ))}

      </div>

      {/* COMPOSIÇÃO DO TEMPO */}
      <div className="bg-white rounded-[26px] p-6 lg:p-8">

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-[23px] font-normal text-[#686562]">
              Composição do tempo total
            </h2>

            <p className="text-sm text-[#686562] mt-2">
              Distribuição do tempo entre costura de máquina
              e procedimentos MTM.
            </p>
          </div>

          <span className="text-lg font-semibold text-[#222222] tabular-nums">
            {min4(po.tp)} min
          </span>
        </div>

        {/* BARRA DE COMPOSIÇÃO */}
        <div className="flex h-10 rounded-xl overflow-hidden bg-[#F2F1EE]">

          {pctFixo > 0 && (
            <div
              className="bg-[#736F6B] text-white flex items-center justify-center text-xs font-medium overflow-hidden whitespace-nowrap shrink-0"
              style={{
                width: `${pctFixo}%`,
              }}
              title={`FIXO: ${min4(po.tempoFixo)} min`}
            >
              {pctFixo >= 15 && 'FIXO'}
            </div>
          )}

          {po.tp > 0 &&
            itens
              .filter((i) => i.tempo > 0)
              .map((i, k) => (
                <div
                  key={`${i.ordem}-${k}`}
                  className="flex items-center justify-center text-[#55524F] border-l border-white overflow-hidden whitespace-nowrap text-xs font-medium min-w-0"
                  style={{
                    width: `${Math.max(0, (i.tempo / po.tp) * 100)}%`,
                    background: [
                      '#D9C8BF',
                      '#E6DAD3',
                      '#CDBBB1',
                      '#EFE6E1',
                    ][k % 4],
                  }}
                  title={`${i.codigo} · ${i.descricao}: ${min4(i.tempo)} min`}
                >
                  {i.codigo}
                </div>
              ))}
        </div>

        {/* LEGENDA */}
        <div className="flex flex-wrap gap-x-7 gap-y-3 mt-5">

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#736F6B]" />
            <span className="text-sm text-[#686562]">
              FIXO: {fmtPct(pctFixo)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#D9C8BF]" />
            <span className="text-sm text-[#686562]">
              Manual (MTM): {fmtPct(pctManual)}
            </span>
          </div>

        </div>

        <p className="text-xs text-[#9E9B97] mt-4">
          Passe o mouse sobre cada segmento para visualizar
          o procedimento e seu tempo.
        </p>
      </div>

      {/* DADOS DA OPERAÇÃO */}
      <div>
        <h2 className="text-[23px] font-normal text-[#686562] mb-5">
          Dados da operação
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          {info.map((x) => (
            <div
              key={x.titulo}
              className="bg-white rounded-[22px] p-6 min-h-[125px]"
            >
              <p className="text-sm text-[#686562]">
                {x.titulo}
              </p>

              <p className="text-base font-semibold text-[#222222] mt-3">
                {x.valor}
              </p>

              {x.descricao && (
                <p className="text-sm text-[#686562] mt-2">
                  {x.descricao}
                </p>
              )}
            </div>
          ))}

        </div>
      </div>

      {/* FICHA TÉCNICA */}
      <div>
        <div className="mb-5">
          <h2 className="text-[23px] font-normal text-[#686562]">
            Ficha no formato da exportação
          </h2>

          <p className="text-sm text-[#686562] mt-2">
            Visualização da ficha técnica utilizada
            na exportação para Excel.
          </p>
        </div>

        <div className="bg-white rounded-[26px] p-5 lg:p-8 overflow-x-auto">

          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: 760,
              tableLayout: 'fixed',
              fontSize: 13,
              color: '#000000',
              background: '#FFFFFF',
            }}
          >
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '22%' }} />
            </colgroup>

            <tbody>

              {/* CÓDIGO E REVISÃO */}
              <tr>
                <td
                  colSpan={4}
                  style={{
                    ...val,
                    fontWeight: 700,
                    fontSize: 24,
                    padding: 18,
                  }}
                >
                  {po.codigoPO}
                </td>

                <td
                  style={{
                    ...val,
                    fontWeight: 700,
                    fontSize: 24,
                  }}
                >
                  Rev. {po.revisao}
                </td>
              </tr>

              {/* OPERAÇÃO */}
              <tr>
                <td style={tit}>
                  Operação
                </td>

                <td colSpan={4} style={cel}>
                  {po.operacao}
                </td>
              </tr>

              {/* DADOS DO PRODUTO */}
              <tr>
                <td style={tit}>
                  Agrupamento família
                </td>

                <td style={tit}>
                  Tamanho
                </td>

                <td style={tit}>
                  Medidas da peça
                  <br />
                  (em m)
                </td>

                <td style={tit}>
                  Pontos/cm
                </td>

                <td style={tit}>
                  Perímetro costura
                  <br />
                  (em m)
                </td>
              </tr>

              <tr>
                <td style={val}>
                  {po.familia}
                </td>

                <td style={val}>
                  {po.tamanho}
                </td>

                <td style={val}>
                  {po.medidas}
                </td>

                <td style={val}>
                  {num(po.pontosCm)}
                </td>

                <td style={val}>
                  {num(po.perimetroM)}
                </td>
              </tr>

              {/* EQUIPAMENTO */}
              <tr>
                <td style={tit}>
                  Cód. Eqp.
                </td>

                <td style={tit}>
                  Equipamento
                </td>

                <td style={tit}>
                  RPM - limite inferior
                </td>

                <td style={tit}>
                  RPM - padrão
                </td>

                <td style={tit}>
                  RPM - limite superior
                </td>
              </tr>

              <tr>
                <td style={val}>
                  {m?.codigo}
                </td>

                <td style={val}>
                  {m?.descricao}
                </td>

                <td style={val}>
                  {m?.rpmMin}
                </td>

                <td style={val}>
                  {m?.rpmPadrao}
                </td>

                <td style={val}>
                  {m?.rpmMax}
                </td>
              </tr>

              {/* PROCEDIMENTOS */}
              <tr>
                <td style={tit}>
                  Código do elemento
                </td>

                <td colSpan={2} style={tit}>
                  Elementos
                </td>

                <td style={tit}>
                  Frequência
                </td>

                <td style={tit}>
                  Tempos (em minutos)
                </td>
              </tr>

              {/* TEMPO FIXO */}
              <tr>
                <td
                  style={{
                    ...amarelo,
                    fontWeight: 700,
                  }}
                >
                  FIXO
                </td>

                <td colSpan={2} style={amarelo}>
                  Tempo de costura
                </td>

                <td style={amarelo}>
                  1
                </td>

                <td style={amarelo}>
                  {min4(po.tempoFixo)}
                </td>
              </tr>

              {/* ELEMENTOS MTM */}
              {itens.map((i) => (
                <tr key={i.ordem}>
                  <td
                    style={{
                      ...val,
                      fontWeight: 700,
                    }}
                  >
                    {i.codigo}
                  </td>

                  <td colSpan={2} style={cel}>
                    {i.descricao}
                  </td>

                  <td style={cel}>
                    {i.frequencia}
                  </td>

                  <td style={cel}>
                    {min4(i.tempo)}
                  </td>
                </tr>
              ))}

              {/* TEMPO TOTAL */}
              <tr>
                <td style={tit}>
                  TP
                </td>

                <td colSpan={3} style={tit}>
                  Tempo total da operação
                </td>

                <td style={tit}>
                  {min4(po.tp)}
                </td>
              </tr>

            </tbody>
          </table>

        </div>
      </div>

    </section>
  );
}
