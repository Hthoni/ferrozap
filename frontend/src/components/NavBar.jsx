import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();

  // CS-012 (v2): esse é agora o ÚNICO "Nova busca" que existe no site
  // -- a página de Resultados tinha uma cópia própria, com outro
  // estilo, pra mesma ação. Quando o clique acontece a partir da
  // própria tela de resultados, carrega a busca atual junto (mesmo
  // efeito que a cópia removida tinha).
  const linkNovaBusca = location.pathname === "/resultados" ? `/buscar${location.search}` : "/buscar";

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

  // CS-015: toda a navegação (marca + link de conta + barra de ações)
  // agora vive dentro de um único <header>, em vez de dois elementos
  // irmãos soltos -- landmark único, mais claro pra leitor de tela e
  // pra manutenção. Visualmente nada muda: .cs-header continua com a
  // mesma altura fixa da tarja, .cs-header__acoes continua sendo uma
  // barra separada logo abaixo, no fluxo normal.
  return (
    <header>
      <div className="cs-header">
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
      </div>
      {(cliente || empresa) && (
        <nav className="cs-header__acoes" aria-label="Navegação principal">
          {cliente && (
            <>
              <Link className="cs-header__acao" to={linkNovaBusca}>Nova busca</Link>
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
              <Link className="cs-header__acao" to={linkNovaBusca}>Nova busca</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
