import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

export default function EstoqueEmpresa() {
  const { empresa } = useAuth();
  const [fabricantes, setFabricantes] = useState([]);
  const [modelos, setModelos] = useState([]);

  const [fabricanteId, setFabricanteId] = useState("");
  const [fabricanteNome, setFabricanteNome] = useState("");
  const [modoTextoFabricante, setModoTextoFabricante] = useState(false);
  const [textoFabricante, setTextoFabricante] = useState("");

  const [modeloId, setModeloId] = useState("");
  const [modoTextoModelo, setModoTextoModelo] = useState(false);
  const [textoModelo, setTextoModelo] = useState("");

  const [ano, setAno] = useState("");
  const [veiculos, setVeiculos] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resolvendo, setResolvendo] = useState(false);

  function carregarEstoque() {
    api.listarMeusVeiculos(empresa.token).then(setVeiculos).catch((err) => setErro(err.message));
  }

  useEffect(() => {
    if (!empresa) return;
    api.listarFabricantes().then(setFabricantes);
    carregarEstoque();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa]);

  useEffect(() => {
    if (!fabricanteId) return;
    api.listarModelos(fabricanteId).then(setModelos);
  }, [fabricanteId]);

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

  async function cadastrar(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setEnviando(true);
    try {
      await api.cadastrarVeiculo({ modelo_id: Number(modeloId), ano_fabricacao: Number(ano) }, empresa.token);
      setSucesso("Veículo adicionado ao estoque.");
      setAno("");
      setModeloId("");
      carregarEstoque();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!empresa) {
    return (
      <div className="fz-wrap fz-secao">
        <p>Entre com a conta da empresa para gerenciar o estoque.</p>
        <Link className="btn btn-primary" to="/empresa/entrar">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="fz-wrap fz-secao">
      <h2 style={{ fontSize: 32, margin: "0 0 24px" }}>Meu estoque</h2>

      <form onSubmit={cadastrar} className="blueprint" style={{ padding: 24, maxWidth: 440, marginBottom: 32 }}>
        <Corners />
        <p className="card-title" style={{ marginBottom: 16 }}>Adicionar veículo em desmonte</p>

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
            Não encontrou a marca? Digite aqui
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
            Não encontrou o modelo? Digite aqui
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
          </div>
        )}
        {modeloId && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Modelo selecionado</label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="fz-codigo">{modelos.find((m) => String(m.id) === String(modeloId))?.nome || textoModelo}</span>
              <button type="button" className="btn btn-ghost" style={{ width: "auto", fontSize: 12 }} onClick={() => setModeloId("")}>
                Trocar
              </button>
            </div>
          </div>
        )}

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Ano de fabricação</label>
          <input className="input" type="number" value={ano} onChange={(e) => setAno(e.target.value)} required />
        </div>

        {erro && <p style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erro}</p>}
        {sucesso && <p style={{ fontSize: 13 }}>{sucesso}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={enviando || !modeloId}>
          {enviando ? "Adicionando..." : "Adicionar ao estoque"}
        </button>
      </form>

      <h3 style={{ fontSize: 25, marginBottom: 16 }}>Veículos cadastrados</h3>
      {veiculos.length === 0 && <p>Nenhum veículo no estoque ainda.</p>}
      {veiculos.map((v) => (
        <div key={v.id} className="card" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="fz-codigo">Modelo #{v.modelo_id} · {v.ano_fabricacao}</span>
          <span className={`tag ${v.geracao_id ? "tag-accent" : "tag-neutral"}`}>
            {v.geracao_id ? "Geração mapeada" : "Sem geração ainda"}
          </span>
        </div>
      ))}
    </div>
  );
}
