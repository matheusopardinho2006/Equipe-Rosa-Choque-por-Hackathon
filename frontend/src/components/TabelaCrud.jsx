import Button from './Button';

export default function TabelaCrud({
  colunas = [],
  linhas = [],
  chave = 'codigo',
  onEditar,
  onExcluir,
}) {
  const temAcoes = Boolean(onEditar || onExcluir);

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#E6E4DF] bg-white">

      <table className="w-full min-w-[650px] border-collapse text-sm">

        {/* CABEÇALHO */}
        <thead>
          <tr className="bg-[#F2F1EE] text-[#686562]">

            {colunas.map((coluna) => (
              <th
                key={coluna.campo}
                scope="col"
                className={`py-5 px-4 font-semibold whitespace-nowrap ${
                  coluna.num
                    ? 'text-center'
                    : 'text-left'
                }`}
              >
                {coluna.titulo}
              </th>
            ))}

            {temAcoes && (
              <th
                scope="col"
                className="py-5 px-4 text-center font-semibold"
              >
                Ações
              </th>
            )}

          </tr>
        </thead>

        {/* CONTEÚDO */}
        <tbody className="divide-y divide-[#E6E4DF]">

          {linhas.map((linha, indice) => (
            <tr
              key={linha[chave] ?? indice}
              className="hover:bg-[#FAF9F7] transition-colors text-[#222222]"
            >

              {/* COLUNAS */}
              {colunas.map((coluna) => (
                <td
                  key={coluna.campo}
                  className={`py-4 lg:py-5 px-4 align-middle ${
                    coluna.num
                      ? 'text-center tabular-nums'
                      : 'text-left'
                  }`}
                >
                  {coluna.formatar
                    ? coluna.formatar(linha[coluna.campo])
                    : linha[coluna.campo] ?? '—'}
                </td>
              ))}

              {/* AÇÕES */}
              {temAcoes && (
                <td className="py-4 lg:py-5 px-4 text-center">

                  <div className="flex items-center justify-center gap-2">

                    {onEditar && (
                      <Button
                        variante="editar"
                        tamanho="pequeno"
                        onClick={() => onEditar(linha)}
                        aria-label={`Editar registro ${
                          linha[chave] ?? ''
                        }`}
                      >
                        Editar
                      </Button>
                    )}

                    {onExcluir && (
                      <Button
                        variante="excluir"
                        tamanho="pequeno"
                        onClick={() => onExcluir(linha)}
                        aria-label={`Excluir registro ${
                          linha[chave] ?? ''
                        }`}
                      >
                        Excluir
                      </Button>
                    )}

                  </div>

                </td>
              )}

            </tr>
          ))}

          {/* ESTADO VAZIO */}
          {linhas.length === 0 && (
            <tr>
              <td
                colSpan={colunas.length + (temAcoes ? 1 : 0)}
                className="py-16 px-4 text-center"
              >
                <div className="flex flex-col items-center justify-center gap-2">

                  <p className="text-sm font-medium text-[#686562]">
                    Nenhum registro encontrado.
                  </p>

                  <p className="text-xs text-[#9E9B97]">
                    Os registros cadastrados aparecerão aqui.
                  </p>

                </div>
              </td>
            </tr>
          )}

        </tbody>
      </table>

    </div>
  );
}
