import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";
import useTitulo from "../hooks/useTitulo";

export default function MinhaContaCliente() {
  useTitulo("Minha conta");
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
    // CS-014: sem maxWidth aqui no wrap -- o alinhamento à esquerda
    // fica igual ao das outras rotas (Busca, Resultados). O limite de
    // largura vive em cada form individualmente, como nas outras telas.
    <div className="fz-wrap fz-secao">
      <p className="fz-rotulo fz-rotulo--aco">Cliente final</p>
      <h1 style={{ fontSize: 32, margin: "8px 0 24px" }}>Minha conta</h1>

      <form onSubmit={salvarPerfil} className="blueprint" style={{ padding: 24, marginBottom: 24, maxWidth: 480 }} noValidate>
        <Corners />
        <p className="card-title" style={{ marginBottom: 16 }}>Dados pessoais</p>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="conta-nome">Nome</label>
          <input id="conta-nome" name="name" autoComplete="name" className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="conta-email">E-mail</label>
          <input id="conta-email" name="email" autoComplete="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="conta-telefone">Telefone</label>
          <input id="conta-telefone" name="tel" autoComplete="tel" className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="conta-cep">CEP de entrega</label>
          <input
            id="conta-cep"
            name="postal-code"
            autoComplete="postal-code"
            className="input"
            inputMode="numeric"
            maxLength={9}
            value={cep}
            onChange={(e) => {
              const digitos = e.target.value.replace(/\D/g, "").slice(0, 8);
              setCep(digitos.length <= 5 ? digitos : `${digitos.slice(0, 5)}-${digitos.slice(5)}`);
            }}
          />
        </div>
        {erroPerfil && <p role="alert" style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erroPerfil}</p>}
        {sucessoPerfil && <p role="status" style={{ fontSize: 13 }}>{sucessoPerfil}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={salvandoPerfil}>
          {salvandoPerfil ? "Salvando..." : "Salvar dados"}
        </button>
      </form>

      {/* CS-016: "Alterar senha" agora tem o mesmo peso visual de
          "Salvar dados" -- as duas são confirmações igualmente
          importantes; antes o secondary parecia desabilitado. */}
      <form onSubmit={salvarSenha} className="blueprint" style={{ padding: 24, marginBottom: 24, maxWidth: 480 }} noValidate>
        <Corners />
        <p className="card-title" style={{ marginBottom: 16 }}>Alterar senha</p>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="conta-senha-atual">Senha atual</label>
          <input id="conta-senha-atual" name="current-password" autoComplete="current-password" className="input" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="conta-senha-nova">Nova senha</label>
          <input id="conta-senha-nova" name="new-password" autoComplete="new-password" className="input" type="password" minLength={8} value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} required />
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
