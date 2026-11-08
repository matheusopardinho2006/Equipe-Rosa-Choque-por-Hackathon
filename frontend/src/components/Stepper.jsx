export default function Stepper({ etapas, atual, onChange }) {
  const pct = Math.round((atual / (etapas.length - 1)) * 100);
  return (
    <div className="card">
      <div className="row muted"><span>Etapa {atual + 1} de {etapas.length}</span><span>{pct}%</span></div>
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      <div className="stepper">
        {etapas.map((e, i) => (
          <button key={e} type="button" onClick={() => i < atual && onChange(i)} style={{ fontWeight: i === atual ? 700 : 400, border: 'none' }}>
            {i < atual ? '✓' : i + 1}. {e}
          </button>
        ))}
      </div>
    </div>
  );
}
