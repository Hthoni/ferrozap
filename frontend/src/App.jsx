import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import NavBar from "./components/NavBar";

import Busca from "./pages/Busca";
import Resultados from "./pages/Resultados";
import AuthCliente from "./pages/AuthCliente";
import AuthEmpresa from "./pages/AuthEmpresa";
import MinhasConversas from "./pages/MinhasConversas";
import ConversaDetalhe from "./pages/ConversaDetalhe";
import EstoqueEmpresa from "./pages/EstoqueEmpresa";
import ConversasRecebidas from "./pages/ConversasRecebidas";
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
          <Route path="/entrar" element={<AuthCliente />} />
          <Route path="/empresa/entrar" element={<AuthEmpresa />} />
          <Route path="/conversas" element={<MinhasConversas />} />
          <Route path="/conversas/:id" element={<ConversaDetalhe />} />
          <Route path="/estoque" element={<EstoqueEmpresa />} />
          <Route path="/conversas-recebidas" element={<ConversasRecebidas />} />
          <Route path="/admin" element={<AdminPainel />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
