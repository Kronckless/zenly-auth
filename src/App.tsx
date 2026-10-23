import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Community from "./pages/Community";
import QG from "./pages/QG";
import Explore from "./pages/Explore";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/cadastro-login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/comunidade" element={<Community />} />
        <Route path="/qg" element={<QG />} />
        <Route path="/explorar" element={<Explore />} />
        <Route path="*" element={<Navigate to="/cadastro-login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

