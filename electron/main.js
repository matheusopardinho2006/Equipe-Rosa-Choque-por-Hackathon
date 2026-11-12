const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const FRONTEND_DIST = path.join(FRONTEND_DIR, 'dist');
const ICON_PATH = path.join(FRONTEND_DIR, 'public', 'logo-karsten2.png');

const BACKEND_PORT = Number(process.env.PORT) || 3333;
const FRONTEND_PORT = 5173;

let mainWindow = null;
let backendProcess = null;
let staticServer = null;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/** Verifica se uma porta local já está respondendo. */
function verificarPortaAtiva(port, host = '127.0.0.1', timeout = 1200) {
  return new Promise((resolve) => {
    const req = http.get({ host, port, path: '/', timeout }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/** Aguarda até que uma porta esteja ativa (com tentativas). */
async function aguardarPorta(port, tentativas = 25, intervaloMs = 400) {
  for (let i = 0; i < tentativas; i++) {
    if (await verificarPortaAtiva(port, '127.0.0.1')) return true;
    if (await verificarPortaAtiva(port, 'localhost')) return true;
    await new Promise((r) => setTimeout(r, intervaloMs));
  }
  return false;
}

/** Inicia o backend Node.js automaticamente caso ainda não esteja rodando. */
async function garantirBackend() {
  const jaAtivo =
    (await verificarPortaAtiva(BACKEND_PORT, '127.0.0.1')) ||
    (await verificarPortaAtiva(BACKEND_PORT, 'localhost'));

  if (jaAtivo) {
    console.log(`[desktop] Backend já está ativo na porta ${BACKEND_PORT}.`);
    return true;
  }

  console.log('[desktop] Iniciando servidor backend automaticamente...');
  const serverScript = path.join(BACKEND_DIR, 'src', 'server.js');

  if (!fs.existsSync(serverScript)) {
    console.error('[desktop] Arquivo do servidor backend não encontrado:', serverScript);
    return false;
  }

  backendProcess = spawn('node', [serverScript], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: String(BACKEND_PORT) },
    stdio: 'inherit',
    windowsHide: true,
  });

  backendProcess.on('error', (err) => {
    console.error('[desktop] Falha ao iniciar processo do backend:', err.message);
  });

  backendProcess.on('exit', (code) => {
    console.log(`[desktop] Processo do backend finalizado (código ${code}).`);
    backendProcess = null;
  });

  return aguardarPorta(BACKEND_PORT, 30, 400);
}

/**
 * Caso o servidor de desenvolvimento Vite (porta 5173) não esteja ativo,
 * sobe um servidor local na porta 5173 servindo `frontend/dist` e fazendo
 * proxy transparente de `/api` para o backend na porta 3333.
 * Isso mantém o domínio `http://localhost:5173` autorizado no Firebase Auth e CORS.
 */
async function garantirFrontendUrl() {
  const viteAtivo =
    (await verificarPortaAtiva(FRONTEND_PORT, 'localhost')) ||
    (await verificarPortaAtiva(FRONTEND_PORT, '127.0.0.1'));

  if (viteAtivo) {
    console.log(`[desktop] Servidor Vite detectado em http://localhost:${FRONTEND_PORT}`);
    return `http://localhost:${FRONTEND_PORT}`;
  }

  console.log(`[desktop] Iniciando servidor local para o build estático em http://localhost:${FRONTEND_PORT}...`);

  return new Promise((resolve) => {
    staticServer = http.createServer((req, res) => {
      const reqUrl = req.url || '/';

      // Proxy de /api para o backend Express
      if (reqUrl.startsWith('/api')) {
        const opcoesProxy = {
          hostname: '127.0.0.1',
          port: BACKEND_PORT,
          path: reqUrl,
          method: req.method,
          headers: { ...req.headers, host: `127.0.0.1:${BACKEND_PORT}` },
        };

        const proxyReq = http.request(opcoesProxy, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });

        proxyReq.on('error', (err) => {
          res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ erro: `Backend indisponível: ${err.message}` }));
        });

        req.pipe(proxyReq, { end: true });
        return;
      }

      // Arquivos estáticos do frontend/dist (com fallback SPA para index.html)
      const cleanPath = decodeURIComponent(reqUrl.split('?')[0]);
      let filePath = path.join(FRONTEND_DIST, cleanPath === '/' ? 'index.html' : cleanPath);

      if (!filePath.startsWith(FRONTEND_DIST)) {
        res.writeHead(403);
        res.end('Acesso negado');
        return;
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(FRONTEND_DIST, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Build do frontend não encontrado. Execute "npm run build" na pasta frontend.');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });

    staticServer.listen(FRONTEND_PORT, '127.0.0.1', () => {
      resolve(`http://localhost:${FRONTEND_PORT}`);
    });

    staticServer.on('error', () => {
      // Caso a porta 5173 esteja ocupada em outro adaptador, usa porta livre
      staticServer.listen(0, '127.0.0.1', () => {
        const addr = staticServer.address();
        resolve(`http://localhost:${addr.port}`);
      });
    });
  });
}

function configurarMenuAplicacao() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Ir para Cadastro de POs',
          click: () => mainWindow?.webContents.executeJavaScript("window.location.href = '/'"),
        },
        {
          label: 'Nova PO',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.executeJavaScript("window.location.href = '/nova-po'"),
        },
        {
          label: 'Análise de POs',
          click: () => mainWindow?.webContents.executeJavaScript("window.location.href = '/analise'"),
        },
        { type: 'separator' },
        { label: 'Sair', role: 'quit' },
      ],
    },
    {
      label: 'Exibir',
      submenu: [
        { label: 'Recarregar', role: 'reload' },
        { label: 'Forçar Recarregamento', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Aumentar Zoom', role: 'zoomIn' },
        { label: 'Diminuir Zoom', role: 'zoomOut' },
        { label: 'Zoom Padrão', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Tela Cheia', role: 'togglefullscreen' },
        { label: 'Ferramentas do Desenvolvedor', role: 'toggleDevTools' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function criarJanelaPrincipal() {
  await garantirBackend();
  const appUrl = await garantirFrontendUrl();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'Auto-T&M Karsten — Sistema de Processos Operacionais',
    backgroundColor: '#FFFFFF',
    icon: fs.existsSync(ICON_PATH) ? ICON_PATH : undefined,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  configurarMenuAplicacao();

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  await mainWindow.loadURL(appUrl);
}

// Diálogos nativos síncronos para evitar perda de foco em inputs no Windows
ipcMain.on('dialog:confirm', (event, mensagem) => {
  if (!mainWindow) {
    event.returnValue = true;
    return;
  }
  const resposta = dialog.showMessageBoxSync(mainWindow, {
    type: 'question',
    buttons: ['Cancelar', 'Confirmar'],
    defaultId: 1,
    cancelId: 0,
    title: 'Auto-T&M Karsten',
    message: String(mensagem || ''),
  });
  event.returnValue = resposta === 1;
});

ipcMain.on('dialog:alert', (event, mensagem) => {
  if (mainWindow) {
    dialog.showMessageBoxSync(mainWindow, {
      type: 'info',
      buttons: ['OK'],
      defaultId: 0,
      title: 'Auto-T&M Karsten',
      message: String(mensagem || ''),
    });
  }
  event.returnValue = true;
});

app.whenReady().then(criarJanelaPrincipal);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (staticServer) {
    try {
      staticServer.close();
    } catch {}
    staticServer = null;
  }
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch {}
    backendProcess = null;
  }
});
