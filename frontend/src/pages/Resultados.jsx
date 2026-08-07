import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, MapPin, MessageCircle } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

function montarLinkWhatsapp(numero, mensagem) {
  const digitos = numero.replace(/\D/g, "");
  const comDDI = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`;
}

export default function Resultados() {
  const [params] = useSearchParams();
  const modeloId = params.get("modeloId");
  const ano = params.get("ano");
  const cep = params.get("cep");
  const lat = params.get("lat");
  const lon = params.get("lon");
  const fabricanteNome = params.get("fabricanteNome") || "";
  const modeloNome = params.get("modeloNome") || "";
  const submodeloId = params.get("submodeloId") || null;
  const submodeloNome = params.get("submodeloNome") || "";

  const [resultados, setResultados] = useState([]);
  const [ordenarPor, setOrdenarPor] = useState("compatibilidade");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [empresaAbertaId, setEmpresaAbertaId] = useState(null);
  const [texto, setTexto] = useState("");
  const [linkSalvoId, setLinkSalvoId] = useState(null);
  const [whatsappClicadoId, setWhatsappClicadoId] = useState(null);
  const [linkWhatsapp, setLinkWhatsapp] = useState("");

  const { cliente } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setCarregando(true);
    setErro("");
    api
      .buscar({ modeloId, ano, cep, lat, lon, ordenarPor })
      .then(setResultados)
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }, [modeloId, ano, cep, lat, lon, ordenarPor]);

  function abrirMensagem(empresaId) {
    if (!cliente) {
      navigate("/entrar");
      return;
    }
    setEmpresaAbertaId(empresaId === empresaAbertaId ? null : empresaId);
    setTexto("");
    setLinkSalvoId(null);
    setWhatsappClicadoId(null);
    setErro("");
  }

  function salvarESalvarLink(e, grupo) {
    e.preventDefault();
    if (!grupo.whatsapp) {
      setErro("Essa desmontadora ainda não cadastrou um número de WhatsApp.");
      return;
    }
    const melhorVeiculo = grupo.veiculos[0]; // já vem ordenado, exato primeiro

    // Mensageria própria de volta — cria a conversa de verdade no
    // nosso sistema (histórico, selo de lida/não lida, etc.)
    api
      .iniciarConversa(
        {
          veiculo_desmonte_id: melhorVeiculo.veiculo_id,
          modelo_id: Number(modeloId),
          submodelo_id: submodeloId ? Number(submodeloId) : null,
          ano: Number(ano),
          cep,
          texto,
        },
        cliente.token
      )
      .catch((err) => setErro(err.message));

    const nomeCliente = cliente?.nome || "um cliente";
    const mensagem =
      `Olá, o cliente ${nomeCliente} encontrou o seu veículo no site Catasucata.com.br.\n\n` +
      `Veículo:\n${fabricanteNome}\n${modeloNome}${submodeloNome ? ` ${submodeloNome}` : ""}\n${melhorVeiculo.ano_fabricacao}\n\n` +
      `E a peça que ele precisa é:\n${texto}`;
    setLinkWhatsapp(montarLinkWhatsapp(grupo.whatsapp, mensagem));
    setLinkSalvoId(grupo.empresa_id);
  }

  return (
    <div className="fz-wrap fz-secao">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 28, margin: 0 }}>Resultados</h2>
        <Link className="btn btn-primary" to="/buscar" style={{ width: "auto" }}>Nova busca</Link>
      </div>

      <div className="seg" style={{ marginBottom: 20 }}>
        <label className="seg-opt">
          <input
            type="radio"
            checked={ordenarPor === "compatibilidade"}
            onChange={() => setOrdenarPor("compatibilidade")}
          />
          Compatibilidade
        </label>
        <label className="seg-opt">
          <input
            type="radio"
            checked={ordenarPor === "distancia"}
            onChange={() => setOrdenarPor("distancia")}
          />
          Distância
        </label>
      </div>

      {carregando && <p>Buscando...</p>}
      {erro && <p style={{ color: "var(--fz-vendido)" }}>{erro}</p>}
      {!carregando && !erro && resultados.length === 0 && (
        <>
          <p>Nenhum desmonte compatível encontrado ainda para esse veículo.</p>
          <Link className="btn btn-primary" to="/buscar" style={{ display: "inline-block", width: "auto", marginTop: 12 }}>
            Nova busca
          </Link>
        </>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {resultados.map((grupo) => (
          <article className="fz-card-peca blueprint" key={grupo.empresa_id}>
            <Corners />
            <h3 className="fz-card-titulo" style={{ margin: 0 }}>{grupo.empresa_nome}</h3>
            <p className="fz-selo" style={{ margin: 0 }}>
              <BadgeCheck size={15} strokeWidth={1.5} /> Desmontadora verificada
            </p>
            <p className="fz-selo" style={{ margin: 0 }}>
              <MapPin size={13} strokeWidth={1.5} />
              {grupo.distancia_km.toFixed(0)} km
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {grupo.veiculos.map((v) => {
                const exato = v.nivel_confianca === "compativel_exato";
                return (
                  <li key={v.veiculo_id} style={{ fontSize: 14 }}>
                    <span style={{ color: "var(--fz-tinta)" }}>— </span>
                    <span style={{ color: "var(--fz-disponivel)", fontWeight: 600 }}>{fabricanteNome}</span>
                    <span style={{ color: "var(--fz-tinta)" }}> / </span>
                    <span style={{ color: "var(--fz-disponivel)", fontWeight: 600 }}>{modeloNome}</span>
                    <span style={{ color: "var(--fz-tinta)" }}> / </span>
                    <span style={{ color: exato ? "var(--fz-disponivel)" : "var(--fz-vendido)", fontWeight: 600 }}>
                      {v.ano_fabricacao}
                    </span>
                  </li>
                );
              })}
            </ul>

            {whatsappClicadoId === grupo.empresa_id ? (
              <p
                style={{
                  background: "var(--fz-aco)",
                  color: "#000",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "10px 12px",
                  margin: 0,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                Mensagem criada para envio, você precisa enviá-la pelo seu próprio WhatsApp.
              </p>
            ) : linkSalvoId === grupo.empresa_id ? (
              <a
                className="btn btn-block"
                href={linkWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWhatsappClicadoId(grupo.empresa_id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "var(--fz-whatsapp)", color: "#fff", fontWeight: 600,
                }}
              >
                <MessageCircle size={16} strokeWidth={1.5} /> Enviar WhatsApp
              </a>
            ) : empresaAbertaId === grupo.empresa_id ? (
              <form onSubmit={(e) => salvarESalvarLink(e, grupo)} style={{ width: "100%" }}>
                <textarea
                  className="input"
                  rows={2}
                  style={{ resize: "vertical", maxHeight: 80, overflowY: "auto" }}
                  placeholder="Descreva a peça que precisa"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  autoFocus
                  required
                />
                {erro && <p style={{ color: "var(--fz-vendido)", fontSize: 13, margin: "4px 0" }}>{erro}</p>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} type="submit">Salvar</button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: "auto" }}
                    onClick={() => setEmpresaAbertaId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button className="btn btn-primary btn-block blueprint" onClick={() => abrirMensagem(grupo.empresa_id)}>
                <Corners />
                Falar com a desmontadora
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
