import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";
import useTitulo from "../hooks/useTitulo";

export default function AdminLogin() {
  useTitulo("Administração");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { setAdmin } = useAuth();
  const navigate = useNavigate();

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const resultado = await api.loginAdmin({ usuario, senha });
      setAdmin({ token: resultado.access_token, usuario });
      navigate("/admin");
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fz-wrap fz-secao" style={{ maxWidth: 400 }}>
      <p className="fz-rotulo fz-rotulo--aco">Área restrita</p>
      <h1 style={{ fontSize: 32, margin: "8px 0 24px" }}>Administração</h1>
      <form onSubmit={enviar} className="blueprint" style={{ padding: 24, background: "var(--color-surface)" }} noValidate>
        <Corners />
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="admin-usuario">Usuário</label>
          <input
            id="admin-usuario"
            name="username"
            autoComplete="username"
            className="input"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="admin-senha">Senha</label>
          <input
            id="admin-senha"
            name="password"
            type="password"
            autoComplete="current-password"
            className="input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        {erro && <p role="alert" style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erro}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
