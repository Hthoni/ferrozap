import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

export default function MinhaContaCliente() {
  const { cliente, setCliente } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [erroPerfil, setErroPerfil] = useState("");
  const [sucessoPerfil, setSucessoPerfil] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [sucessoSenha, setSucessoSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  useEffect(() => {
    if (!cliente) return;
    api.meuPerfil(cliente.token).then((perfil) => {
      setNome(perfil.nome || "");
      setEmail(perfil.email || "");
      setTelefone(perfil.telefone || "");
      setCep(perfil.cep || "");
    });
  }, [cliente]);

  async function salvarPerfil(e) {
    e.preventDefault();
    setErroPerfil("");
    setSucessoPerfil("");
    setSalvandoPerfil(true);
    try {
      await api.atualizarMeuPerfil({ nome, email, telefone, cep }, cliente.token);
      setSucessoPerfil("Dados atualizados.");
    } catch (err) {
      setErroPerfil(err.message);
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function salvarSenha(e) {
    e.preventDefault();
    setErroSenha("");
    setSucessoSenha("");
    setSalvandoSenha(true);
    try {
      await api.alterarMinhaSenha({ senha_atual: senhaAtual, senha_nova: senhaNova }, cliente.token);
      setSucessoSenha("Senha alterada.");
      setSenhaAtual("");
      setSenhaNova("");
    } catch (err) {
      setErroSenha(err.message);
    } finally {
      setSalvandoSenha(false);
    }
  }

  function sair() {
    setCliente(null);
    navigate("/buscar");
  }

  if (!cliente) {
    return <div className="fz-wrap fz-secao"><p>Entre com sua conta para acessar essa página.</p></div>;
  }

  return (
    <div className="fz-wrap fz-secao" style={{ maxWidth: 480 }}>
      <p className="fz-rotulo fz-rotulo--aco">Cliente final</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, margin: 0 }}>Minha conta</h1>
        <Link className="btn btn-primary" to="/buscar" style={{ width: "auto" }}>Nova busca</Link>
      </div>

      <form onSubmit={salvarPerfil} className="blueprint" style={{ padding: 24, marginBottom: 24 }}>
        <Corners />
        <p className="card-title" style={{ marginBottom: 16 }}>Dados pessoais</p>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Nome</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>E-mail</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Telefone</label>
          <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>CEP de entrega</label>
          <input className="input" value={cep} onChange={(e) => setCep(e.target.value)} />
        </div>
        {erroPerfil && <p style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erroPerfil}</p>}
        {sucessoPerfil && <p style={{ fontSize: 13 }}>{sucessoPerfil}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={salvandoPerfil}>
          {salvandoPerfil ? "Salvando..." : "Salvar dados"}
        </button>
      </form>

      <form onSubmit={salvarSenha} className="blueprint" style={{ padding: 24, marginBottom: 24 }}>
        <Corners />
        <p className="card-title" style={{ marginBottom: 16 }}>Alterar senha</p>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Senha atual</label>
          <input className="input" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Nova senha</label>
          <input className="input" type="password" minLength={8} value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} required />
        </div>
        {erroSenha && <p style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erroSenha}</p>}
        {sucessoSenha && <p style={{ fontSize: 13 }}>{sucessoSenha}</p>}
        <button className="btn btn-secondary btn-block" type="submit" disabled={salvandoSenha}>
          {salvandoSenha ? "Salvando..." : "Alterar senha"}
        </button>
      </form>

      <button className="btn btn-ghost btn-block" onClick={sair} style={{ color: "var(--fz-vendido)" }}>
        Sair da conta
      </button>
    </div>
  );
}
