import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import NavBar from "./components/NavBar";

import Busca from "./pages/Busca";
import Resultados from "./pages/Resultados";
import Entrar from "./pages/Entrar";
import MinhasConversas from "./pages/MinhasConversas";
import ConversaDetalhe from "./pages/ConversaDetalhe";
import EstoqueEmpresa from "./pages/EstoqueEmpresa";
import ConversasRecebidas from "./pages/ConversasRecebidas";
import MinhaContaCliente from "./pages/MinhaContaCliente";
import MinhaContaEmpresa from "./pages/MinhaContaEmpresa";
import AdminPainel from "./pages/AdminPainel";

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Busca />} />
          <Route path="/buscar" element={<Busca />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route path="/entrar" element={<Entrar tipoInicial="cliente" />} />
          <Route path="/empresa/entrar" element={<Entrar tipoInicial="empresa" />} />
          <Route path="/conversas" element={<MinhasConversas />} />
          <Route path="/conversas/:id" element={<ConversaDetalhe />} />
          <Route path="/estoque" element={<EstoqueEmpresa />} />
          <Route path="/conversas-recebidas" element={<ConversasRecebidas />} />
          <Route path="/minha-conta" element={<MinhaContaCliente />} />
          <Route path="/empresa/minha-conta" element={<MinhaContaEmpresa />} />
          <Route path="/admin" element={<AdminPainel />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
