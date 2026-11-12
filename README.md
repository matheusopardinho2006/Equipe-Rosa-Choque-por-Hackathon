# Auto-T&M Karsten

Solução desenvolvida pela equipe **Therion Empresa Júnior** para o **Hackathon Auto-T&M Karsten**: automatiza a formação de tempos operacionais da Engenharia de Tempos e Métodos (T&M), realiza análises comparativas de eficiência produtiva e gera a ficha padronizada de **Processo Operacional (PO)** tanto em versão **Web** quanto em aplicação **Desktop (Electron)**.

O usuário informa o produto, a máquina e a sequência de procedimentos MTM (ou importa arquivos em múltiplos formatos). O sistema valida os cadastros, calcula os tempos operacionais automaticamente, gera o código padronizado da PO e exporta as fichas em Excel no formato oficial da Karsten.

---

## 🌐 Acesso Online (Demo Web)

A aplicação está disponível online para avaliação e testes imediatos:

- **URL:** [https://karsten.therionej.com.br](https://karsten.therionej.com.br)
- **Usuário (E-mail):** `admin@gmail.com`
- **Senha:** `admin123`

---

## 📁 Estrutura do Projeto

| Pasta / Arquivo | Conteúdo |
|---|---|
| `backend/` | API REST em Node.js + Express + MongoDB + Firebase Admin. **Documentação detalhada em [`backend/README.md`](backend/README.md)** |
| `frontend/` | Interface em React + Vite seguindo a Identidade Visual (IDV) oficial da Karsten |
| `electron/` | Aplicação Desktop nativa via Electron (gerencia a janela nativa, diálogos do SO e inicialização automática da API) |
| `Iniciar-AutoTM-Desktop.bat` | Inicializador rápido (1 clique) para abrir a versão Desktop no Windows |

---

## 🖥️ Utilização da Versão Desktop (Electron) e Sua Utilidade

### Por que uma versão Desktop?
No ambiente fabril e de Engenharia de Processos, a disponibilidade de uma **aplicação Desktop nativa** traz vantagens práticas essenciais para a rotina da Karsten:
1. **Acesso rápido no chão de fábrica e escritórios de engenharia:** funciona como um programa nativo do Windows na barra de tarefas, sem depender de abas de navegador abertas.
2. **Autonomia de execução (Auto-Start):** o aplicativo Desktop verifica automaticamente se o servidor da API local já está rodando; caso não esteja, **o próprio Electron inicia o backend em segundo plano** e o encerra quando o programa é fechado.
3. **Leitura e exportação ágil de planilhas locais:** integração direta com o sistema de arquivos do sistema operacional para importar lotes de demandas (`.xlsx`, `.csv`, `.json`, `.txt`) e salvar fichas técnicas em Excel.
4. **Estabilidade de autenticação e rotas:** utiliza um servidor local integrado que mantém compatibilidade total com o Firebase Authentication e com todos os recursos da versão Web.

### Como rodar a versão Desktop passo a passo

**Pré-requisito:** ter o Node.js (v18+) instalado e os arquivos `.env` configurados (veja a seção *Como rodar localmente* abaixo).

#### Opção 1 — Pelo atalho de 1 clique (Windows)
1. Na pasta raiz do projeto, dê **dois cliques** no arquivo **`Iniciar-AutoTM-Desktop.bat`**.
2. O script atualizará o build da interface e abrirá a janela nativa do **Auto-T&M Karsten** automaticamente.

#### Opção 2 — Pelo terminal (na raiz do projeto)
```bash
# 1. Instale as dependências da raiz (apenas na primeira vez)
npm install

# 2. Compila a interface atualizada e abre o aplicativo Desktop
npm run desktop

# Ou, para abrir instantaneamente sem recompilar o frontend:
npm run desktop:dev
```

#### Opção 3 — Pelo terminal (dentro da pasta `frontend/`)
```bash
cd frontend
npm run electron
```

#### Atalhos disponíveis na janela Desktop
- `Ctrl + N`: Ir diretamente para a tela de **Nova PO**
- `Ctrl + R` / `F5`: Recarregar os dados da tela atual
- `Ctrl + +` / `Ctrl + -` / `Ctrl + 0`: Ajustar o zoom da interface para monitores industriais
- `F11`: Alternar modo de Tela Cheia

---

## ⚙️ Como rodar o ambiente completo localmente (Web / Desenvolvimento)

Pré-requisitos: Node 18 ou mais novo e um banco MongoDB (Atlas ou container Docker local).

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
# configure MONGO_URI e as credenciais do Firebase Admin no arquivo .env
npm run seed              # cadastra máquinas, elementos MTM e habilita o UID administrador
npm run dev               # API disponível em http://localhost:3333/api
```

### 2. Firebase
No Firebase Console, habilite o provedor **E-mail/senha** em *Authentication* e crie o usuário administrador em *Authentication > Users*. Configure o UID desse usuário em `ADMIN_FIREBASE_UID` no `backend/.env`; o comando `npm run seed` concede a ele o perfil `ADM`.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev               # Interface disponível em http://localhost:5173
```

---

## 📖 Tutorial de Uso do Sistema e Utilidade de Cada Módulo

Este guia apresenta o passo a passo de utilização do **Auto-T&M Karsten** e o valor agregado de cada funcionalidade para a Engenharia de Tempos e Métodos:

### 1. Acesso e Autenticação (`/login`)
- **Como usar:** insira seu e-mail corporativo e senha cadastrados (para demonstração: `admin@gmail.com` / `admin123`) e clique em **Entrar**.
- **Utilidade:** garante rastreabilidade e controle de acesso por perfil (usuários autenticados podem consultar, criar, importar e exportar POs; usuários com perfil **ADM** possuem permissão adicional para excluir registros e gerenciar o catálogo base de máquinas e elementos MTM).

---

### 2. Cadastro de POs — Dashboard Principal (`/`)
- **Como usar:** logo após o login, você visualiza os cartões de resumo (**POs geradas**, **Máquinas**, **Elementos MTM** e o botão de destaque **+ Nova PO**), além da tabela de **Histórico de POs**.
  - Utilize a barra de busca para filtrar rapidamente qualquer PO por código, operação, família, tamanho ou máquina.
  - Em cada linha do histórico, você pode clicar em **Abrir** (para ver a ficha completa), **Editar** (para atualizar os dados daquela PO sem precisar excluí-la) ou **Excluir**.
  - No topo direito, clique em **Exportar todas as POs** para baixar uma única planilha `.xlsx` contendo todas as POs cadastradas, organizadas em abas individuais.
- **Utilidade:** centraliza a operação diária do analista de T&M, permitindo consulta instantânea ao acervo de fichas e exportação em massa para auditoria ou compartilhamento com a produção.

---

### 3. Criação e Edição Guiada de PO (`/nova-po` e `/pos/:id/editar`)
O processo de criação (ou edição de uma PO já existente) é dividido em **4 etapas intuitivas** para eliminar erros de preenchimento:

1. **Etapa 1 — Dados do produto:**
   - Preencha o *Agrupamento família* (ex.: `Sobre-lençol`), *Tamanho* (selecione na lista ou digite, ex.: `Solteiro`), *Medidas da peça em metros* (ex.: `1,80 x 2,50`), *Pontos/cm* (ex.: `2,5`), *Perímetro de costura em metros* (ex.: `6,96`) e a descrição da *Operação*.
2. **Etapa 2 — Selecionar máquina:**
   - Escolha visualmente o equipamento que realizará a operação (ex.: `1 · Interlock`, `2 · Reta`, `3 · Overloque`), conferindo o RPM padrão de cada máquina.
3. **Etapa 3 — Procedimentos (MTM):**
   - Adicione os movimentos manuais na ordem exata de execução.
   - **Visualização rápida de opções:** clique no ícone de seta (`▼`) à esquerda do botão **+ Adicionar** (ou clique dentro do campo de busca) para abrir a lista completa de todos os procedimentos MTM disponíveis, visualizando código, descrição e tempo padrão em minutos.
   - Você também pode digitar códigos separados por vírgula e definir repetições com `xN` (ex.: `2.1, 4.1x2, 3.1`) ou ajustar a coluna **Freq.** diretamente na tabela.
4. **Etapa 4 — Revisar e gerar (ou salvar alterações):**
   - Confira o resumo completo dos dados do produto e da sequência MTM e clique em **Gerar PO** (ou **Salvar alterações** no modo de edição).
- **Utilidade:** padroniza o método de cálculo de tempos, impedindo que fórmulas sejam alteradas acidentalmente (erro comum em planilhas manuais) e permitindo corrigir qualquer PO existente mantendo seu código identificador.

---

### 4. Importação Versátil com Tela de Confirmação (`/confirmar-importacao`)
- **Como usar:**
  1. Na Etapa 1 de **Nova PO**, utilize a área **Importar demanda** para enviar um arquivo `.json`, `.xlsx`, `.xls`, `.csv` ou `.txt` contendo **um ou vários procedimentos** (há arquivos de exemplo prontos na raiz do projeto, como `testes-pos.csv`, e na pasta `backend/exemplos/`).
  2. Em vez de cadastrar as POs cegamente no banco, o sistema direciona você para a **Tela de Confirmação de Importação**.
  3. Nessa tela, todos os procedimentos do arquivo são listados com seus tempos (**FIXO**, **Manual**, **TP**, **% Costura** e **Peças/h**) já pré-calculados:
     - **Filtros e Seleção Versátil:** filtre por família, tamanho, máquina, operação ou texto e use os botões rápidos (*Selecionar todas*, *Desmarcar todas*, *Selecionar apenas filtradas*, *Inverter seleção*) ou as caixas de seleção individuais para escolher exatamente quais POs deseja cadastrar.
     - **Editar antes de cadastrar:** caso algum item importado precise de ajuste (ou tenha alguma pendência de validação), clique em **Editar** na linha correspondente para abrir o editor de 4 etapas, corrigir o item e retornar automaticamente à tela de confirmação com os tempos recalculados.
     - **Excluir da lista:** clique em **Excluir** para descartar linhas indesejadas do lote.
  4. Clique em **Confirmar e cadastrar PO(s)** para gravar definitivamente apenas os procedimentos aprovados.
- **Utilidade:** oferece segurança total na migração de dados legados e no processamento de demandas em lote vindas do PCP ou de outras áreas da Karsten.

---

### 5. Visualização da Ficha Técnica e Exportação Individual (`/pos/:id`)
- **Como usar:** ao abrir uma PO, você visualiza:
  - **Indicadores de desempenho:** Tempo Total (TP), Costura de Máquina (FIXO), Tempo Manual (MTM) e Capacidade Teórica em peças por hora (a 100% de eficiência).
  - **Barra visual de composição do tempo:** mostra proporcionalmente quanto do tempo da operação é máquina (`FIXO`) e quanto é manuseio humano (`MTM`).
  - **Ficha Técnica no formato oficial:** reprodução fiel do documento de engenharia da Karsten.
  - Botões no topo para **Editar PO** ou **Exportar Excel** (gera o arquivo `.xlsx` idêntico ao gabarito oficial, com bordas, fontes, cores de destaque e células mescladas).
- **Utilidade:** entrega o documento final pronto para impressão ou distribuição no chão de fábrica, além de permitir leitura visual imediata da distribuição de tempos.

---

### 6. Análise de Procedimentos e Comparativo de Eficiência (`/analise`)
- **Como usar:** acesse **Análise de POs** no menu lateral:
  - Combine os filtros de *Agrupamento família*, *Tamanho*, *Máquina*, *Operação* ou busca textual e marque/desmarque quais POs na tabela inferior deseja incluir no estudo.
  - Todos os indicadores e gráficos da tela se atualizam em tempo real com base nas POs selecionadas:
    1. **KPIs agregados:** Tempo médio das POs selecionadas, percentual médio de costura de máquina vs. trabalho manual e faixa de capacidade produtiva (peças/h).
    2. **Gráfico de distribuição de tempo por PO:** barras horizontais empilhadas comparando `FIXO` vs. `Manual (MTM)` entre diferentes fichas.
    3. **Comparação entre máquinas:** tempo médio e capacidade produtiva agrupados por equipamento.
    4. **Ranking de Elementos MTM (Gargalos Manuais):** lista ordenada dos movimentos manuais que mais consomem tempo nas operações selecionadas.
- **Utilidade:** é o grande diferencial analítico da solução — transforma fichas estáticas em inteligência para a Engenharia de Tempos e Métodos identificar gargalos manuais, comparar máquinas e priorizar melhorias de processo (Kaizen) e automação.

---

### 7. Gestão de Catálogos: Máquinas (`/maquinas`) e Elementos MTM (`/elementos`)
- **Como usar:**
  - Consulte, busque, cadastre novos itens, edite ou exclua máquinas e elementos padrão MTM.
  - Em ambas as telas, o botão **Importar Excel/CSV** permite carregar ou atualizar tabelas inteiras de máquinas e tempos MTM a partir de planilhas.
- **Utilidade:** mantém a base de conhecimento de T&M viva e atualizada sem necessidade de alterar código. Como cada PO gerada salva um *snapshot* da máquina e dos elementos utilizados no momento de sua criação, atualizações futuras no catálogo não distorcem o histórico de fichas já emitidas.

---

## 🧮 Regras de Cálculo e Validação Oficial

- **FIXO (Tempo de costura):** $\text{Perímetro de costura (m)} \times \text{Tempo por metro da máquina (min/m)}$
- **Tempo de cada elemento MTM:** $\text{Tempo unitário do catálogo} \times \text{Frequência}$
- **TP (Tempo Padrão Total):** $\text{FIXO} + \sum \text{Tempos dos elementos MTM}$
- **Código automático:** `PO-<sigla da família>-<sequencial>` (ex.: `PO-SL-001` para Sobre-lençol), iniciando em `Rev. 00`.

> **Validação com o Gabarito Oficial do Hackathon:** para o cenário oficial do evento (*Sobre-lençol Solteiro, máquina 1 Interlock, perímetro 6,96 m, elementos 2.1, 1.1 e 3.1*), o sistema calcula com exatidão **FIXO = 0,6709 min** e **TP = 0,9409 min**, validado por suíte de testes automatizados (`npm test` na pasta `backend`).
