import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import Corners from "../components/Corners";
import useTitulo from "../hooks/useTitulo";

export default function RedefinirSenha() {
  useTitulo("Redefinir senha");
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("As duas senhas precisam ser iguais.");
      return;
    }
    setCarregando(true);
    try {
      await api.redefinirSenha(token, senha);
      setSucesso(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  if (!token) {
    return (
      <div className="fz-wrap fz-secao" style={{ maxWidth: 440 }}>
        <p role="alert" style={{ color: "var(--fz-vendido)" }}>
          Link inválido. Peça uma nova redefinição de senha.
        </p>
        <Link className="btn btn-primary" to="/esqueci-senha">Pedir novo link</Link>
      </div>
    );
  }

  return (
    <div className="fz-wrap fz-secao" style={{ maxWidth: 440 }}>
      <p className="fz-rotulo fz-rotulo--aco">Recuperar acesso</p>
      <h1 style={{ fontSize: 32, margin: "8px 0 24px" }}>Redefinir senha</h1>

      {sucesso ? (
        <div className="card">
          <p className="card-body" style={{ margin: 0 }}>Senha redefinida com sucesso.</p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate("/entrar")}>
            Ir para o login
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} className="blueprint cs-painel" style={{ padding: 24 }} noValidate>
          <Corners />
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="redefinir-senha-nova">Nova senha</label>
            <input
              id="redefinir-senha-nova"
              name="new-password"
              autoComplete="new-password"
              type="password"
              className="input"
              minLength={8}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="redefinir-senha-confirmacao">Confirme a nova senha</label>
            <input
              id="redefinir-senha-confirmacao"
              name="new-password"
              autoComplete="new-password"
              type="password"
              className="input"
              minLength={8}
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              required
            />
          </div>
          {erro && <p role="alert" style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erro}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={carregando}>
            {carregando ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>
      )}
    </div>
  );
}
