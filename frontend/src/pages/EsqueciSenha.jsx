import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import Corners from "../components/Corners";
import useTitulo from "../hooks/useTitulo";

export default function EsqueciSenha({ tipoInicial = "usuario_final" }) {
  useTitulo("Esqueci minha senha");
  const [params] = useSearchParams();
  const [tipo, setTipo] = useState(params.get("tipo") === "empresa" ? "empresa" : tipoInicial);
  const [identificador, setIdentificador] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await api.esqueciSenha(tipo, identificador.trim());
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fz-wrap fz-secao" style={{ maxWidth: 440 }}>
      <p className="fz-rotulo fz-rotulo--aco">Recuperar acesso</p>
      <h1 style={{ fontSize: 32, margin: "8px 0 24px" }}>Esqueci minha senha</h1>

      {enviado ? (
        <div className="card">
          <p className="card-body" style={{ margin: 0 }}>
            Se existir uma conta com esse dado, mandamos as instruções de redefinição
            por e-mail. Confira sua caixa de entrada (e o spam, por garantia).
          </p>
          <Link className="btn btn-primary" to="/entrar" style={{ marginTop: 12 }}>
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="blueprint" style={{ padding: 24, background: "var(--color-surface)" }} noValidate>
          <Corners />

          <div className="seg" style={{ marginBottom: 16, width: "100%" }}>
            <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
              <input type="radio" checked={tipo === "usuario_final"} onChange={() => { setTipo("usuario_final"); setIdentificador(""); }} />
              Cliente
            </label>
            <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
              <input type="radio" checked={tipo === "empresa"} onChange={() => { setTipo("empresa"); setIdentificador(""); }} />
              Desmontadora
            </label>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="esqueci-identificador">
              {tipo === "usuario_final" ? "E-mail cadastrado" : "Telefone cadastrado (com DDD)"}
            </label>
            <input
              id="esqueci-identificador"
              name={tipo === "usuario_final" ? "email" : "tel"}
              autoComplete={tipo === "usuario_final" ? "email" : "tel"}
              className="input"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              required
            />
          </div>
          {erro && <p role="alert" style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erro}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={carregando}>
            {carregando ? "Enviando..." : "Enviar instruções"}
          </button>
          <Link to="/entrar" style={{ display: "block", marginTop: 12, fontSize: 13, textAlign: "center" }}>
            Voltar para o login
          </Link>
        </form>
      )}
    </div>
  );
}
