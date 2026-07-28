import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const CAMPOS_CADASTRO = [
  { nome: "nome", label: "Nome da empresa" },
  { nome: "cnpj", label: "CNPJ" },
  { nome: "credenciamento_detran", label: "Número do credenciamento no Detran" },
  { nome: "uf", label: "UF (ex: SP)" },
  { nome: "email", label: "E-mail" },
  { nome: "telefone", label: "Telefone / WhatsApp" },
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
          "Cadastro enviado. Sua empresa entra em análise e você recebe um aviso quando o " +
            "credenciamento for verificado — só depois disso o estoque fica visível na busca."
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
    <div className="container">
      <h2>Área da empresa</h2>
      <div className="toggle-linha">
        <button className={modo === "login" ? "" : "secundario"} onClick={() => setModo("login")}>
          Já tenho conta
        </button>
        <button className={modo === "cadastro" ? "" : "secundario"} onClick={() => setModo("cadastro")}>
          Cadastrar empresa
        </button>
      </div>

      {aviso && <p className="card">{aviso}</p>}

      <form onSubmit={enviar} className="card">
        {modo === "cadastro" &&
          CAMPOS_CADASTRO.map((campo) => (
            <input
              key={campo.nome}
              placeholder={campo.label}
              value={form[campo.nome] || ""}
              onChange={(e) => atualizarCampo(campo.nome, e.target.value)}
              required={campo.nome !== "telefone" && campo.nome !== "endereco"}
            />
          ))}
        {modo === "login" && (
          <input
            placeholder="E-mail"
            value={form.email || ""}
            onChange={(e) => atualizarCampo("email", e.target.value)}
            required
          />
        )}
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={8}
          required
        />
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" disabled={carregando}>
          {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Enviar cadastro"}
        </button>
      </form>
    </div>
  );
}
