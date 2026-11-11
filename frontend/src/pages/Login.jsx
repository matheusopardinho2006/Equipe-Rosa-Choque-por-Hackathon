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

      {/* Painel principal cinza claro */}
      <div className="w-full max-w-[1350px] min-h-[680px] bg-[#F2F1EE] rounded-[28px] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">

        {/* Coluna esquerda: Logo oficial Karsten */}
        <div className="flex-1 w-full flex items-center justify-center">
          <img
            src="/logo-karsten.png"
            alt="Karsten"
            className="w-full max-w-[380px] h-auto object-contain"
          />
        </div>

        {/* Coluna direita: Formulário de acesso */}
        <div className="w-full max-w-[460px] bg-white rounded-[24px] px-8 md:px-10 py-12 shadow-sm">

          <h1 className="text-[22px] font-bold text-[#111111] text-center mb-8">
            Acesse o sistema
          </h1>

          <form
            onSubmit={entrar}
            className="max-w-[330px] mx-auto space-y-5"
          >

            {/* Campo usuário */}
            <div>
              <label
                htmlFor="email"
                className="block text-[15px] font-normal text-[#1E1E1E] mb-2"
              >
                Usuário:
              </label>

              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@exemplo.com"
                className="w-full h-10 border border-[#A6A4A0] bg-white px-3 text-sm text-[#222222] focus:outline-none focus:border-[#736F6B]"
              />
            </div>

            {/* Campo senha */}
            <div>
              <label
                htmlFor="senha"
                className="block text-[15px] font-normal text-[#1E1E1E] mb-2"
              >
                Senha:
              </label>

              <input
                id="senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full h-10 border border-[#A6A4A0] bg-white px-3 text-sm text-[#222222] focus:outline-none focus:border-[#736F6B]"
              />
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">
                {erro}
              </div>
            )}

            {/* Botão de acesso */}
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
