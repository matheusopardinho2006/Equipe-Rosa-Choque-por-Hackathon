export default function Stepper({ etapas = [], atual = 0, onChange }) {
  const total = etapas.length;

  if (total === 0) return null;

  const etapaAtual = Math.max(
    0,
    Math.min(atual, total - 1)
  );

  const pct =
    total > 1
      ? Math.round((etapaAtual / (total - 1)) * 100)
      : 100;

  return (
    <div className="w-full font-sans">

      {/* INFORMAÇÕES DE PROGRESSO */}
      <div className="flex items-center justify-between gap-4 mb-4">

        <span className="text-sm font-medium text-[#686562]">
          Etapa {etapaAtual + 1} de {total}
        </span>

        <span className="text-sm font-semibold text-[#736F6B] tabular-nums">
          {pct}%
        </span>

      </div>

      {/* BARRA DE PROGRESSO */}
      <div
        className="w-full h-2.5 bg-[#E6E4DF] rounded-full overflow-hidden mb-6 lg:mb-7"
        role="progressbar"
        aria-label="Progresso das etapas"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[#736F6B] rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* ETAPAS */}
      <div
        className="grid gap-2 sm:gap-3"
        style={{
          gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`,
        }}
      >

        {etapas.map((etapa, i) => {
          const concluida = i < etapaAtual;
          const ativa = i === etapaAtual;
          const clicavel =
            concluida && typeof onChange === 'function';

          return (
            <button
              key={`${i}-${etapa}`}
              type="button"
              disabled={!clicavel}
              onClick={() => {
                if (clicavel) {
                  onChange(i);
                }
              }}
              aria-current={ativa ? 'step' : undefined}
              aria-label={`Etapa ${i + 1}: ${etapa}${
                concluida
                  ? ', concluída'
                  : ativa
                  ? ', atual'
                  : ', pendente'
              }`}
              className={`
                flex flex-col sm:flex-row
                items-center justify-center
                gap-2 sm:gap-3
                min-h-[76px] sm:min-h-[68px]
                px-1.5 sm:px-4 py-3
                rounded-xl border
                text-center sm:text-left
                transition-colors duration-200
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#736F6B]
                focus-visible:ring-offset-2
                ${
                  ativa
                    ? 'bg-[#F2F1EE] border-[#736F6B] text-[#222222]'
                    : concluida
                    ? 'bg-white border-[#C8C6C1] text-[#686562] hover:bg-[#F2F1EE]'
                    : 'bg-white border-[#E6E4DF] text-[#9E9B97]'
                }
                ${
                  clicavel
                    ? 'cursor-pointer'
                    : 'cursor-default'
                }
              `}
            >

              {/* NÚMERO OU CONFIRMAÇÃO */}
              <span
                className={`
                  w-8 h-8 shrink-0
                  rounded-full
                  flex items-center justify-center
                  text-sm font-semibold
                  ${
                    ativa || concluida
                      ? 'bg-[#736F6B] text-white'
                      : 'bg-[#F2F1EE] text-[#9E9B97]'
                  }
                `}
              >
                {concluida ? '✓' : i + 1}
              </span>

              {/* NOME DA ETAPA */}
              <span
                className={`
                  text-[11px] sm:text-sm
                  leading-snug
                  break-words min-w-0
                  ${
                    ativa
                      ? 'font-semibold'
                      : 'font-medium'
                  }
                `}
              >
                {etapa}
              </span>

            </button>
          );
        })}

      </div>
    </div>
  );
}

