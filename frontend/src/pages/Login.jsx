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
    try {
      await login(email, senha);
      nav('/');
    } catch (err) {
      setErro(erroMsg(err));
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <form className="card" style={{ width: '100%', maxWidth: 400 }} onSubmit={entrar}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Acesso do administrador</h1>
        <label>E-mail<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Senha<input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
        {erro && <span className="erro">{erro}</span>}
        <button className="primary">Entrar</button>
      </form>
    </div>
  );
}
