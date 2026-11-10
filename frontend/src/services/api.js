import axios from 'axios';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from './firebase';

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api` });

api.interceptors.request.use(async (cfg) => {
  const token = await firebaseAuth.currentUser?.getIdToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !location.pathname.startsWith('/login')) {
      signOut(firebaseAuth).then(
        () => { location.href = '/login'; },
        (signOutError) => {
          console.error('Não foi possível encerrar a sessão Firebase:', signOutError);
          location.href = '/login';
        }
      );
    }
    return Promise.reject(err);
  }
);

export const erroMsg = (e) => e.response?.data?.erro || e.message;

export const authApi = {
  me: () => api.get('/auth/me').then((r) => r.data),
};

const enviarArquivo = (path, arquivo) => {
  const fd = new FormData();
  fd.append('arquivo', arquivo);
  return api.post(path, fd).then((r) => r.data);
};

const crud = (path) => ({
  listar: () => api.get(path).then((r) => r.data),
  criar: (dados) => api.post(path, dados).then((r) => r.data),
  atualizar: (codigo, dados) => api.put(`${path}/${codigo}`, dados).then((r) => r.data),
  remover: (codigo) => api.delete(`${path}/${codigo}`),
});

export const maquinasApi = crud('/maquinas');
export const elementosApi = { ...crud('/elementos'), importar: (arquivo) => enviarArquivo('/elementos/importar', arquivo) };

export const posApi = {
  preview: (demanda) => api.post('/pos/preview', demanda).then((r) => r.data),
  criar: (demanda) => api.post('/pos', demanda).then((r) => r.data),
  listar: (params) => api.get('/pos', { params }).then((r) => r.data),
  buscar: (id) => api.get(`/pos/${id}`).then((r) => r.data),
  remover: (id) => api.delete(`/pos/${id}`),
  importar: (arquivo) => enviarArquivo('/pos/importar', arquivo),
  baixarExcel: async (po) => {
    const r = await api.get(`/pos/${po._id}/excel`, { responseType: 'blob' });
    const url = URL.createObjectURL(r.data);
    const a = Object.assign(document.createElement('a'), { href: url, download: `${po.codigoPO}_Rev${po.revisao}.xlsx` });
    a.click();
    URL.revokeObjectURL(url);
  },
};

export default api;
