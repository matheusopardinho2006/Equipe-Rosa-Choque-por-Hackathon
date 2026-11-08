# Backend — Auto-T&M Karsten

API em **Node.js + Express + MongoDB** que calcula os tempos de uma operação de costura e gera a ficha de Processo Operacional (PO).

## Como rodar

```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env  → preencha a MONGO_URI
npm run seed              # cadastra máquinas, elementos MTM e o usuário admin
npm run dev               # http://localhost:3333/api
```

| Comando | O que faz |
|---|---|
| `npm test` | Roda os testes (incluindo o gabarito: FIXO 0,6709 e TP 0,9409) |
| `npm run limpar-pos` | Apaga todas as POs e zera a numeração (use antes da demo) |

Login padrão: `admin` / `admin123`. Toda rota, exceto o login, exige o cabeçalho `Authorization: Bearer <token>`.

## Organização

```
src/
  routes/       todas as rotas em /api
  controllers/  recebem a requisição e respondem
  services/     regras: cálculo, criação da PO, importação, exportação Excel
  models/       coleções do MongoDB
  validators/   regras de validação dos dados
```

**Coleções:** `maquinas`, `elementos` (catálogo MTM), `pos` (fichas geradas), `contadors` (numeração das POs) e `usuarios`.

## Rotas

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Login, devolve o token |
| GET/POST/PUT/DELETE | `/maquinas[/:codigo]` | Cadastro de máquinas |
| GET/POST/PUT/DELETE | `/elementos[/:codigo]` | Cadastro de elementos MTM |
| POST | `/elementos/importar` | Importa elementos de Excel/CSV (colunas `codigo`, `descricao`, `tempo`) |
| POST | `/pos/preview` | Valida e calcula, sem salvar |
| POST | `/pos` | Cria a PO |
| POST | `/pos/importar` | Cria POs a partir de arquivo |
| GET | `/pos` | Histórico (`?busca=` por código ou família) |
| GET | `/pos/:id` | Uma PO |
| DELETE | `/pos/:id` | Apaga a PO |
| GET | `/pos/:id/excel` | Baixa a ficha em Excel |

Erros sempre voltam como `{ "erro": "mensagem", "detalhes": { "campo": ["motivo"] } }`.

## Dados de entrada da PO

Todos obrigatórios:

```json
{
  "familia": "Sobre-lençol",
  "tamanho": "Solteiro",
  "medidas": "1,80 x 2,50",
  "pontosCm": 2.5,
  "perimetroM": 6.96,
  "operacao": "Bainhar no corpo do SL - 1 lado",
  "maquina": 1,
  "elementos": ["2.1", "1.1", "3.1"]
}
```

- Números aceitam vírgula ou ponto (`"6,96"`).
- `medidas` no formato largura x comprimento.
- `elementos` na ordem de execução, como lista ou texto (`"2.1, 1.1, 3.1"`). Frequência opcional com `x`: `"4.1x2"`.
- Máquina e elementos precisam existir no cadastro.

## Cálculo

| Item | Fórmula |
|---|---|
| FIXO (costura de máquina) | perímetro (m) × tempo por metro da máquina (min/m) |
| Elemento MTM | tempo do catálogo × frequência |
| TP (tempo total) | FIXO + soma dos elementos |

Arredondamento em 4 casas. Gabarito: 6,96 × 0,0964 = **0,6709** → 0,6709 + 0,15 + 0 + 0,12 = **0,9409**.

A PO guarda uma **cópia** da máquina e dos elementos usados: alterar um cadastro depois não muda fichas já geradas.

## Código da PO

`PO-<sigla>-<sequencial>`, gerado pela família: as iniciais das palavras ("Sobre-lençol" → **SL**) ou 2 letras se for uma palavra só ("Fronha" → **FR**). Exemplos: PO-SL-001, PO-SL-002, PO-FR-001. Toda PO nasce **Rev. 00**.

Números de POs apagadas **não são reaproveitados**, para que duas fichas nunca tenham o mesmo código.

## Importação de arquivo

`POST /pos/importar` com o arquivo no campo `arquivo` (até 5 MB). Exemplos prontos em `exemplos/`.

| Formato | Como montar |
|---|---|
| JSON | O mesmo objeto acima, ou uma lista deles |
| Excel / CSV | Primeira linha = cabeçalho, uma PO por linha. CSV aceita `,` ou `;` |
| TXT | Uma linha `Campo: valor` por campo; várias POs separadas por linha em branco |

O cabeçalho pode usar os nomes técnicos (`familia`, `perimetroM`...) ou os títulos da ficha (`Agrupamento família`, `Perímetro costura (em m)`, `Cód. Eqp.`...).

Cada registro é validado separadamente: os válidos viram PO e os inválidos voltam com o motivo:

```json
[
  { "linha": 1, "ok": true, "codigoPO": "PO-SL-001", "tp": 0.9409 },
  { "linha": 2, "ok": false, "erro": { "tamanho": ["Campo obrigatório"] } }
]
```

## Exportação Excel

`GET /pos/:id/excel` gera `PO-SL-001_Rev00.xlsx` no layout do modelo oficial da ficha fornecido pela organização: cabeçalho, linha FIXO em amarelo, elementos e, no final, o **TP** como fórmula de soma.

## Observações sobre os dados

- O tempo por metro da máquina 1 (Interlock, **0,0964 min/m**) foi deduzido do gabarito: 0,6709 ÷ 6,96.
- As máquinas 2 e 3 são **fictícias**, porque o kit não trouxe a aba TEMPO-CM.
- Excluir máquina ou elemento só os desativa; eles continuam no banco por causa das POs antigas.

## Próximos passos

- **Revisões da PO** (Rev. 01, 02...): o botão já existe no front, com o aviso "a implementar".
- **Importar máquinas por planilha**: a função já existe no `crud.factory`; falta ligar a rota e o botão.
