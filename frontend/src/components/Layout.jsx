import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  const navLinkStyle = ({ isActive }) =>
    `w-full text-center py-3 px-4 rounded-2xl text-xs font-medium transition-all block cursor-pointer leading-snug ${
      isActive
        ? 'bg-[#A9A7A5] text-white shadow-2xs'
        : 'bg-white text-[#736F6B] hover:bg-[#E6E4DF]'
    }`;

  function handleLogout(e) {
    e.preventDefault();
    if (logout) logout();
  }

  return (
    <div className="min-h-screen w-full bg-white text-[#222222] font-sans p-5">
      <div className="max-w-[1380px] mx-auto flex flex-col md:flex-row gap-7 items-stretch">
        {/* Barra Lateral (IDV Karsten) */}
        <aside className="w-full md:w-56 shrink-0 bg-[#F2F1EE] rounded-[28px] p-5 flex flex-col justify-between min-h-[560px]">
          <div>
            {/* Logo Karsten */}
            <div className="bg-white rounded-2xl py-6 px-4 mb-6 text-center shadow-2xs">
              <span className="text-[28px] font-bold tracking-tight text-[#7D7B78]">
                Karsten
              </span>
            </div>

            {/* Navegação Principal */}
            <nav className="space-y-4">
              <NavLink to="/" end className={navLinkStyle}>
                Dashboard /<br />
                Elementos MTM
              </NavLink>

              <NavLink to="/maquinas" className={navLinkStyle}>
                Maquinas
              </NavLink>

              <NavLink to="/historico" className={navLinkStyle}>
                Histórico/Análise
              </NavLink>
            </nav>
          </div>

          {/* Rodapé com Divisória e Sessão do Usuário */}
          <div className="pt-6 mt-8 border-t border-[#9E9B97]">
            <div className="bg-white rounded-2xl py-2.5 px-4 text-center text-xs text-[#736F6B] leading-tight">
              <div>Logado como {user?.usuario || 'XXXX'} /</div>
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

        {/* Área Principal das Páginas */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
