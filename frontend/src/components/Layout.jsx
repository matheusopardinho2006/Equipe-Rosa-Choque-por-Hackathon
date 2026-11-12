import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  const navLinkStyle = ({ isActive }) =>
    `w-full flex items-center justify-center text-center
    min-h-[56px] py-3 px-4 rounded-2xl
    text-sm font-medium leading-snug
    transition-colors duration-200
    cursor-pointer
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-[#736F6B]
    focus-visible:ring-offset-2
    ${
      isActive
        ? 'bg-[#736F6B] text-white shadow-sm'
        : 'bg-white text-[#686562] hover:bg-[#E6E4DF]'
    }`;

  function handleLogout(e) {
    e.preventDefault();

    if (logout) {
      logout();
    }
  }

  return (
    <div className="min-h-screen w-full bg-white text-[#222222] font-sans p-4 md:p-5 lg:p-7">

      {/* ESTRUTURA GERAL */}
      <div className="w-full max-w-[1800px] mx-auto flex flex-col md:flex-row gap-5 lg:gap-7 items-stretch">

        {/* BARRA LATERAL */}
        <aside className="w-full md:w-[260px] lg:w-[280px] shrink-0 bg-[#F2F1EE] rounded-[28px] p-5 lg:p-6 flex flex-col justify-between md:min-h-[760px]">

          <div>

            {/* LOGO OFICIAL KARSTEN */}
            <div className="bg-white rounded-[20px] min-h-[110px] lg:min-h-[120px] px-4 py-5 mb-6 lg:mb-8 flex items-center justify-center">

              <img
                src="/logo-karsten2.png"
                alt="Karsten"
                className="w-full max-w-[210px] h-auto object-contain"
              />

            </div>

            {/* NAVEGAÇÃO PRINCIPAL */}
            <nav
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3 lg:gap-4"
              aria-label="Navegação principal"
            >

              <NavLink
                to="/"
                end
                className={navLinkStyle}
              >
                Cadastro de POs
              </NavLink>

              <NavLink
                to="/maquinas"
                className={navLinkStyle}
              >
                Cadastro de Máquinas
              </NavLink>

              <NavLink
                to="/elementos"
                className={navLinkStyle}
              >
                Cadastro de elementos MTM
              </NavLink>

              <NavLink
                to="/analise"
                className={navLinkStyle}
              >
                Análise de POs
              </NavLink>

              {/* TUTORIAL DE USO */}
              <NavLink
                to="/tutorial"
                className={navLinkStyle}
              >
                Tutorial de uso
              </NavLink>

            </nav>
          </div>

          {/* RODAPÉ E USUÁRIO */}
          <div className="pt-6 mt-8 border-t border-[#C8C6C1]">

            <div className="bg-white rounded-2xl py-4 px-3 text-center text-sm text-[#686562] leading-relaxed">

              <div
                className="truncate"
                title={
                  user?.email ||
                  user?.usuario ||
                  'Usuário'
                }
              >
                Logado como{' '}
                <span className="font-medium text-[#55524F]">
                  {user?.email ||
                    user?.usuario ||
                    'Usuário'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center mt-3 text-sm font-medium text-[#736F6B] hover:text-[#222222] underline underline-offset-4 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#736F6B] rounded"
              >
                Sair
              </button>

            </div>
          </div>

        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <main
          id="conteudo-principal"
          className="flex-1 min-w-0"
        >
          <Outlet />
        </main>

      </div>
    </div>
  );
}
