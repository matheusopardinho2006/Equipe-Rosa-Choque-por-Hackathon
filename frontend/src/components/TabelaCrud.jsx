// Tabela genérica de cadastro (usada em Elementos e Máquinas)
export default function TabelaCrud({ colunas, linhas, chave = 'codigo', onEditar, onExcluir }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {colunas.map((c) => <th key={c.campo} className={c.num ? 'num' : ''}>{c.titulo}</th>)}
            <th className="num">Ações</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l[chave]}>
              {colunas.map((c) => <td key={c.campo} className={c.num ? 'num' : ''}>{c.formatar ? c.formatar(l[c.campo]) : l[c.campo]}</td>)}
              <td className="num" style={{ whiteSpace: 'nowrap' }}>
                {onEditar && <button onClick={() => onEditar(l)}>Editar</button>}{' '}
                {onExcluir && <button onClick={() => onExcluir(l)}>Excluir</button>}
              </td>
            </tr>
          ))}
          {!linhas.length && <tr><td colSpan={colunas.length + 1} className="muted">Nenhum registro.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
