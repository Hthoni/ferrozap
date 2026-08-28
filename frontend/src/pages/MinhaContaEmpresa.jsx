import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";
import useTitulo from "../hooks/useTitulo";

export default function MinhaContaEmpresa() {
  useTitulo("Minha conta");
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
    // CS-014: sem maxWidth no wrap -- alinhamento à esquerda igual ao
    // resto do site; o limite de largura fica em cada form.
    <div className="fz-wrap fz-secao">
      <p className="fz-rotulo fz-rotulo--aco">Desmontadora</p>
      <h1 style={{ fontSize: 32, margin: "8px 0 24px" }}>Minha conta</h1>

      {perfilCompleto && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 480 }}>
          <p className="card-meta" style={{ margin: 0 }}>
            CNPJ {perfilCompleto.cnpj} · Credenciamento não editável aqui
          </p>
          <p className="card-meta" style={{ margin: "4px 0 0" }}>
            Status: {perfilCompleto.status_verificacao}
          </p>
        </div>
      )}

      <form onSubmit={salvarPerfil} className="blueprint" style={{ padding: 24, marginBottom: 24, maxWidth: 480 }} noValidate>
        <Corners />
        <p className="card-title" style={{ marginBottom: 16 }}>Dados de contato</p>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="empresa-conta-nome">Nome da empresa</label>
          <input id="empresa-conta-nome" name="organization" autoComplete="organization" className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="empresa-conta-email">E-mail</label>
          <input id="empresa-conta-email" name="email" autoComplete="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="empresa-conta-telefone">Telefone (de preferência seu WhatsApp)</label>
          <input id="empresa-conta-telefone" name="tel" autoComplete="tel" className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
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
          <label htmlFor="empresa-conta-endereco">Endereço</label>
          <input id="empresa-conta-endereco" name="street-address" autoComplete="street-address" className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="empresa-conta-cep">CEP</label>
          <input id="empresa-conta-cep" name="postal-code" autoComplete="postal-code" className="input" value={cep} onChange={(e) => setCep(e.target.value)} />
        </div>
        {erroPerfil && <p role="alert" style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erroPerfil}</p>}
        {sucessoPerfil && <p role="status" style={{ fontSize: 13 }}>{sucessoPerfil}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={salvandoPerfil}>
          {salvandoPerfil ? "Salvando..." : "Salvar dados"}
        </button>
      </form>

      {/* CS-016: mesmo peso visual de "Salvar dados" -- as duas são
          confirmações igualmente importantes. */}
      <form onSubmit={salvarSenha} className="blueprint" style={{ padding: 24, marginBottom: 24, maxWidth: 480 }} noValidate>
        <Corners />
        <p className="card-title" style={{ marginBottom: 16 }}>Alterar senha</p>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="empresa-senha-atual">Senha atual</label>
          <input id="empresa-senha-atual" name="current-password" autoComplete="current-password" className="input" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="empresa-senha-nova">Nova senha</label>
          <input id="empresa-senha-nova" name="new-password" autoComplete="new-password" className="input" type="password" minLength={8} value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} required />
        </div>
        {erroSenha && <p role="alert" style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erroSenha}</p>}
        {sucessoSenha && <p role="status" style={{ fontSize: 13 }}>{sucessoSenha}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={salvandoSenha}>
          {salvandoSenha ? "Salvando..." : "Alterar senha"}
        </button>
      </form>

      <button className="btn btn-ghost btn-block" onClick={sair} style={{ color: "var(--fz-vendido)", maxWidth: 480 }}>
        Sair da conta
      </button>
    </div>
  );
}
