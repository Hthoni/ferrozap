import { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminPainel() {
  const [pendentes, setPendentes] = useState([]);
  const [coordenadas, setCoordenadas] = useState({});
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function carregar() {
    api.listarPendentes().then(setPendentes).catch((err) => setErro(err.message));
  }

  useEffect(() => {
    carregar();
  }, []);

  function atualizarCoordenada(empresaId, campo, valor) {
    setCoordenadas((atual) => ({
      ...atual,
      [empresaId]: { ...atual[empresaId], [campo]: valor },
    }));
  }

  async function decidir(empresaId, status) {
    setErro("");
    setMensagem("");
    const coord = coordenadas[empresaId] || {};
    try {
      await api.aprovarEmpresa(empresaId, {
        status_verificacao: status,
        latitude: coord.latitude ? Number(coord.latitude) : undefined,
        longitude: coord.longitude ? Number(coord.longitude) : undefined,
      });
      setMensagem(`Empresa #${empresaId} atualizada para "${status}".`);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="container">
      <h2>Painel de admin</h2>
      <p style={{ fontSize: 13, color: "#a32d2d" }}>
        Sem autenticação de admin ainda — uso interno apenas. Ver docs/decisoes.md.
      </p>

      {erro && <p className="erro">{erro}</p>}
      {mensagem && <p>{mensagem}</p>}

      <h3>Empresas pendentes ({pendentes.length})</h3>
      {pendentes.length === 0 && <p>Nenhuma empresa aguardando aprovação.</p>}

      {pendentes.map((e) => (
        <div key={e.id} className="card">
          <p style={{ fontWeight: 500, margin: 0 }}>{e.nome}</p>
          <p style={{ fontSize: 13, color: "#666", margin: "4px 0" }}>
            CNPJ {e.cnpj} · Detran {e.credenciamento_detran} · UF {e.uf}
          </p>
          <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>
            {e.endereco || "Endereço não informado"} · CEP {e.cep}
          </p>

          <input
            placeholder="Latitude (ex: -23.55)"
            value={coordenadas[e.id]?.latitude || ""}
            onChange={(ev) => atualizarCoordenada(e.id, "latitude", ev.target.value)}
          />
          <input
            placeholder="Longitude (ex: -46.63)"
            value={coordenadas[e.id]?.longitude || ""}
            onChange={(ev) => atualizarCoordenada(e.id, "longitude", ev.target.value)}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => decidir(e.id, "verificado")}>Aprovar</button>
            <button className="secundario" onClick={() => decidir(e.id, "rejeitado")}>
              Rejeitar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
