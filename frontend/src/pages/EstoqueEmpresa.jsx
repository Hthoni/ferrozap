import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "../components/Corners";

export default function EstoqueEmpresa() {
  const { empresa } = useAuth();
  const [perfil, setPerfil] = useState(null);
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
  const [editandoId, setEditandoId] = useState(null);

  function carregarEstoque() {
    api.listarMeusVeiculos(empresa.token).then(setVeiculos).catch((err) => setErro(err.message));
  }

  useEffect(() => {
    if (!empresa) return;
    api.minhaEmpresa(empresa.token).then(setPerfil).catch(() => {});
    api.listarFabricantes().then(setFabricantes);
    carregarEstoque();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa]);

  useEffect(() => {
    if (!fabricanteId) return;
    api.listarModelos(fabricanteId).then((lista) => {
      setModelos(lista);
      if (lista.length === 0) setModoTextoModelo(true);
    });
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

  function limparFormulario() {
    trocarFabricante();
    setAno("");
    setEditandoId(null);
  }

  async function cadastrar(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setEnviando(true);
    try {
      if (editandoId) {
        await api.editarVeiculo(
          editandoId,
          { modelo_id: Number(modeloId), ano_fabricacao: Number(ano) },
          empresa.token
        );
        setSucesso("Veículo atualizado.");
      } else {
        await api.cadastrarVeiculo(
          { modelo_id: Number(modeloId), ano_fabricacao: Number(ano) },
          empresa.token
        );
        setSucesso("Veículo adicionado ao estoque.");
      }
      limparFormulario();
      carregarEstoque();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  function iniciarEdicao(v) {
    setEditandoId(v.id);
    setFabricanteId("");
    setFabricanteNome(v.fabricante_nome);
    setModeloId(String(v.modelo_id));
    setModelos([{ id: v.modelo_id, nome: v.modelo_nome, tem_submodelo_relevante: false }]);
    setAno(String(v.ano_fabricacao));
    setSucesso("");
    setErro("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function apagar(id) {
    if (!window.confirm("Remover este veículo do estoque?")) return;
    try {
      await api.apagarVeiculo(id, empresa.token);
      carregarEstoque();
    } catch (err) {
      setErro(err.message);
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
      <p className="fz-rotulo fz-rotulo--aco">{perfil?.nome || "Carregando..."}</p>
      <h2 style={{ fontSize: 32, margin: "8px 0 24px" }}>Meu estoque</h2>

      <form onSubmit={cadastrar} className="blueprint" style={{ padding: 24, maxWidth: 440, marginBottom: 32 }} noValidate>
        <Corners />
        <p className="card-title" style={{ marginBottom: 16 }}>
          {editandoId ? `Editando veículo #${editandoId}` : "Adicionar veículo em desmonte"}
        </p>

        {!fabricanteId && !modoTextoFabricante && (
          <div className="field" style={{ marginBottom: 8 }}>
            <label htmlFor="estoque-fabricante">Fabricante</label>
            <select
              id="estoque-fabricante"
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
            className="btn btn-ghost alvo-toque"
            style={{ marginBottom: 16, padding: 0, fontSize: 13 }}
            onClick={() => setModoTextoFabricante(true)}
          >
            Não encontrou a marca? Digite aqui
          </button>
        )}
        {!fabricanteId && modoTextoFabricante && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="estoque-fabricante-texto">Nome da marca</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="estoque-fabricante-texto"
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
              className="btn btn-ghost alvo-toque"
              style={{ marginTop: 8, padding: 0, fontSize: 13 }}
              onClick={() => { setModoTextoFabricante(false); setTextoFabricante(""); }}
            >
              Voltar para a lista
            </button>
          </div>
        )}
        {fabricanteId && (
          <div className="field" style={{ marginBottom: 16 }}>
            <span id="estoque-rotulo-fabricante" className="fz-rotulo" style={{ display: "block", marginBottom: 4 }}>Fabricante</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="fz-codigo" aria-labelledby="estoque-rotulo-fabricante">{fabricanteNome}</span>
              {!editandoId && (
                <button type="button" className="btn btn-ghost alvo-toque" style={{ width: "auto", fontSize: 12 }} onClick={trocarFabricante}>
                  Trocar
                </button>
              )}
            </div>
          </div>
        )}

        {fabricanteId && !modeloId && !modoTextoModelo && (
          <div className="field" style={{ marginBottom: 8 }}>
            <label htmlFor="estoque-modelo">Modelo</label>
            <select id="estoque-modelo" name="modelo" className="input" value={modeloId} onChange={(e) => setModeloId(e.target.value)} required>
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
            className="btn btn-ghost alvo-toque"
            style={{ marginBottom: 16, padding: 0, fontSize: 13 }}
            onClick={() => setModoTextoModelo(true)}
          >
            Não encontrou o modelo? Digite aqui
          </button>
        )}
        {fabricanteId && !modeloId && modoTextoModelo && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="estoque-modelo-texto">Nome do modelo</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="estoque-modelo-texto"
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
              className="btn btn-ghost alvo-toque"
              style={{ marginTop: 8, padding: 0, fontSize: 13 }}
              onClick={() => { setModoTextoModelo(false); setTextoModelo(""); }}
            >
              Voltar para a lista
            </button>
          </div>
        )}
        {modeloId && (
          <div className="field" style={{ marginBottom: 16 }}>
            <span id="estoque-rotulo-modelo" className="fz-rotulo" style={{ display: "block", marginBottom: 4 }}>Modelo</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="fz-codigo" aria-labelledby="estoque-rotulo-modelo">
                {modelos.find((m) => String(m.id) === String(modeloId))?.nome || textoModelo}
              </span>
              {!editandoId && (
                <button
                  type="button"
                  className="btn btn-ghost alvo-toque"
                  style={{ width: "auto", fontSize: 12 }}
                  onClick={() => { setModeloId(""); setTextoModelo(""); }}
                >
                  Trocar
                </button>
              )}
            </div>
          </div>
        )}

        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="estoque-ano">Ano de fabricação</label>
          <input id="estoque-ano" name="ano" className="input" type="number" value={ano} onChange={(e) => setAno(e.target.value)} required />
        </div>

        {erro && <p role="alert" style={{ color: "var(--fz-vendido)", fontSize: 13 }}>{erro}</p>}
        {sucesso && <p role="status" style={{ fontSize: 13 }}>{sucesso}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} type="submit" disabled={enviando || !modeloId}>
            {enviando ? "Salvando..." : editandoId ? "Salvar alterações" : "Adicionar ao estoque"}
          </button>
          {editandoId && (
            <button type="button" className="btn btn-secondary" style={{ width: "auto" }} onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <h3 style={{ fontSize: 25, marginBottom: 16 }}>Veículos cadastrados</h3>
      {veiculos.length === 0 && <p>Nenhum veículo no estoque ainda.</p>}
      {veiculos.map((v) => (
        <div key={v.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="fz-codigo">{v.fabricante_nome} {v.modelo_nome} · {v.ano_fabricacao}</span>
            <span className={`tag ${v.geracao_id ? "tag-accent" : "tag-neutral"}`}>
              {v.geracao_id ? "Geração mapeada" : "Sem geração ainda"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn btn-secondary" style={{ width: "auto", fontSize: 13, padding: "6px 14px" }} onClick={() => iniciarEdicao(v)}>
              Editar
            </button>
            <button className="btn btn-ghost alvo-toque" style={{ width: "auto", fontSize: 13, padding: "6px 14px", color: "var(--fz-vendido)" }} onClick={() => apagar(v.id)}>
              Apagar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
