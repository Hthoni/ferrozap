import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

export default function Busca() {
  const [fabricantes, setFabricantes] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [submodelos, setSubmodelos] = useState([]);

  const [fabricanteId, setFabricanteId] = useState("");
  const [fabricanteNome, setFabricanteNome] = useState("");
  const [modoTextoFabricante, setModoTextoFabricante] = useState(false);
  const [textoFabricante, setTextoFabricante] = useState("");

  const [modeloId, setModeloId] = useState("");
  const [modoTextoModelo, setModoTextoModelo] = useState(false);
  const [textoModelo, setTextoModelo] = useState("");

  const [submodeloId, setSubmodeloId] = useState("");
  const [temSubmodelo, setTemSubmodelo] = useState(false);
  const [anos, setAnos] = useState([]);
  const [temGeracaoReal, setTemGeracaoReal] = useState(true);
  const [ano, setAno] = useState("");
  const [cep, setCep] = useState("");
  const [cepSalvo, setCepSalvo] = useState(false);
  const [coordsGPS, setCoordsGPS] = useState(null);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState("");
  const [erro, setErro] = useState("");
  const [resolvendo, setResolvendo] = useState(false);

  const { cliente } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!cliente) return;
    api.meuPerfil(cliente.token).then((perfil) => {
      if (perfil.cep) {
        setCep(perfil.cep);
        setCepSalvo(true);
      }
    }).catch(() => {});
  }, [cliente]);

  useEffect(() => {
    api.listarFabricantes().then(setFabricantes).catch(() => setErro("Não foi possível carregar os fabricantes."));
  }, []);

  useEffect(() => {
    if (!fabricanteId) return;
    setModeloId("");
    setSubmodelos([]);
    api.listarModelos(fabricanteId).then((lista) => {
      setModelos(lista);
      if (lista.length === 0) setModoTextoModelo(true);
    });
  }, [fabricanteId]);

  useEffect(() => {
    if (!modeloId) {
      setAnos([]);
      setTemGeracaoReal(true);
      setAno("");
      setSubmodelos([]);
      setSubmodeloId("");
      setTemSubmodelo(false);
      return;
    }
    const modelo = modelos.find((m) => String(m.id) === String(modeloId));
    if (modelo?.tem_submodelo_relevante) {
      api.listarSubmodelos(modeloId).then((lista) => {
        setSubmodelos(lista);
        // Protege contra modelo marcado como "tem versão" sem
        // nenhum submodelo cadastrado ainda — evita dropdown vazio.
        setTemSubmodelo(lista.length > 0);
      });
    } else {
      setSubmodelos([]);
      setSubmodeloId("");
      setTemSubmodelo(false);
    }
    api.listarAnos(modeloId).then((resultado) => {
      setAnos(resultado.anos);
      setTemGeracaoReal(resultado.tem_geracao_real);
    });
  }, [modeloId, modelos]);

  async function confirmarFabricanteLivre() {
    if (!textoFabricante.trim()) return;
    setResolvendo(true);
    setErro("");
    try {
      const resultado = await api.criarOuObterFabricante(textoFabricante.trim());
      setFabricanteId(String(resultado.id));
      setFabricanteNome(resultado.nome);
      setModoTextoFabricante(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setResolvendo(false);
    }
  }

  async function confirmarModeloLivre() {
    if (!textoModelo.trim()) return;
    setResolvendo(true);
    setErro("");
    try {
      const resultado = await api.criarOuObterModelo(fabricanteId, textoModelo.trim());
      setModeloId(String(resultado.id));
      setModoTextoModelo(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setResolvendo(false);
    }
  }

  function trocarFabricante() {
    setFabricanteId("");
    setFabricanteNome("");
    setTextoFabricante("");
    setModeloId("");
    setModelos([]);
  }

  function usarLocalizacaoAtual() {
    if (!navigator.geolocation) {
      setErroLocalizacao("Seu navegador não permite acessar a localização.");
      return;
    }
    setBuscandoLocalizacao(true);
    setErroLocalizacao("");
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        setCoordsGPS({ lat: posicao.coords.latitude, lon: posicao.coords.longitude });
        setBuscandoLocalizacao(false);
      },
      () => {
        setErroLocalizacao("Não foi possível obter sua localização. Verifique a permissão do navegador, ou digite o CEP.");
        setBuscandoLocalizacao(false);
      },
      { timeout: 10000 }
    );
  }

  function buscar(e) {
    e.preventDefault();
    setErro("");
    if (!modeloId || !ano || (!cep && !coordsGPS)) {
      setErro("Preencha modelo, ano e CEP (ou use sua localização atual) para buscar.");
      return;
    }
    if (cliente && cep) {
      api.atualizarMeuCep(cep, cliente.token).catch(() => {});
    }
    const nomeModelo = modelos.find((m) => String(m.id) === String(modeloId))?.nome || textoModelo;
    const nomeSubmodelo = submodelos.find((s) => String(s.id) === String(submodeloId))?.nome || "";
    const params = new URLSearchParams({
      modeloId, ano, cep: cep || "", fabricanteNome, modeloNome: nomeModelo,
      submodeloId: submodeloId || "", submodeloNome: nomeSubmodelo,
      ...(coordsGPS ? { lat: coordsGPS.lat, lon: coordsGPS.lon } : {}),
    });
    navigate(`/resultados?${params.toString()}`);
  }

  return (
    <div className="fz-wrap fz-secao" style={{ borderTop: 0 }}>
      <p className="fz-rotulo fz-rotulo--aco">Marketplace de peças usadas</p>
      <h1 className="cs-titulo-home">Sua peça existe.</h1>
      <p className="cs-titulo-home__linha2">Vamos encontrá-la?</p>

      <form onSubmit={buscar} className="blueprint" style={{ padding: 24, maxWidth: 480 }}>
        <Corners />

        {/* Fabricante */}
        {!fabricanteId && !modoTextoFabricante && (
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Fabricante</label>
            <select
              className="input"
              value=""
              onChange={(e) => {
                const f = fabricantes.find((x) => String(x.id) === e.target.value);
                setFabricanteId(e.target.value);
                setFabricanteNome(f?.nome || "");
              }}
              required
            >
              <option value="">Selecione</option>
              {fabricantes.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>
        )}
        {!fabricanteId && !modoTextoFabricante && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginBottom: 16, padding: 0, fontSize: 13 }}
            onClick={() => setModoTextoFabricante(true)}
          >
            Não encontrou sua marca? Digite aqui
          </button>
        )}
        {!fabricanteId && modoTextoFabricante && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Nome da marca</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                value={textoFabricante}
                onChange={(e) => setTextoFabricante(e.target.value)}
                placeholder="Ex: Gurgel"
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "auto", whiteSpace: "nowrap" }}
                disabled={resolvendo}
                onClick={confirmarFabricanteLivre}
              >
                Usar
              </button>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: 8, padding: 0, fontSize: 13 }}
              onClick={() => { setModoTextoFabricante(false); setTextoFabricante(""); }}
            >
              Voltar para a lista
            </button>
          </div>
        )}
        {fabricanteId && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Fabricante</label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="fz-codigo">{fabricanteNome}</span>
              <button type="button" className="btn btn-ghost" style={{ width: "auto", fontSize: 12 }} onClick={trocarFabricante}>
                Trocar
              </button>
            </div>
          </div>
        )}

        {/* Modelo — só aparece depois que o fabricante está resolvido */}
        {fabricanteId && !modeloId && !modoTextoModelo && (
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Modelo</label>
            <select className="input" value={modeloId} onChange={(e) => setModeloId(e.target.value)} required>
              <option value="">Selecione</option>
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>
        )}
        {fabricanteId && !modeloId && !modoTextoModelo && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginBottom: 16, padding: 0, fontSize: 13 }}
            onClick={() => setModoTextoModelo(true)}
          >
            Não encontrou seu modelo? Digite aqui
          </button>
        )}
        {fabricanteId && !modeloId && modoTextoModelo && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Nome do modelo</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                value={textoModelo}
                onChange={(e) => setTextoModelo(e.target.value)}
                placeholder="Ex: BR-800"
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "auto", whiteSpace: "nowrap" }}
                disabled={resolvendo}
                onClick={confirmarModeloLivre}
              >
                Usar
              </button>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: 8, padding: 0, fontSize: 13 }}
              onClick={() => { setModoTextoModelo(false); setTextoModelo(""); }}
            >
              Voltar para a lista
            </button>
          </div>
        )}
        {modeloId && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Modelo</label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="fz-codigo">
                {modelos.find((m) => String(m.id) === String(modeloId))?.nome || textoModelo}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: "auto", fontSize: 12 }}
                onClick={() => { setModeloId(""); setTextoModelo(""); }}
              >
                Trocar
              </button>
            </div>
          </div>
        )}

        {temSubmodelo && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Versão (opcional)</label>
            <select className="input" value={submodeloId} onChange={(e) => setSubmodeloId(e.target.value)}>
              <option value="">Selecione</option>
              {submodelos.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>
        )}

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Ano de fabricação</label>
          {temGeracaoReal ? (
            <select
              className="input"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              disabled={!modeloId}
              required
            >
              <option value="">{modeloId ? "Selecione" : "Escolha o modelo primeiro"}</option>
              {anos.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          ) : (
            <input
              className="input"
              type="number"
              placeholder={modeloId ? "Digite o ano" : "Escolha o modelo primeiro"}
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              disabled={!modeloId}
              required
            />
          )}
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Seu CEP</label>
          {coordsGPS ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="fz-codigo">Localização atual detectada</span>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: "auto", fontSize: 12 }}
                onClick={() => setCoordsGPS(null)}
              >
                Usar CEP no lugar
              </button>
            </div>
          ) : cepSalvo ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="fz-codigo">{cep}</span>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: "auto", fontSize: 12 }}
                onClick={() => setCepSalvo(false)}
              >
                Alterar CEP de entrega
              </button>
            </div>
          ) : (
            <>
              <input className="input" value={cep} onChange={(e) => setCep(e.target.value)} />
              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: "auto", padding: 0, fontSize: 13 }}
                onClick={usarLocalizacaoAtual}
                disabled={buscandoLocalizacao}
              >
                {buscandoLocalizacao ? "Obtendo localização..." : "Usar minha localização atual"}
              </button>
              {erroLocalizacao && <p style={{ color: "var(--fz-vendido)", fontSize: 12, marginTop: 4 }}>{erroLocalizacao}</p>}
            </>
          )}
        </div>

        {erro && <p style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erro}</p>}
        <button className="btn btn-primary btn-block" type="submit">Buscar</button>
      </form>
    </div>
  );
}
