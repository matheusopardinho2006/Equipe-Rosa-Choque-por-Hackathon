import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { posApi, erroMsg } from '../services/api';
import { min4 } from '../utils/format';

const SERIF = { fontFamily: "'Times New Roman', Times, serif" };
const cel = {
  border: '1px solid #000',
  padding: '6px 8px',
  textAlign: 'center',
  verticalAlign: 'middle',
};
const tit = { ...cel, background: '#d9d9d9', fontWeight: 700 };
const val = { ...cel, ...SERIF };
const amarelo = { ...val, background: '#ffff00' };
const num = (v) => (v == null || v === '' ? '' : String(v));

export default function FichaPO() {
  const { id } = useParams();
  const [po, setPo] = useState(null);
  const [aviso, setAviso] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    posApi.buscar(id).then(setPo).catch((e) => setErro(erroMsg(e)));
  }, [id]);

  if (erro) return <p className="text-sm text-red-700 p-4">{erro}</p>;
  if (!po) return <p className="text-sm text-[#686562] p-4">Carregando…</p>;
  const m = po.maquina;
  const manual = Math.max(0, po.tp - po.tempoFixo);
  const pctFixo = po.tp > 0 ? (po.tempoFixo / po.tp) * 100 : 0;
  const fmtPct = (v) => `${(Math.round(v * 10) / 10).toLocaleString('pt-BR')}%`;
  const resumo = [
    { t: 'Tempo total (TP)', v: `${min4(po.tp)} min`, destaque: true },
    { t: 'Costura de máquina (FIXO)', v: `${min4(po.tempoFixo)} min`, d: `${fmtPct(pctFixo)} do TP` },
    { t: 'Manual (MTM)', v: `${min4(manual)} min`, d: `${fmtPct(100 - pctFixo)} do TP · ${po.itens.length} elemento(s)` },
    { t: 'Capacidade teórica', v: `${po.tp > 0 ? Math.floor(60 / po.tp) : 0} peças/h`, d: '100% de eficiência' },
  ];
  const info = [
    { t: 'Operação', v: po.operacao },
    { t: 'Produto', v: `${po.familia} · ${po.tamanho}`, d: `Medidas ${po.medidas} m` },
    { t: 'Costura', v: `${String(po.perimetroM).replace('.', ',')} m`, d: `${String(po.pontosCm).replace('.', ',')} pontos/cm` },
    { t: 'Máquina', v: `${m?.codigo} · ${m?.descricao}`, d: `RPM ${m?.rpmMin} / ${m?.rpmPadrao} / ${m?.rpmMax}` },
  ];

  return (
    <section className="bg-[#F2F1EE] rounded-[28px] p-6 space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-xs text-[#686562] hover:underline">← Cadastro de POs</Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-3xl font-semibold text-[#222222] m-0 tracking-tight">{po.codigoPO}</h1>
            <span className="text-xs bg-white border border-[#C8C6C1] text-[#686562] rounded-full px-3 py-1">Rev. {po.revisao}</span>
          </div>
          <p className="text-sm text-[#686562] mt-1">
            Ficha de Processo Operacional{po.createdAt ? ` · gerada em ${new Date(po.createdAt).toLocaleDateString('pt-BR')}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAviso(true)}
            className="bg-white hover:bg-[#E5E3DD] border border-[#C8C6C1] text-[#222222] rounded-full px-5 py-2.5 text-xs cursor-pointer"
          >
            Revisar
          </button>
          <button
            type="button"
            onClick={() => posApi.baixarExcel(po)}
            className="bg-[#686562] hover:bg-[#55524F] text-white rounded-full px-5 py-2.5 text-xs font-semibold cursor-pointer"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {aviso && (
        <div className="border border-dashed border-[#736F6B] rounded-xl p-3 bg-white text-xs text-[#222222] flex items-center justify-between">
          <span>
            <strong>Revisão de PO: a implementar.</strong> Esta função ainda não está disponível.
          </span>
          <button
            type="button"
            onClick={() => setAviso(false)}
            className="bg-[#686562] text-white rounded-lg px-3 py-1 text-xs cursor-pointer"
          >
            OK
          </button>
        </div>
      )}

      {/* Resumo dos tempos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {resumo.map((r) => (
          <div key={r.t} className={`rounded-2xl p-4 flex flex-col justify-between min-h-[100px] ${r.destaque ? 'bg-[#686562] text-white' : 'bg-white text-[#222222]'}`}>
            <span className={`text-xs ${r.destaque ? 'text-[#E5E3DD]' : 'text-[#686562]'}`}>{r.t}</span>
            <span className="text-2xl font-medium tabular-nums mt-1">{r.v}</span>
            {r.d && <span className="text-[11px] text-[#9E9B97] mt-1">{r.d}</span>}
          </div>
        ))}
      </div>

      {/* Composição do TP */}
      <div className="bg-white rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-medium text-[#222222]">Composição do tempo total</h2>
          <span className="text-[11px] text-[#686562]">{min4(po.tp)} min</span>
        </div>
        <div className="flex h-7 rounded-lg overflow-hidden text-[11px]">
          <div className="bg-[#686562] text-white flex items-center px-2 whitespace-nowrap overflow-hidden" style={{ width: `${pctFixo}%` }} title={`FIXO ${min4(po.tempoFixo)} min`}>
            FIXO {fmtPct(pctFixo)}
          </div>
          {po.itens.filter((i) => i.tempo > 0).map((i, k) => (
            <div
              key={i.ordem}
              className="flex items-center justify-center text-[#55524F] border-l border-white overflow-hidden whitespace-nowrap"
              style={{ width: `${(i.tempo / po.tp) * 100}%`, background: ['#D9C8BF', '#E6DAD3', '#CDBBB1', '#EFE6E1'][k % 4] }}
              title={`${i.codigo} · ${i.descricao}: ${min4(i.tempo)} min`}
            >
              {i.codigo}
            </div>
          ))}
        </div>
        <div className="mt-2 text-[11px] text-[#9E9B97]">Passe o mouse sobre cada parte para ver o elemento e o tempo.</div>
      </div>

      {/* Dados da operação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {info.map((x) => (
          <div key={x.t} className="bg-white rounded-2xl p-4">
            <div className="text-xs text-[#686562]">{x.t}</div>
            <div className="text-sm font-medium text-[#222222] mt-1">{x.v}</div>
            {x.d && <div className="text-[11px] text-[#9E9B97] mt-1">{x.d}</div>}
          </div>
        ))}
      </div>

      <h2 className="text-sm font-medium text-[#222222] pt-1">Ficha no formato da exportação</h2>
      <div className="overflow-x-auto bg-white p-4 rounded-2xl">
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: 760,
            tableLayout: 'fixed',
            fontSize: 13,
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
            <tr>
              <td
                colSpan={4}
                style={{ ...val, fontWeight: 700, fontSize: 24, padding: 18 }}
              >
                {po.codigoPO}
              </td>
              <td style={{ ...val, fontWeight: 700, fontSize: 24 }}>
                Rev. {po.revisao}
              </td>
            </tr>
            <tr>
              <td style={tit}>Operação</td>
              <td colSpan={4} style={cel}>
                {po.operacao}
              </td>
            </tr>
            <tr>
              <td style={tit}>Agrupamento família</td>
              <td style={tit}>Tamanho</td>
              <td style={tit}>
                Medidas da peça
                <br />
                (em m)
              </td>
              <td style={tit}>Pontos/cm</td>
              <td style={tit}>
                Perímetro costura
                <br />
                (em m)
              </td>
            </tr>
            <tr>
              <td style={val}>{po.familia}</td>
              <td style={val}>{po.tamanho}</td>
              <td style={val}>{po.medidas}</td>
              <td style={val}>{num(po.pontosCm)}</td>
              <td style={val}>{num(po.perimetroM)}</td>
            </tr>
            <tr>
              <td style={tit}>Cód. Eqp.</td>
              <td style={tit}>Equipamento</td>
              <td style={tit}>RPM - limite inferior</td>
              <td style={tit}>RPM - padrão</td>
              <td style={tit}>RPM - limite superior</td>
            </tr>
            <tr>
              <td style={val}>{m?.codigo}</td>
              <td style={val}>{m?.descricao}</td>
              <td style={val}>{m?.rpmMin}</td>
              <td style={val}>{m?.rpmPadrao}</td>
              <td style={val}>{m?.rpmMax}</td>
            </tr>
            <tr>
              <td style={tit}>Código do elemento</td>
              <td colSpan={2} style={tit}>
                Elementos
              </td>
              <td style={tit}>Frequência</td>
              <td style={tit}>Tempos (em minutos)</td>
            </tr>
            <tr>
              <td style={{ ...amarelo, fontWeight: 700 }}>FIXO</td>
              <td colSpan={2} style={amarelo}>
                Tempo de costura
              </td>
              <td style={amarelo}>1</td>
              <td style={amarelo}>{min4(po.tempoFixo)}</td>
            </tr>
            {po.itens.map((i) => (
              <tr key={i.ordem}>
                <td style={{ ...val, fontWeight: 700 }}>{i.codigo}</td>
                <td colSpan={2} style={cel}>
                  {i.descricao}
                </td>
                <td style={cel}>{i.frequencia}</td>
                <td style={cel}>{min4(i.tempo)}</td>
              </tr>
            ))}
            <tr>
              <td style={tit}>TP</td>
              <td colSpan={3} style={tit}>
                Tempo total da operação
              </td>
              <td style={tit}>{min4(po.tp)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
