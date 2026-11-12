const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('karstenDesktop', {
  isDesktop: true,
  platform: process.platform,
  versaoElectron: process.versions.electron,
  confirmar: (mensagem) => ipcRenderer.sendSync('dialog:confirm', mensagem),
  alerta: (mensagem) => ipcRenderer.sendSync('dialog:alert', mensagem),
});

window.addEventListener('DOMContentLoaded', () => {
  window.confirm = (mensagem) => ipcRenderer.sendSync('dialog:confirm', mensagem);
  window.alert = (mensagem) => ipcRenderer.sendSync('dialog:alert', mensagem);
});
