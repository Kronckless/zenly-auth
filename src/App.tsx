import { Navigate, Route, Routes } from "react-router-dom";
import Login from "@/pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/cadastro-login" element={<Login />} />
      <Route path="*" element={<Navigate to="/cadastro-login" replace />} />
    </Routes>
  );
}

