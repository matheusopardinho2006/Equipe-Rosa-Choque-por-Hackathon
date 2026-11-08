# Auto-T&M Karsten

Solução para o **Hackathon Auto-T&M Karsten**: automatiza a formação de tempos operacionais da Engenharia de Tempos e Métodos e gera a ficha padronizada de **Processo Operacional (PO)**.

O usuário informa o produto, a máquina e a sequência de procedimentos MTM. O sistema busca os cadastros, calcula os tempos, gera o código da PO e exporta a ficha em Excel no formato do modelo oficial.

| Pasta | Conteúdo |
|---|---|
| `backend/` | API em Node.js + Express + MongoDB. **Documentação em [`backend/README.md`](backend/README.md)** |
| `frontend/` | Interface em React + Vite (**provisória**, veja abaixo) |

> **Sobre o frontend:** a interface atual é **provisória**. Ela serve para demonstrar e testar o backend (login, cadastros, criação de PO, histórico e exportação), mas ainda será refeita. O backend é independente dela e pode ser usado por qualquer outra interface.

## Como rodar

Pré-requisitos: Node 18 ou mais novo e um banco MongoDB (Atlas ou local).

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
# edite o .env e cole a MONGO_URI do seu banco
npm run seed              # cadastra máquinas, elementos MTM e o usuário admin
npm run dev               # API em http://localhost:3333/api
```

No MongoDB Atlas, libere o seu IP em *Network Access*.

**2. Frontend** (em outro terminal)

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Login: `admin` / `admin123`.

## O que o sistema faz

- **Cadastros:** máquinas (código, modelo, RPM e tempo por metro) e procedimentos MTM (código, descrição e tempo), com inclusão, edição e exclusão. Os procedimentos também podem ser importados de uma planilha.
- **Criar PO:** por um formulário em etapas (produto → máquina → procedimentos → revisar) ou importando um arquivo **JSON, Excel, CSV ou TXT** com uma ou várias POs.
- **Cálculo:**
  - **FIXO** = perímetro de costura × tempo por metro da máquina
  - cada procedimento = tempo do catálogo × frequência
  - **TP** = FIXO + soma dos procedimentos
- **Código automático:** `PO-<sigla da família>-<número>`, por exemplo PO-SL-001 para Sobre-lençol. Toda PO nasce Rev. 00.
- **Ficha PO:** exibida na tela e exportada em Excel no layout do modelo oficial.
- **Histórico:** lista das POs geradas, com busca, abertura da ficha e exclusão.

Cenário oficial do evento (Sobre-lençol Solteiro, máquina 1, elementos 2.1, 1.1, 3.1): **FIXO 0,6709 min e TP 0,9409 min**. Esse resultado é conferido por testes automáticos (`npm test` no backend), e o arquivo `backend/exemplos/demanda-PO-SL-001.json` gera exatamente essa PO.

## Observações sobre os dados

- O kit do evento não trouxe a aba de máquinas (TEMPO-CM). O tempo por metro da máquina 1 (Interlock, **0,0964 min/m**) foi **deduzido do gabarito** (0,6709 ÷ 6,96 m).
- As máquinas 2 e 3 são **fictícias**, só para demonstração. Os dados reais podem ser cadastrados pela tela de Máquinas.
- O padrão do código da PO (`PO-SL-001`) foi deduzido do único exemplo do kit.

## Próximos passos

- Refazer o **frontend** definitivo.
- **Revisões da PO** (Rev. 01, 02...): o botão já existe na ficha, com o aviso "a implementar".
- **Importar máquinas por planilha**, como já é feito com os procedimentos MTM.
