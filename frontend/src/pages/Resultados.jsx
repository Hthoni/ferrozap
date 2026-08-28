import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, MapPin, MessageCircle } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";
import useTitulo from "../hooks/useTitulo";

function montarLinkWhatsapp(numero, mensagem) {
  const digitos = numero.replace(/\D/g, "");
  const comDDI = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`;
}

export default function Resultados() {
  useTitulo("Resultados da busca");
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
  const semCadastro = params.get("semCadastro") === "1";

  const [resultados, setResultados] = useState([]);
  const [ordenarPor, setOrdenarPor] = useState("compatibilidade");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [empresaAbertaId, setEmpresaAbertaId] = useState(null);
  const [texto, setTexto] = useState("");
  const [linkSalvoId, setLinkSalvoId] = useState(null);
  const [whatsappClicadoId, setWhatsappClicadoId] = useState(null);
  const [linkWhatsapp, setLinkWhatsapp] = useState("");
  const [somenteMensageriaId, setSomenteMensageriaId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");

  const { cliente } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (semCadastro) {
      // N-08: fabricante/modelo é sugestão pendente, sem id de
      // catálogo -- não existe modelo_id nenhum pra consultar.
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro("");
    api
      .buscar({ modeloId, ano, cep, lat, lon, ordenarPor })
      .then(setResultados)
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }, [modeloId, ano, cep, lat, lon, ordenarPor, semCadastro]);

  function abrirMensagem(empresaId) {
    if (!cliente) {
      navigate("/entrar");
      return;
    }
    setEmpresaAbertaId(empresaId === empresaAbertaId ? null : empresaId);
    setTexto("");
    setLinkSalvoId(null);
    setWhatsappClicadoId(null);
    setSomenteMensageriaId(null);
    setErro("");
    setErroEnvio("");
  }

  async function enviarESalvarLink(e, grupo) {
    e.preventDefault();
    setErroEnvio("");

    // N-01: revalida no momento do envio (não só ao abrir o formulário)
    // -- sessão pode ter expirado nesse meio-tempo -- e bloqueia texto
    // vazio explicitamente, já que o form tem noValidate (CS-017) e a
    // validação nativa do required não roda mais sozinha.
    if (!cliente) {
      navigate("/entrar");
      return;
    }
    if (!texto.trim()) {
      setErroEnvio("Descreva a peça que você precisa antes de enviar.");
      return;
    }

    const melhorVeiculo = grupo.veiculos[0]; // já vem ordenado, exato primeiro
    setEnviando(true);

    // Mensageria própria — sempre acontece, com ou sem WhatsApp
    // cadastrado (histórico, selo de lida/não lida, etc.).
    try {
      await api.iniciarConversa(
        {
          veiculo_desmonte_id: melhorVeiculo.veiculo_id,
          modelo_id: Number(modeloId),
          submodelo_id: submodeloId ? Number(submodeloId) : null,
          ano: Number(ano),
          cep,
          texto,
        },
        cliente.token
      );
    } catch (err) {
      if (err.status === 401) {
        // Sessão expirou entre abrir o formulário e clicar em enviar --
        // mensagem amigável, nunca o texto técnico do backend.
        setErroEnvio("Sua sessão expirou. Entre novamente para continuar.");
      } else {
        setErroEnvio(err.message);
      }
      setEnviando(false);
      return;
    }
    setEnviando(false);

    if (!grupo.whatsapp) {
      // Empresa sem WhatsApp cadastrado — segue só por mensageria,
      // sem travar o cliente nem tentar montar link nenhum.
      setSomenteMensageriaId(grupo.empresa_id);
      setLinkSalvoId(null);
      return;
    }

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

      {/* CS-021 (v2): legenda explicando o código de cor dos anos nos
          cards -- antes a cor sozinha (verde/vermelho) carregava o
          significado, sem nenhum texto equivalente. */}
      {!carregando && !erro && !semCadastro && resultados.length > 0 && (
        <div className="cs-legenda">
          <span><i style={{ background: "var(--fz-disponivel)" }}></i> Ano igual ao que você buscou</span>
          <span><i style={{ background: "var(--fz-vendido)" }}></i> Ano aproximado, mesma peça deve servir</span>
        </div>
      )}

      {carregando && (
        // CS-019 (v2): esqueleto no lugar de só o texto "Buscando...",
        // ocupando o mesmo espaço que os cards de verdade vão ocupar.
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {[1, 2, 3].map((n) => (
            <div className="cs-skeleton-card" key={n}>
              <div className="cs-skeleton cs-skeleton-linha" style={{ width: "70%" }}></div>
              <div className="cs-skeleton cs-skeleton-linha" style={{ width: "50%" }}></div>
              <div className="cs-skeleton cs-skeleton-linha" style={{ width: "90%" }}></div>
              <div className="cs-skeleton" style={{ height: 34, marginTop: "auto" }}></div>
            </div>
          ))}
        </div>
      )}
      {erro && <p role="alert" style={{ color: "var(--fz-vendido)" }}>{erro}</p>}
      {!carregando && !erro && semCadastro && (
        <p>
          Ainda não temos <strong>{fabricanteNome} {modeloNome}</strong> catalogado —
          anotamos seu interesse. Assim que alguma desmontadora cadastrar esse veículo,
          ele passa a aparecer nas buscas.
        </p>
      )}
      {!carregando && !erro && !semCadastro && resultados.length === 0 && (
        <p>Nenhum desmonte compatível encontrado ainda para esse veículo.</p>
      )}

      {!semCadastro && !carregando && (
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

            {/* CS-018: essa wrapper com marginTop:auto é o que fixa a
                ação no rodapé do card, mesmo quando os cards vizinhos
                têm mais linhas de veículo (esticando a coluna toda). */}
            <div style={{ width: "100%", marginTop: "auto" }}>
              {somenteMensageriaId === grupo.empresa_id ? (
                <p style={{ fontSize: 13, margin: 0 }}>
                  Mensagem enviada pelo site. Essa desmontadora ainda não tem WhatsApp
                  cadastrado — acompanhe a resposta em Mensagens.
                </p>
              ) : whatsappClicadoId === grupo.empresa_id ? (
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
                <form onSubmit={(e) => enviarESalvarLink(e, grupo)} noValidate>
                  <label htmlFor={`mensagem-${grupo.empresa_id}`} className="fz-rotulo" style={{ display: "block", marginBottom: 4 }}>
                    Descreva a peça que precisa
                  </label>
                  <textarea
                    id={`mensagem-${grupo.empresa_id}`}
                    name="mensagem"
                    className="input"
                    rows={2}
                    style={{ resize: "vertical", maxHeight: 80, overflowY: "auto" }}
                    placeholder="Ex: para-choque dianteiro"
                    value={texto}
                    onChange={(e) => { setTexto(e.target.value); setErroEnvio(""); }}
                    aria-invalid={Boolean(erroEnvio)}
                    aria-describedby={erroEnvio ? `erro-mensagem-${grupo.empresa_id}` : undefined}
                    autoFocus
                  />
                  {erroEnvio && (
                    <p id={`erro-mensagem-${grupo.empresa_id}`} role="alert" style={{ color: "var(--fz-vendido)", fontSize: 13, margin: "4px 0" }}>
                      {erroEnvio}
                      {erroEnvio.includes("sessão expirou") && (
                        <> <Link to="/entrar" style={{ color: "inherit", textDecoration: "underline" }}>Entrar de novo</Link></>
                      )}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} type="submit" disabled={enviando}>
                      {enviando ? "Enviando..." : "Enviar"}
                    </button>
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
            </div>
          </article>
        ))}
      </div>
      )}
    </div>
  );
}
