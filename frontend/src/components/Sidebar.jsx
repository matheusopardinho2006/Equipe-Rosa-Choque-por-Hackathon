import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth() || {};

  const linkStyle = ({ isActive }) =>
    `w-full text-center py-3 px-4 rounded-2xl text-xs font-medium transition-all block cursor-pointer leading-snug ${
      isActive
        ? 'bg-[#A9A7A5] text-white shadow-2xs'
        : 'bg-white text-[#736F6B] hover:bg-[#E6E4DF]'
    }`;

  function handleLogout() {
    if (logout) logout();
    else {
      localStorage.removeItem('token');
      navigate('/login');
    }
  }

  return (
    <aside className="w-full md:w-56 shrink-0 bg-[#F2F1EE] rounded-[28px] p-5 flex flex-col justify-between min-h-[560px]">
      <div>
        <div className="bg-white rounded-2xl py-6 px-4 mb-6 text-center shadow-2xs">
          <span className="text-[28px] font-bold tracking-tight text-[#7D7B78]">
            Karsten
          </span>
        </div>

        <nav className="space-y-4">
          <NavLink to="/" end className={linkStyle}>
            Dashboard /<br />
            Elementos MTM
          </NavLink>

          <NavLink to="/maquinas" className={linkStyle}>
            Maquinas
          </NavLink>

          <NavLink to="/historico" className={linkStyle}>
            Histórico/Análise
          </NavLink>
        </nav>
      </div>

      <div className="pt-6 mt-8 border-t border-[#9E9B97]">
        <div className="bg-white rounded-2xl py-2.5 px-4 text-center text-xs text-[#736F6B] leading-tight">
          <div className="truncate">
            Logado como {user?.email || user?.usuario || 'XXXX'} /
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="underline font-normal hover:text-[#222222] cursor-pointer mt-0.5"
          >
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
