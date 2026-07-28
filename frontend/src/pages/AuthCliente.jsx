import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

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
    <div className="fz-wrap fz-secao" style={{ maxWidth: 440 }}>
      <p className="fz-rotulo fz-rotulo--aco">Cliente final</p>
      <h1 style={{ fontSize: 40, margin: "8px 0 24px" }}>
        {modo === "login" ? "Entrar" : "Criar conta"}
      </h1>

      <div className="seg" style={{ marginBottom: 24, width: "100%" }}>
        <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
          <input type="radio" checked={modo === "login"} onChange={() => setModo("login")} />
          Já tenho conta
        </label>
        <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
          <input type="radio" checked={modo === "cadastro"} onChange={() => setModo("cadastro")} />
          Criar conta
        </label>
      </div>

      <form onSubmit={enviar} className="blueprint" style={{ padding: 24 }}>
        <Corners />
        {modo === "cadastro" && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Nome</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
        )}
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Telefone (com DDD)</label>
          <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Senha</label>
          <input
            className="input"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {erro && <p style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erro}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={carregando}>
          {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta e entrar"}
        </button>
      </form>
    </div>
  );
}
