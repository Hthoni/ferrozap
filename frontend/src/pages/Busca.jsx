import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

const ANO_MINIMO = 1950;
const ANO_MAXIMO = new Date().getFullYear() + 1;

function formatarCep(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

function cepValido(valor) {
  return /^\d{5}-?\d{3}$/.test(valor.trim());
}

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
  const [searchParams] = useSearchParams();

  // CS-006: reidrata o formulário a partir da querystring (ex: usuário
  // veio de "Nova busca" na tela de resultados, carregando os campos
  // anteriores em vez de nascer vazio).
  useEffect(() => {
    const fabId = searchParams.get("fabricanteId");
    const fabNome = searchParams.get("fabricanteNome");
    const modId = searchParams.get("modeloId");
    const modNome = searchParams.get("modeloNome");
    const subId = searchParams.get("submodeloId");
    const anoUrl = searchParams.get("ano");
    const cepUrl = searchParams.get("cep");

    if (fabId && fabNome) {
      setFabricanteId(fabId);
      setFabricanteNome(fabNome);
    } else if (fabNome) {
      // marca digitada à mão (sem id numérico) — reabre em modo texto
      setModoTextoFabricante(true);
      setTextoFabricante(fabNome);
    }
    if (modId) setModeloId(modId);
    else if (modNome) {
      setModoTextoModelo(true);
      setTextoModelo(modNome);
    }
    if (subId) setSubmodeloId(subId);
    if (anoUrl) setAno(anoUrl);
    if (cepUrl) setCep(cepUrl);
    // roda só na primeira renderização — depois disso o usuário controla o formulário
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (cep && !coordsGPS && !cepValido(cep)) {
      setErro("Esse CEP não parece válido. Confira o formato (ex: 01310-100).");
      return;
    }
    const anoNumero = Number(ano);
    if (!Number.isInteger(anoNumero) || anoNumero < ANO_MINIMO || anoNumero > ANO_MAXIMO) {
      setErro(`Digite um ano entre ${ANO_MINIMO} e ${ANO_MAXIMO}.`);
      return;
    }
    if (cliente && cep) {
      api.atualizarMeuCep(cep, cliente.token).catch(() => {});
    }
    const nomeModelo = modelos.find((m) => String(m.id) === String(modeloId))?.nome || textoModelo;
    const nomeSubmodelo = submodelos.find((s) => String(s.id) === String(submodeloId))?.nome || "";
    const params = new URLSearchParams({
      modeloId, ano, cep: cep || "", fabricanteId: fabricanteId || "", fabricanteNome, modeloNome: nomeModelo,
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

      {/* CS-017: novalidate -- os erros próprios (abaixo) substituem os
          balões nativos do navegador, que não seguem a identidade
          visual nem são anunciados de forma consistente por leitor de tela. */}
      <form onSubmit={buscar} className="blueprint" style={{ padding: 24, maxWidth: 480 }} noValidate>
        <Corners />

        {/* Fabricante */}
        {!fabricanteId && !modoTextoFabricante && (
          <div className="field" style={{ marginBottom: 8 }}>
            <label htmlFor="campo-fabricante">Fabricante</label>
            <select
              id="campo-fabricante"
              name="fabricante"
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
            <label htmlFor="campo-fabricante-texto">Nome da marca</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="campo-fabricante-texto"
                name="fabricante-texto"
                className="input"
                value={textoFabricante}
                onChange={(e) => setTextoFabricante(e.target.value)}
                placeholder="Ex: Gurgel"
                autoComplete="off"
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
            <span id="rotulo-fabricante-escolhido" className="fz-rotulo" style={{ display: "block", marginBottom: 4 }}>Fabricante</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="fz-codigo" aria-labelledby="rotulo-fabricante-escolhido">{fabricanteNome}</span>
              <button type="button" className="btn btn-ghost" style={{ width: "auto", fontSize: 12 }} onClick={trocarFabricante}>
                Trocar
              </button>
            </div>
          </div>
        )}

        {/* Modelo — só aparece depois que o fabricante está resolvido */}
        {fabricanteId && !modeloId && !modoTextoModelo && (
          <div className="field" style={{ marginBottom: 8 }}>
            <label htmlFor="campo-modelo">Modelo</label>
            <select id="campo-modelo" name="modelo" className="input" value={modeloId} onChange={(e) => setModeloId(e.target.value)} required>
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
            <label htmlFor="campo-modelo-texto">Nome do modelo</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="campo-modelo-texto"
                name="modelo-texto"
                className="input"
                value={textoModelo}
                onChange={(e) => setTextoModelo(e.target.value)}
                placeholder="Ex: BR-800"
                autoComplete="off"
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
            <span id="rotulo-modelo-escolhido" className="fz-rotulo" style={{ display: "block", marginBottom: 4 }}>Modelo</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="fz-codigo" aria-labelledby="rotulo-modelo-escolhido">
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
            <label htmlFor="campo-submodelo">Versão (opcional)</label>
            <select id="campo-submodelo" name="submodelo" className="input" value={submodeloId} onChange={(e) => setSubmodeloId(e.target.value)}>
              <option value="">Selecione</option>
              {submodelos.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>
        )}

        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="campo-ano">Ano de fabricação</label>
          {temGeracaoReal ? (
            <select
              id="campo-ano"
              name="ano"
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
              id="campo-ano"
              name="ano"
              className="input"
              type="number"
              placeholder={modeloId ? "Digite o ano" : "Escolha o modelo primeiro"}
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              disabled={!modeloId}
              min={ANO_MINIMO}
              max={ANO_MAXIMO}
              required
            />
          )}
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="campo-cep">Seu CEP</label>
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
              <input
                id="campo-cep"
                name="cep"
                className="input"
                value={cep}
                onChange={(e) => setCep(formatarCep(e.target.value))}
                inputMode="numeric"
                placeholder="00000-000"
                maxLength={9}
                autoComplete="postal-code"
                aria-describedby={erroLocalizacao ? "erro-localizacao" : undefined}
              />
              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: "auto", padding: 0, fontSize: 13 }}
                onClick={usarLocalizacaoAtual}
                disabled={buscandoLocalizacao}
              >
                {buscandoLocalizacao ? "Obtendo localização..." : "Usar minha localização atual"}
              </button>
              {erroLocalizacao && <p id="erro-localizacao" style={{ color: "var(--fz-vendido)", fontSize: 12, marginTop: 4 }}>{erroLocalizacao}</p>}
            </>
          )}
        </div>

        {erro && <p role="alert" style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erro}</p>}
        <button className="btn btn-primary btn-block" type="submit">Buscar</button>
      </form>
    </div>
  );
}
