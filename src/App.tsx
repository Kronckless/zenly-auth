import { Navigate, Route, Routes } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/cadastro-login" replace />} />
      <Route path="/cadastro-login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="*" element={<Navigate to="/cadastro-login" replace />} />
    </Routes>
  );
}

