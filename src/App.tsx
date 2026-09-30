import { Route, Routes } from "react-router-dom";
import Login from "@/pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/cadastro-login" element={<Login />} />
    </Routes>
  );
}

