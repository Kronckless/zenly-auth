import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

function RequireAuth({ session }: { session: Session | null | undefined }) {
  const location = useLocation();

  if (!import.meta.env.PROD) {
    return <Outlet />;
  }

  if (session === undefined) {
    return <div className="min-h-screen bg-background" role="status" aria-label="Verificando acesso" />;
  }

  return session ? (
    <Outlet />
  ) : (
    <Navigate to="/cadastro-login" replace state={{ from: location }} />
  );
}

function GuestOnly({ session }: { session: Session | null | undefined }) {
  if (!import.meta.env.PROD) {
    return <Outlet />;
  }

  if (session === undefined) {
    return <div className="min-h-screen bg-background" role="status" aria-label="Verificando acesso" />;
  }

  return session ? <Navigate to="/home" replace /> : <Outlet />;
}
import Login from "./pages/Login";
import Home from "./pages/Home";
import Community from "./pages/Community";
import QG from "./pages/QG";
import Explore from "./pages/Explore";

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return;
    }

    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (active) setSession(currentSession);
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (active) setSession(currentSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestOnly session={session} />}>
          <Route path="/cadastro-login" element={<Login />} />
        </Route>
        <Route element={<RequireAuth session={session} />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/comunidade" element={<Community />} />
          <Route path="/qg" element={<QG />} />
          <Route path="/explorar" element={<Explore />} />
        </Route>
        <Route path="*" element={<Navigate to="/cadastro-login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

