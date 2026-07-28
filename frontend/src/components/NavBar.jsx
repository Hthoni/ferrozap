import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { cliente, empresa, setCliente, setEmpresa } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/buscar" className="marca">ferrozap</Link>
      <div>
        {!cliente && !empresa && (
          <>
            <Link to="/entrar">Entrar</Link>
            <Link to="/empresa/entrar">Sou ferro-velho</Link>
          </>
        )}
        {cliente && (
          <>
            <Link to="/conversas">Minhas conversas</Link>
            <a href="#" onClick={() => setCliente(null)}>Sair</a>
          </>
        )}
        {empresa && (
          <>
            <Link to="/estoque">Estoque</Link>
            <Link to="/conversas-recebidas">Conversas</Link>
            <a href="#" onClick={() => setEmpresa(null)}>Sair</a>
          </>
        )}
      </div>
    </nav>
  );
}
