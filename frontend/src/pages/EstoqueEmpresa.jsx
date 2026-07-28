import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function EstoqueEmpresa() {
  const { empresa } = useAuth();
  const [fabricantes, setFabricantes] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [fabricanteId, setFabricanteId] = useState("");
  const [modeloId, setModeloId] = useState("");
  const [ano, setAno] = useState("");
  const [veiculos, setVeiculos] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);

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

  async function cadastrar(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setEnviando(true);
    try {
      await api.cadastrarVeiculo({ modelo_id: Number(modeloId), ano_fabricacao: Number(ano) }, empresa.token);
      setSucesso("Veículo adicionado ao estoque.");
      setAno("");
      carregarEstoque();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!empresa) {
    return (
      <div className="container">
        <p>Entre com a conta da empresa para gerenciar o estoque.</p>
        <Link to="/empresa/entrar"><button>Entrar</button></Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Meu estoque</h2>

      <form onSubmit={cadastrar} className="card">
        <p style={{ fontWeight: 500, marginTop: 0 }}>Adicionar veículo em desmonte</p>
        <select value={fabricanteId} onChange={(e) => setFabricanteId(e.target.value)} required>
          <option value="">Fabricante</option>
          {fabricantes.map((f) => (
            <option key={f.id} value={f.id}>{f.nome}</option>
          ))}
        </select>
        <select value={modeloId} onChange={(e) => setModeloId(e.target.value)} disabled={!fabricanteId} required>
          <option value="">Modelo</option>
          {modelos.map((m) => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Ano de fabricação"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          required
        />
        {erro && <p className="erro">{erro}</p>}
        {sucesso && <p>{sucesso}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? "Adicionando..." : "Adicionar ao estoque"}
        </button>
      </form>

      <h3>Veículos cadastrados</h3>
      {veiculos.length === 0 && <p>Nenhum veículo no estoque ainda.</p>}
      {veiculos.map((v) => (
        <div key={v.id} className="card lista-item">
          <span>Modelo #{v.modelo_id} · {v.ano_fabricacao}</span>
          <span className={`badge ${v.geracao_id ? "exato" : "provavel"}`}>
            {v.geracao_id ? "Geração mapeada" : "Sem geração ainda"}
          </span>
        </div>
      ))}
    </div>
  );
}
