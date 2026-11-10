import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Maquinas from './pages/Maquinas';
import NovaPO from './pages/NovaPO';
import FichaPO from './pages/FichaPO';
import Historico from './pages/Historico';

function Privada({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Verificando autenticação...</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Privada><Layout /></Privada>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/maquinas" element={<Maquinas />} />
        <Route path="/nova-po" element={<NovaPO />} />
        <Route path="/pos/:id" element={<FichaPO />} />
        <Route path="/historico" element={<Historico />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
