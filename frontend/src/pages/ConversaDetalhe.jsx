import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

function montarLinkWhatsapp(numero, mensagem) {
  const digitos = numero.replace(/\D/g, "");
  const comDDI = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`;
}

export default function ConversaDetalhe() {
  const { id } = useParams();
  const { cliente, empresa } = useAuth();
  const token = cliente?.token || empresa?.token;
  const meuTipo = empresa ? "empresa" : "cliente";

  const [veiculo, setVeiculo] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [linkWhatsapp, setLinkWhatsapp] = useState("");

  function carregar() {
    api.listarMensagens(id, token).then(setMensagens).catch((err) => setErro(err.message));
  }

  useEffect(() => {
    if (!token) return;
    carregar();
    // Busca o resumo do veiculo a partir da lista (ja carregada em
    // Minhas conversas / Conversas recebidas) — evita endpoint novo.
    const lista = cliente ? api.listarMinhasConversas : api.listarConversasRecebidas;
    lista(token).then((conversas) => {
      const atual = conversas.find((c) => String(c.id) === String(id));
      if (atual) setVeiculo(atual);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setLinkWhatsapp("");
    try {
      await api.enviarMensagem(id, texto, token);
      // Só o cliente tem pra quem mandar WhatsApp (é a empresa que
      // cadastra esse número, o cliente final não tem um equivalente
      // hoje) — segue só por mensageria do lado da empresa.
      if (meuTipo === "cliente" && veiculo?.empresa_whatsapp) {
        const mensagem =
          `Sobre o ${veiculo.fabricante_nome} ${veiculo.modelo_nome}` +
          `${veiculo.submodelo_nome ? ` ${veiculo.submodelo_nome}` : ""} ${veiculo.ano_fabricacao}:\n\n${texto}`;
        setLinkWhatsapp(montarLinkWhatsapp(veiculo.empresa_whatsapp, mensagem));
      }
      setTexto("");
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!token) return <div className="fz-wrap fz-secao"><p>Você precisa estar autenticado.</p></div>;

  return (
    <div className="fz-wrap fz-secao">
      <div style={{ maxWidth: 560, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="fz-rotulo fz-rotulo--aco" style={{ margin: 0 }}>Conversa #{id}</p>
        {cliente && (
          <Link className="btn btn-primary" to="/buscar" style={{ width: "auto" }}>Nova busca</Link>
        )}
      </div>
      {veiculo && (
        <h2 style={{ fontSize: 28, margin: "8px 0 24px", maxWidth: 560 }}>
          {veiculo.fabricante_nome} {veiculo.modelo_nome}
          {veiculo.submodelo_nome && ` ${veiculo.submodelo_nome}`} · {veiculo.ano_fabricacao}
        </h2>
      )}
      {erro && <p role="alert" style={{ color: "var(--fz-vendido)" }}>{erro}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "24px 0", maxWidth: 560 }}>
        {mensagens.map((m) => {
          const minha = m.remetente_tipo === meuTipo;
          return (
            <div
              key={m.id}
              className="card"
              style={{
                maxWidth: "78%",
                alignSelf: minha ? "flex-end" : "flex-start",
                background: minha ? "var(--color-accent-100)" : "var(--color-neutral-100)",
                border: "1px solid var(--fz-linha)",
              }}
            >
              <p className="card-body" style={{ opacity: 1 }}>{m.texto}</p>
              <p className="card-meta">{new Date(m.criado_em).toLocaleString("pt-BR")}</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={enviar} className="field" style={{ maxWidth: 560 }} noValidate>
        <label htmlFor="conversa-resposta">Responder</label>
        <textarea
          id="conversa-resposta"
          name="resposta"
          className="input"
          rows={3}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          required
        />
        <button className="btn btn-primary btn-block" type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar"}
        </button>
      </form>

      {linkWhatsapp && (
        <a
          className="btn btn-block"
          href={linkWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setLinkWhatsapp("")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: "var(--fz-whatsapp)", color: "#fff", fontWeight: 600, marginTop: 12,
            maxWidth: 560,
          }}
        >
          <MessageCircle size={16} strokeWidth={1.5} /> Enviar também pelo WhatsApp
        </a>
      )}
    </div>
  );
}
