import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="layout">
      <nav className="sidebar">
        <strong style={{ padding: '8px 10px 14px' }}>Auto-T&amp;M</strong>
        <NavLink to="/" end>Dashboard / Elementos MTM</NavLink>
        <NavLink to="/maquinas">Máquinas</NavLink>
        <NavLink to="/nova-po">+ Criar demanda (PO)</NavLink>
        <NavLink to="/historico">Histórico e análise</NavLink>
        <div className="muted" style={{ borderTop: '1px solid #ccc', marginTop: 10, padding: '12px 10px 0' }}>
          {user?.usuario} ({user?.perfil}) · <a href="#" onClick={logout}>Sair</a>
        </div>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
