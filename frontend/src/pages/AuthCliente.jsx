import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AuthCliente() {
  const [modo, setModo] = useState("login");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { setCliente } = useAuth();
  const navigate = useNavigate();

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      if (modo === "cadastro") {
        await api.cadastrarUsuario({ nome, telefone, senha });
      }
      const resultado = await api.loginUsuario({ telefone, senha });
      setCliente({ token: resultado.access_token, nome, telefone });
      navigate("/buscar");
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="container">
      <h2>{modo === "login" ? "Entrar" : "Criar conta"}</h2>
      <div className="toggle-linha">
        <button className={modo === "login" ? "" : "secundario"} onClick={() => setModo("login")}>
          Já tenho conta
        </button>
        <button className={modo === "cadastro" ? "" : "secundario"} onClick={() => setModo("cadastro")}>
          Criar conta
        </button>
      </div>

      <form onSubmit={enviar} className="card">
        {modo === "cadastro" && (
          <input
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        )}
        <input
          placeholder="Telefone (com DDD)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={8}
          required
        />
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" disabled={carregando}>
          {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta e entrar"}
        </button>
      </form>
    </div>
  );
}
