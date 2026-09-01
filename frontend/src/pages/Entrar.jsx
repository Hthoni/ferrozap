import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";
import useTitulo from "../hooks/useTitulo";

const CAMPOS_CADASTRO_EMPRESA = [
  { nome: "nome", label: "Nome da empresa", autoComplete: "organization" },
  { nome: "cnpj", label: "CNPJ", autoComplete: "off" },
  { nome: "credenciamento_detran", label: "Número do credenciamento no Detran", autoComplete: "off" },
  { nome: "uf", label: "UF (ex: SP)", autoComplete: "address-level1" },
  { nome: "email", label: "E-mail", autoComplete: "email" },
  { nome: "telefone", label: "Telefone (de preferência seu WhatsApp — com DDD)", autoComplete: "tel" },
  { nome: "endereco", label: "Endereço completo", autoComplete: "street-address" },
  { nome: "cep", label: "CEP", autoComplete: "postal-code" },
];

export default function Entrar({ tipoInicial = "cliente" }) {
  useTitulo("Entrar");
  const [modo, setModo] = useState("login");
  const [tipo, setTipo] = useState(tipoInicial);

  // campos cliente
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [aceitePromocional, setAceitePromocional] = useState(false);

  // campos empresa
  const [formEmpresa, setFormEmpresa] = useState({});
  const [telefoneEhWhatsapp, setTelefoneEhWhatsapp] = useState(true);

  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);

  const { setCliente, setEmpresa } = useAuth();
  const navigate = useNavigate();

  function atualizarCampoEmpresa(campo, valor) {
    setFormEmpresa((atual) => ({ ...atual, [campo]: valor }));
  }

  function trocarTipo(novoTipo) {
    setTipo(novoTipo);
    setErro("");
    setAviso("");
  }

  async function enviarCliente(e) {
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
          nome, email, telefone, senha,
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

  async function enviarEmpresa(e) {
    e.preventDefault();
    setErro("");
    setAviso("");
    setCarregando(true);
    try {
      if (modo === "cadastro") {
        await api.cadastrarEmpresa({ ...formEmpresa, senha, telefone_e_whatsapp: telefoneEhWhatsapp });
        setAviso(
          "Cadastro enviado. Sua desmontadora entra em análise — o estoque só fica visível " +
            "na busca depois que o credenciamento for verificado."
        );
        setModo("login");
        setCarregando(false);
        return;
      }
      const resultado = await api.loginEmpresa({ telefone: formEmpresa.telefone, senha });
      setEmpresa({ token: resultado.access_token, telefone: formEmpresa.telefone });
      navigate("/estoque");
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fz-wrap fz-secao cs-fundo-padrao" style={{ maxWidth: 520 }}>
      <p className="fz-rotulo fz-rotulo--aco">
        {tipo === "cliente" ? "Cliente final" : "Desmontadora"}
      </p>
      <h1 style={{ fontSize: 40, margin: "8px 0 24px" }}>
        {modo === "login" ? "Entrar" : "Nova conta"}
      </h1>

      <div className="seg" style={{ marginBottom: 16, width: "100%" }}>
        <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
          <input type="radio" checked={modo === "login"} onChange={() => setModo("login")} />
          Já tenho conta
        </label>
        <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
          <input type="radio" checked={modo === "cadastro"} onChange={() => setModo("cadastro")} />
          Nova conta?
        </label>
      </div>

      <div className="seg" style={{ marginBottom: 24, width: "100%" }}>
        <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
          <input type="radio" checked={tipo === "cliente"} onChange={() => trocarTipo("cliente")} />
          Cliente
        </label>
        <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
          <input type="radio" checked={tipo === "empresa"} onChange={() => trocarTipo("empresa")} />
          Desmontadora
        </label>
      </div>

      {aviso && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="card-body">{aviso}</p>
        </div>
      )}

      {tipo === "cliente" ? (
        <form onSubmit={enviarCliente} className="blueprint cs-painel" style={{ padding: 24 }} noValidate>
          <Corners />
          {modo === "cadastro" && (
            <div className="field" style={{ marginBottom: 16 }}>
              <label htmlFor="cliente-nome">Nome</label>
              <input id="cliente-nome" name="name" autoComplete="name" className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
          )}
          {modo === "cadastro" && (
            <div className="field" style={{ marginBottom: 16 }}>
              <label htmlFor="cliente-email">E-mail</label>
              <input id="cliente-email" name="email" autoComplete="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          )}
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="cliente-telefone">Telefone (com DDD)</label>
            <input id="cliente-telefone" name="tel" autoComplete="tel" className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="cliente-senha">Senha</label>
            <input
              id="cliente-senha"
              name="password"
              autoComplete={modo === "cadastro" ? "new-password" : "current-password"}
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
                <input type="checkbox" checked={aceiteTermos} onChange={(e) => setAceiteTermos(e.target.checked)} required style={{ marginTop: 2 }} />
                <span>Aceito os termos de uso e a política de privacidade da Catasucata.</span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 16, fontSize: 13 }}>
                <input type="checkbox" checked={aceitePromocional} onChange={(e) => setAceitePromocional(e.target.checked)} style={{ marginTop: 2 }} />
                <span>Aceito receber informações promocionais da Catasucata e seus parceiros.</span>
              </label>
            </>
          )}
          {erro && <p role="alert" style={{ color: "var(--fz-vendido)", fontSize: 13, marginBottom: 12 }}>{erro}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={carregando}>
            {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta e entrar"}
          </button>
        </form>
      ) : (
        <form onSubmit={enviarEmpresa} className="blueprint cs-painel" style={{ padding: 24 }} noValidate>
          <Corners />
          {modo === "cadastro" &&
            CAMPOS_CADASTRO_EMPRESA.map((campo) => (
              <div className="field" style={{ marginBottom: 16 }} key={campo.nome}>
                <label htmlFor={`empresa-${campo.nome}`}>{campo.label}</label>
                <input
                  id={`empresa-${campo.nome}`}
                  name={campo.nome}
                  autoComplete={campo.autoComplete}
                  className="input"
                  value={formEmpresa[campo.nome] || ""}
                  onChange={(e) => atualizarCampoEmpresa(campo.nome, e.target.value)}
                  required={campo.nome !== "endereco"}
                />
                {campo.nome === "telefone" && (
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8, fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={telefoneEhWhatsapp}
                      onChange={(e) => setTelefoneEhWhatsapp(e.target.checked)}
                      style={{ marginTop: 2 }}
                    />
                    <span>Esse número é WhatsApp (recomendado — é como o cliente vai te chamar)</span>
                  </label>
                )}
              </div>
            ))}
          {modo === "login" && (
            <div className="field" style={{ marginBottom: 16 }}>
              <label htmlFor="empresa-login-telefone">Telefone (com DDD)</label>
              <input
                id="empresa-login-telefone"
                name="tel"
                autoComplete="tel"
                className="input"
                value={formEmpresa.telefone || ""}
                onChange={(e) => atualizarCampoEmpresa("telefone", e.target.value)}
                required
              />
            </div>
          )}
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="empresa-senha">Senha</label>
            <input
              id="empresa-senha"
              name="password"
              autoComplete={modo === "cadastro" ? "new-password" : "current-password"}
              className="input"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={8}
              required
            />
          </div>
          {erro && <p role="alert" style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erro}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={carregando}>
            {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Enviar cadastro"}
          </button>
        </form>
      )}
    </div>
  );
}
