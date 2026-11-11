# Backend — Auto-T&M Karsten

API em **Node.js + Express + MongoDB** que calcula os tempos de uma operação de costura e gera a ficha de Processo Operacional (PO).

## Como rodar

```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run seed              # cadastra os dados e habilita o UID Firebase como ADM
npm run dev               # http://localhost:3333/api
```

Antes do seed, crie um usuário em **Firebase Authentication > Users** e configure o `ADMIN_FIREBASE_UID` dele no `.env`. Habilite o provedor **E-mail/senha** em **Authentication > Sign-in method**. O backend também precisa de uma chave de conta de serviço Firebase (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY`); gere-a em **Project settings > Service accounts** e mantenha-a privada. O `.env` do frontend contém somente a configuração pública do app web.

| Comando | O que faz |
|---|---|
| `npm test` | Roda os testes (incluindo o gabarito: FIXO 0,6709 e TP 0,9409) |
| `npm run limpar-pos` | Apaga todas as POs e zera a numeração (use antes da demo) |

Todas as rotas protegidas, inclusive `/auth/me`, exigem um Firebase ID token válido no cabeçalho `Authorization: Bearer <token>`.

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
| GET | `/auth/me` | Valida a sessão e devolve o perfil autorizado |
| GET/POST/PUT/DELETE | `/maquinas[/:codigo]` | Cadastro de máquinas |
| POST | `/maquinas/importar` | Importa máquinas de Excel/CSV (colunas `codigo`, `descricao`, `rpmPadrao`, `tempoPorMetro`, `rpmMin`, `rpmMax`) |
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

O login acontece no Firebase no frontend. Todas as rotas de negócio exigem `Authorization: Bearer <Firebase ID token>`; o backend verifica assinatura, validade e revogação do token e confere se o UID está cadastrado na coleção `usuarios`. Um usuário autenticado no Firebase sem UID provisionado recebe `403`. O seed habilita o UID de `ADMIN_FIREBASE_UID` como `ADM`; não há mais usuário/senha local nem endpoint de login com JWT próprio.

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

### Importação de cadastros (máquinas e elementos MTM)

`POST /maquinas/importar` e `POST /elementos/importar`, com o arquivo **Excel ou CSV** no campo `arquivo`. Primeira linha = cabeçalho, um cadastro por linha.

- **Máquinas:** `codigo`, `descricao`, `rpmPadrao`, `tempoPorMetro`, `rpmMin`, `rpmMax` (os dois últimos podem ficar vazios = ±10%). Também aceita os títulos em português (`Código`, `Modelo`, `RPM Padrão`, `Tempo por metro (min/m)`...).
- **Elementos:** `codigo`, `descricao`, `tempo`.
- CSV no padrão brasileiro (`;` e vírgula decimal), do Google Planilhas (`,` com decimal entre aspas) ou americano (`,` e ponto decimal).
- Código novo é criado; código existente é atualizado. Linhas inválidas voltam em `erros`, com o motivo:

```json
{ "lidos": 3, "inseridos": 1, "atualizados": 1, "erros": [{ "linha": 4, "erro": { "tempoPorMetro": ["Informe um número"] } }] }
```

## Exportação Excel

`GET /pos/:id/excel` gera `PO-SL-001_Rev00.xlsx` no layout do modelo oficial da ficha fornecido pela organização: cabeçalho, linha FIXO em amarelo, elementos e, no final, o **TP** como fórmula de soma.

## Observações sobre os dados

- O tempo por metro da máquina 1 (Interlock, **0,0964 min/m**) foi deduzido do gabarito: 0,6709 ÷ 6,96.
- As máquinas 2 e 3 são **fictícias**, porque o kit não trouxe a aba TEMPO-CM.
- Excluir uma máquina ou um elemento MTM **apaga do banco**. As POs antigas não mudam, porque guardam uma cópia dos dados.

## Próximos passos

- **Revisões da PO** (Rev. 01, 02...): o botão já existe no front, com o aviso "a implementar".
