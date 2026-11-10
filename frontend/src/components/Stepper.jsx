export default function Stepper({ etapas, atual, onChange }) {
  const pct = Math.round((atual / (etapas.length - 1)) * 100);
  return (
    <div className="bg-[#F2F1EE] border border-[#C8C6C1] rounded-2xl p-5 mb-5">
      <div className="flex justify-between items-center text-xs text-[#686562] mb-2">
        <span>
          Etapa {atual + 1} de {etapas.length}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-white border border-[#C8C6C1] rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-[#686562] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {etapas.map((e, i) => (
          <button
            key={e}
            type="button"
            onClick={() => i < atual && onChange(i)}
            className={`py-1.5 px-2 rounded-lg transition-colors ${
              i === atual
                ? 'font-bold text-[#222222] bg-white shadow-2xs'
                : i < atual
                ? 'text-[#686562] hover:text-[#222222] cursor-pointer'
                : 'text-[#9E9B97] cursor-default'
            }`}
          >
            {i < atual ? '✓' : i + 1}. {e}
          </button>
        ))}
      </div>
    </div>
  );
}
