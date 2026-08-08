import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

export default function MinhaContaEmpresa() {
  const { empresa, setEmpresa } = useAuth();
  const navigate = useNavigate();

  const [perfilCompleto, setPerfilCompleto] = useState(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [telefoneEhWhatsapp, setTelefoneEhWhatsapp] = useState(true);
  const [endereco, setEndereco] = useState("");
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
    if (!empresa) return;
    api.minhaEmpresa(empresa.token).then((perfil) => {
      setPerfilCompleto(perfil);
      setNome(perfil.nome || "");
      setEmail(perfil.email || "");
      setTelefone(perfil.telefone || "");
      setTelefoneEhWhatsapp(Boolean(perfil.whatsapp));
      setEndereco(perfil.endereco || "");
      setCep(perfil.cep || "");
    });
  }, [empresa]);

  async function salvarPerfil(e) {
    e.preventDefault();
    setErroPerfil("");
    setSucessoPerfil("");
    setSalvandoPerfil(true);
    try {
      await api.atualizarMinhaEmpresa(
        { nome, email, telefone, telefone_e_whatsapp: telefoneEhWhatsapp, endereco, cep },
        empresa.token
      );
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
      await api.alterarSenhaEmpresa({ senha_atual: senhaAtual, senha_nova: senhaNova }, empresa.token);
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
    setEmpresa(null);
    navigate("/buscar");
  }

  if (!empresa) {
    return <div className="fz-wrap fz-secao"><p>Entre com a conta da empresa para acessar essa página.</p></div>;
  }

  return (
    <div className="fz-wrap fz-secao" style={{ maxWidth: 480 }}>
      <p className="fz-rotulo fz-rotulo--aco">Desmontadora</p>
      <h1 style={{ fontSize: 32, margin: "8px 0 24px" }}>Minha conta</h1>

      {perfilCompleto && (
        <div className="card" style={{ marginBottom: 24 }}>
          <p className="card-meta" style={{ margin: 0 }}>
            CNPJ {perfilCompleto.cnpj} · Credenciamento não editável aqui
          </p>
          <p className="card-meta" style={{ margin: "4px 0 0" }}>
            Status: {perfilCompleto.status_verificacao}
          </p>
        </div>
      )}

      <form onSubmit={salvarPerfil} className="blueprint" style={{ padding: 24, marginBottom: 24 }}>
        <Corners />
        <p className="card-title" style={{ marginBottom: 16 }}>Dados de contato</p>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Nome da empresa</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>E-mail</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Telefone (de preferência seu WhatsApp)</label>
          <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={telefoneEhWhatsapp}
              onChange={(e) => setTelefoneEhWhatsapp(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span>Esse número é WhatsApp (é como o cliente vai te chamar)</span>
          </label>
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Endereço</label>
          <input className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>CEP</label>
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
