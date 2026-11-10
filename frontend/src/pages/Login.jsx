import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { erroMsg } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    try {
      await login(email, senha);
      nav('/');
    } catch (err) {
      setErro(erroMsg(err));
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[1020px] min-h-[540px] bg-[#F2F1EE] rounded-[28px] p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
        {/* Coluna Esquerda: Emblema + Logotipo Karsten */}
        <div className="flex-1 flex items-center justify-center md:justify-start pl-0 md:pl-4">
          <div className="flex items-center gap-3.5 select-none">
            {/* Ícone K estilizado Karsten */}
            <div className="w-[74px] h-[68px] rounded-[16px] border-[2.5px] border-[#736F6B] p-1.5 flex items-center justify-center">
              <svg
                viewBox="0 0 64 56"
                className="w-full h-full fill-[#736F6B]"
                aria-hidden="true"
              >
                <rect x="4" y="4" width="16" height="48" rx="2" />
                <path d="M26 28 C26 14, 38 4, 56 4 L42 4 C28 12, 24 22, 24 28 C24 34, 28 44, 42 52 L56 52 C38 52, 26 42, 26 28 Z" />
                <path d="M36 28 C36 16, 46 6, 58 4 L58 52 C46 50, 36 40, 36 28 Z" />
              </svg>
            </div>
            <span className="text-[46px] font-bold tracking-tight text-[#736F6B] leading-none">
              Karsten
            </span>
          </div>
        </div>

        {/* Coluna Direita: Card Branco "Acesse o sistema" */}
        <div className="w-full max-w-[460px] bg-white rounded-[24px] px-10 py-12 shadow-2xs">
          <h1 className="text-[22px] font-bold text-[#111111] text-center mb-8">
            Acesse o sistema
          </h1>

          <form onSubmit={entrar} className="max-w-[330px] mx-auto space-y-5">
            <div>
              <label className="block text-[15px] font-normal text-[#1E1E1E] mb-2">
                Usuário:
              </label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@exemplo.com"
                className="w-full h-10 border border-[#A6A4A0] bg-white px-3 text-sm text-[#222222] focus:outline-none focus:border-[#736F6B]"
              />
            </div>

            <div>
              <label className="block text-[15px] font-normal text-[#1E1E1E] mb-2">
                Senha:
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full h-10 border border-[#A6A4A0] bg-white px-3 text-sm text-[#222222] focus:outline-none focus:border-[#736F6B]"
              />
            </div>

            {erro && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">
                {erro}
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                className="w-full bg-[#736F6B] hover:bg-[#5E5A56] text-white text-lg font-normal py-2 transition-colors cursor-pointer"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
