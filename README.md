# Auto-T&M Karsten

Solução para o **Hackathon Auto-T&M Karsten**: automatiza a formação de tempos operacionais da Engenharia de Tempos e Métodos e gera a ficha padronizada de **Processo Operacional (PO)**.

O usuário informa o produto, a máquina e a sequência de procedimentos MTM. O sistema busca os cadastros, calcula os tempos, gera o código da PO e exporta a ficha em Excel no formato do modelo oficial.

## 🌐 Acesso Online (Demo)

A aplicação está disponível online para testes:

- **URL:** [https://karsten.therionej.com.br](https://karsten.therionej.com.br)
- **Usuário (E-mail):** `admin@gmail.com`
- **Senha:** `admin123`

---

| Pasta | Conteúdo |
|---|---|
| `backend/` | API em Node.js + Express + MongoDB. **Documentação em [`backend/README.md`](backend/README.md)** |
| `frontend/` | Interface em React + Vite |

## Como rodar localmente

Pré-requisitos: Node 18 ou mais novo e um banco MongoDB (Atlas ou local).

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
# configure MongoDB e as credenciais privadas do Firebase Admin no .env
npm run seed              # cadastra máquinas, elementos MTM e habilita o UID administrador
npm run dev               # API em http://localhost:3333/api
```

No MongoDB Atlas, libere o seu IP em *Network Access*.

**2. Firebase**

No Firebase Console, crie um projeto, habilite o provedor **E-mail/senha** em Authentication e crie o usuário administrador em **Authentication > Users**. Configure o UID desse usuário em `ADMIN_FIREBASE_UID` no `backend/.env`; o `npm run seed` concede a ele o perfil ADM. Gere uma chave de conta de serviço para o backend e preencha as variáveis `FIREBASE_*` do mesmo arquivo.

**3. Frontend** (em outro terminal)

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Copie `frontend/.env.example` para `frontend/.env` e preencha os dados do app Web em Firebase Console > Project settings > General. O login é feito com o e-mail e a senha cadastrados no Firebase. Outros usuários também precisam ser incluídos na coleção `usuarios` com seu UID e perfil para acessar a API.

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

- **Revisões da PO** (Rev. 01, 02...): hoje toda PO nasce como Rev. 00.