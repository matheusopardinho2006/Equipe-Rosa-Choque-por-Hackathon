import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { posApi } from '../services/api';
import { min4 } from '../utils/format';

// Mesma disposição da planilha exportada (colunas A–E).
const SERIF = { fontFamily: "'Times New Roman', Times, serif" };
const cel = { border: '1px solid #000', padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle' };
const tit = { ...cel, background: '#d9d9d9', fontWeight: 700 };
const val = { ...cel, ...SERIF };
const amarelo = { ...val, background: '#ffff00' };
const num = (v) => (v == null || v === '' ? '' : String(v));

export default function FichaPO() {
  const { id } = useParams();
  const [po, setPo] = useState(null);
  const [aviso, setAviso] = useState(false);

  useEffect(() => { posApi.buscar(id).then(setPo); }, [id]);
  if (!po) return <p>Carregando…</p>;
  const m = po.maquina;

  return (
    <section className="card">
      <div className="row">
        <h1 style={{ margin: 0, fontSize: 20 }}>Ficha de Processo Operacional</h1>
        <div className="row">
          <button onClick={() => setAviso(true)}>Revisar</button>
          <button className="primary" onClick={() => posApi.baixarExcel(po)}>Exportar Excel</button>
        </div>
      </div>
      {aviso && (
        <div style={{ border: '2px dashed #888', padding: 12, background: '#f7f7f7' }}>
          <strong>Revisão de PO: a implementar.</strong> Esta função ainda não está disponível.{' '}
          <button style={{ minHeight: 30, marginLeft: 8 }} onClick={() => setAviso(false)}>OK</button>
        </div>
      )}

      <div className="table-wrap" style={{ border: 'none' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: 760, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '18%' }} /><col style={{ width: '24%' }} /><col style={{ width: '20%' }} /><col style={{ width: '16%' }} /><col style={{ width: '22%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td colSpan={4} style={{ ...val, fontWeight: 700, fontSize: 24, padding: 18 }}>{po.codigoPO}</td>
              <td style={{ ...val, fontWeight: 700, fontSize: 24 }}>Rev. {po.revisao}</td>
            </tr>
            <tr>
              <td style={tit}>Operação</td>
              <td colSpan={4} style={cel}>{po.operacao}</td>
            </tr>
            <tr>
              <td style={tit}>Agrupamento família</td>
              <td style={tit}>Tamanho</td>
              <td style={tit}>Medidas da peça<br />(em m)</td>
              <td style={tit}>Pontos/cm</td>
              <td style={tit}>Perímetro costura<br />(em m)</td>
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
              <td style={val}>{m.codigo}</td>
              <td style={val}>{m.descricao}</td>
              <td style={val}>{m.rpmMin}</td>
              <td style={val}>{m.rpmPadrao}</td>
              <td style={val}>{m.rpmMax}</td>
            </tr>
            <tr>
              <td style={tit}>Código do elemento</td>
              <td colSpan={2} style={tit}>Elementos</td>
              <td style={tit}>Frequência</td>
              <td style={tit}>Tempos (em minutos)</td>
            </tr>
            <tr>
              <td style={{ ...amarelo, fontWeight: 700 }}>FIXO</td>
              <td colSpan={2} style={amarelo}>Tempo de costura</td>
              <td style={amarelo}>1</td>
              <td style={amarelo}>{min4(po.tempoFixo)}</td>
            </tr>
            {po.itens.map((i) => (
              <tr key={i.ordem}>
                <td style={{ ...val, fontWeight: 700 }}>{i.codigo}</td>
                <td colSpan={2} style={cel}>{i.descricao}</td>
                <td style={cel}>{i.frequencia}</td>
                <td style={cel}>{min4(i.tempo)}</td>
              </tr>
            ))}
            <tr>
              <td style={tit}>TP</td>
              <td colSpan={3} style={tit}>Tempo total da operação</td>
              <td style={tit}>{min4(po.tp)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
