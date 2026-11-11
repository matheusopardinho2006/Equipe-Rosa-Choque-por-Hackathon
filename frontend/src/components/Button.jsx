const variantes = {
  // Ações principais: criar, salvar, avançar
  primario:
    'bg-[#736F6B] hover:bg-[#5E5A56] text-white border border-transparent',

  // Ações secundárias: importar, voltar, cancelar
  secundario:
    'bg-white hover:bg-[#F2F1EE] text-[#55524F] border border-[#C8C6C1]',

  // Ações dentro das tabelas
  editar:
    'bg-[#736F6B] hover:bg-[#5E5A56] text-white border border-transparent',

  // Exclusão: neutra, com destaque ao passar o mouse
  excluir:
    'bg-[#F2F1EE] hover:bg-red-50 text-[#686562] hover:text-red-700 border border-transparent',

  // Ações discretas: limpar filtros, opções auxiliares
  neutro:
    'bg-[#F2F1EE] hover:bg-[#E5E3DD] text-[#55524F] border border-transparent',
};

const tamanhos = {
  pequeno: 'h-8 px-4 text-xs rounded-full',
  medio: 'h-11 px-5 text-sm rounded-xl',
  grande: 'h-12 px-6 text-sm rounded-xl',
};

export default function Button({
  children,
  variante = 'primario',
  tamanho = 'medio',
  type = 'button',
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium font-sans text-center
        whitespace-nowrap
        transition-colors duration-200
        cursor-pointer
        disabled:opacity-50
        disabled:cursor-not-allowed
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#736F6B]
        focus-visible:ring-offset-2
        ${variantes[variante] || variantes.primario}
        ${tamanhos[tamanho] || tamanhos.medio}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
