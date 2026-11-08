import { createContext, useContext, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  async function login(usuario, senha) {
    const r = await authApi.login(usuario, senha);
    localStorage.setItem('token', r.token);
    localStorage.setItem('user', JSON.stringify({ usuario: r.usuario, perfil: r.perfil }));
    setToken(r.token);
    setUser({ usuario: r.usuario, perfil: r.perfil });
  }

  function logout() {
    localStorage.clear();
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ token, user, login, logout, isAdm: user?.perfil === 'ADM' }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
