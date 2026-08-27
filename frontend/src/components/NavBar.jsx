import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import logoAzul from "../assets/marca/catasucata-lockup-azul.svg";

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
  const { cliente, empresa } = useAuth();
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
    <>
      <header className="cs-header">
        <div className="cs-header__tarja"></div>
        <Link className="cs-header__logo-link" to="/buscar" aria-label="Ir para a página inicial do Catasucata">
          <img className="cs-header__logo" src={logoAzul} alt="Catasucata" />
        </Link>
        {!cliente && !empresa && (
          <Link className="cs-header__link-conta" to="/entrar">Entrar</Link>
        )}
        {cliente && (
          <Link className="cs-header__link-conta" to="/minha-conta">Minha conta</Link>
        )}
        {empresa && (
          <Link className="cs-header__link-conta" to="/empresa/minha-conta">Minha conta</Link>
        )}
      </header>
      {(cliente || empresa) && (
        <div className="cs-header__acoes">
          {cliente && (
            <>
              <Link className="cs-header__acao" to="/buscar">Nova busca</Link>
              <Link className="cs-header__acao" to="/conversas">
                Mensagens<Selo quantidade={naoLidas} />
              </Link>
            </>
          )}

          {empresa && (
            <>
              <Link className="cs-header__acao" to="/estoque">Novo cadastro</Link>
              <Link className="cs-header__acao" to="/conversas-recebidas">
                Mensagens<Selo quantidade={naoLidas} />
              </Link>
              <Link className="cs-header__acao" to="/buscar">Nova busca</Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
