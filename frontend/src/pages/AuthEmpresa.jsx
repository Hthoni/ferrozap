import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

const CAMPOS_CADASTRO = [
  { nome: "nome", label: "Nome da empresa" },
  { nome: "cnpj", label: "CNPJ" },
  { nome: "credenciamento_detran", label: "Número do credenciamento no Detran" },
  { nome: "uf", label: "UF (ex: SP)" },
  { nome: "email", label: "E-mail" },
  { nome: "telefone", label: "Telefone" },
  { nome: "whatsapp", label: "WhatsApp (com DDD, ex: 21999998888)" },
  { nome: "endereco", label: "Endereço completo" },
  { nome: "cep", label: "CEP" },
];

export default function AuthEmpresa() {
  const [modo, setModo] = useState("login");
  const [form, setForm] = useState({});
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { setEmpresa } = useAuth();
  const navigate = useNavigate();

  function atualizarCampo(nome, valor) {
    setForm((atual) => ({ ...atual, [nome]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setAviso("");
    setCarregando(true);
    try {
      if (modo === "cadastro") {
        await api.cadastrarEmpresa({ ...form, senha });
        setAviso(
          "Cadastro enviado. Sua desmontadora entra em análise — o estoque só fica visível " +
            "na busca depois que o credenciamento for verificado."
        );
        setModo("login");
        return;
      }
      const resultado = await api.loginEmpresa({ email: form.email, senha });
      setEmpresa({ token: resultado.access_token, email: form.email });
      navigate("/estoque");
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fz-wrap fz-secao" style={{ maxWidth: 520 }}>
      <p className="fz-rotulo fz-rotulo--aco">Desmontadora</p>
      <h1 style={{ fontSize: 40, margin: "8px 0 24px" }}>Área da empresa</h1>

      <div className="seg" style={{ marginBottom: 24, width: "100%" }}>
        <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
          <input type="radio" checked={modo === "login"} onChange={() => setModo("login")} />
          Já tenho conta
        </label>
        <label className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
          <input type="radio" checked={modo === "cadastro"} onChange={() => setModo("cadastro")} />
          Cadastrar desmontadora
        </label>
      </div>

      {aviso && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="card-body">{aviso}</p>
        </div>
      )}

      <form onSubmit={enviar} className="blueprint" style={{ padding: 24 }}>
        <Corners />
        {modo === "cadastro" &&
          CAMPOS_CADASTRO.map((campo) => (
            <div className="field" style={{ marginBottom: 16 }} key={campo.nome}>
              <label>{campo.label}</label>
              <input
                className="input"
                value={form[campo.nome] || ""}
                onChange={(e) => atualizarCampo(campo.nome, e.target.value)}
                required={campo.nome !== "telefone" && campo.nome !== "endereco"}
              />
            </div>
          ))}
        {modo === "login" && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>E-mail</label>
            <input
              className="input"
              value={form.email || ""}
              onChange={(e) => atualizarCampo("email", e.target.value)}
              required
            />
          </div>
        )}
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
          {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Enviar cadastro"}
        </button>
      </form>
    </div>
  );
}
