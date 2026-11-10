import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { posApi } from '../services/api';
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

  useEffect(() => {
    posApi.buscar(id).then(setPo);
  }, [id]);

  if (!po) return <p className="text-sm text-[#686562] p-4">Carregando…</p>;
  const m = po.maquina;

  return (
    <section className="bg-[#F2F1EE] border border-[#C8C6C1] rounded-3xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-[#222222] m-0">
          Ficha de Processo Operacional
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAviso(true)}
            className="bg-white hover:bg-[#E5E3DD] border border-[#C8C6C1] text-[#222222] rounded-xl px-4 py-2 text-xs cursor-pointer"
          >
            Revisar
          </button>
          <button
            type="button"
            onClick={() => posApi.baixarExcel(po)}
            className="bg-[#686562] hover:bg-[#55524F] text-white rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
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

      <div className="overflow-x-auto bg-white p-4 rounded-2xl border border-[#C8C6C1]">
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
