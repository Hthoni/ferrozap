import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

export default function AuthCliente() {
  const [modo, setModo] = useState("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [aceitePromocional, setAceitePromocional] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { setCliente } = useAuth();
  const navigate = useNavigate();

  async function enviar(e) {
    e.preventDefault();
    setErro("");

    if (modo === "cadastro" && !aceiteTermos) {
      setErro("É necessário aceitar os termos de uso para criar a conta.");
      return;
    }

    setCarregando(true);
    try {
      if (modo === "cadastro") {
        await api.cadastrarUsuario({
          nome,
          email,
          telefone,
          senha,
          aceite_termos: aceiteTermos,
          aceite_promocional: aceitePromocional,
        });
      }
      const resultado = await api.loginUsuario({ telefone, senha });
      const perfil = await api.meuPerfil(resultado.access_token);
      setCliente({ token: resultado.access_token, nome: perfil.nome, telefone: perfil.telefone });
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
        {modo === "cadastro" && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>E-mail</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
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

        {modo === "cadastro" && (
          <>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={aceiteTermos}
                onChange={(e) => setAceiteTermos(e.target.checked)}
                required
                style={{ marginTop: 2 }}
              />
              <span>Aceito os termos de uso e a política de privacidade da Catasucata.</span>
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 16, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={aceitePromocional}
                onChange={(e) => setAceitePromocional(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>Aceito receber informações promocionais da Catasucata e seus parceiros.</span>
            </label>
          </>
        )}

        {erro && <p style={{ color: "var(--fz-vendido)", fontSize: 13, marginBottom: 12 }}>{erro}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={carregando}>
          {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta e entrar"}
        </button>
      </form>
    </div>
  );
}
