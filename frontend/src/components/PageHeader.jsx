export default function PageHeader({
  titulo,
  subtitulo,
  children,
}) {
  return (
    <header className="w-full flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-8">

      {/* TÍTULO E DESCRIÇÃO */}
      <div className="min-w-0 flex-1">

        <h1 className="text-[28px] sm:text-[30px] font-normal text-[#686562] leading-tight break-words">
          {titulo}
        </h1>

        {subtitulo && (
          <p className="text-sm text-[#686562] mt-2 leading-relaxed max-w-[850px]">
            {subtitulo}
          </p>
        )}

      </div>

      {/* AÇÕES DO CABEÇALHO */}
      {children && (
        <div className="flex flex-wrap items-center gap-3 lg:justify-end lg:shrink-0">
          {children}
        </div>
      )}

    </header>
  );
}
