import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Corners from "./Corners";

function Selo({ quantidade }) {
  if (!quantidade) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 16,
        height: 16,
        padding: "0 4px",
        marginLeft: 4,
        borderRadius: 8,
        background: "var(--fz-vendido)",
        color: "#fff",
        fontSize: 10,
        fontWeight: 600,
        verticalAlign: "middle",
      }}
    >
      {quantidade > 9 ? "9+" : quantidade}
    </span>
  );
}

export default function NavBar() {
  const { cliente, empresa, setCliente, setEmpresa } = useAuth();
  const [naoLidas, setNaoLidas] = useState(0);

  const token = cliente?.token || empresa?.token;

  useEffect(() => {
    if (!token) {
      setNaoLidas(0);
      return;
    }
    function atualizar() {
      api.contarNaoLidas(token).then((r) => setNaoLidas(r.nao_lidas)).catch(() => {});
    }
    atualizar();
    const intervalo = setInterval(atualizar, 30000); // atualiza a cada 30s
    return () => clearInterval(intervalo);
  }, [token]);

  return (
    <header className="nav">
      <Link className="fz-logo nav-brand" to="/buscar">
        <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
          <polygon points="2,2 46,2 46,36 36,46 2,46" fill="var(--fz-aco-forte)"></polygon>
          <path d="M15 12 H35 V19 H23 V23.5 H33 V30.5 H23 V37 H15 Z" fill="var(--fz-papel)"></path>
        </svg>
        <span className="fz-logo-nome">FERROZAP</span>
      </Link>

      {!cliente && !empresa && (
        <>
          <Link className="btn btn-ghost" to="/entrar">Entrar</Link>
          <Link className="btn btn-primary blueprint" to="/empresa/entrar">
            <Corners />
            Sou desmontadora
          </Link>
        </>
      )}

      {cliente && (
        <>
          <Link className="btn btn-ghost" to="/conversas">
            Minhas mensagens<Selo quantidade={naoLidas} />
          </Link>
          <button className="btn btn-secondary" onClick={() => setCliente(null)}>Sair</button>
        </>
      )}

      {empresa && (
        <>
          <Link className="btn btn-ghost" to="/estoque">Estoque</Link>
          <Link className="btn btn-ghost" to="/conversas-recebidas">
            Mensagens<Selo quantidade={naoLidas} />
          </Link>
          <button className="btn btn-secondary" onClick={() => setEmpresa(null)}>Sair</button>
        </>
      )}
    </header>
  );
}
