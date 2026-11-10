import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { authApi } from '../services/api';
import { firebaseAuth } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setLoading(true);
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await authApi.me();
        setUser({ ...profile, email: profile.email || firebaseUser.email });
      } catch (error) {
        setUser(null);
        if (error.response?.status === 403) await signOut(firebaseAuth);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    try {
      const profile = await authApi.me();
      setUser({ ...profile, email: profile.email || credential.user.email });
    } catch (error) {
      await signOut(firebaseAuth);
      throw error;
    }
  }

  async function logout() {
    await signOut(firebaseAuth);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdm: user?.perfil === 'ADM' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
