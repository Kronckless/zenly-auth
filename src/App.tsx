import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

function isZenlyEditorPreview() {
  if (typeof window === "undefined") return false;
  if (window.location.hostname === "poderdaconsciencia.zenly.cloud") return false;
  if (window.self === window.top) return false;

  const ancestorOrigins = Array.from(window.location.ancestorOrigins ?? []);
  return ancestorOrigins.some((origin) => {
    try {
      const hostname = new URL(origin).hostname;
      return hostname === "zenly.cloud" || hostname.endsWith(".zenly.cloud");
    } catch {
      return false;
    }
  });
}

const AuthContext = createContext<{
  user: User | null;
  session: Session | null;
  loading: boolean;
} | null>(null);

function canSkipAuth() {
  if (typeof window === "undefined") return true;

  const hostname = window.location.hostname.toLowerCase();
  const previewOrDevelopmentHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost") ||
    hostname.includes("lovable") ||
    ((hostname.includes("zenly") || hostname.includes("lovable")) &&
      /preview|dev/.test(hostname));

  return (
    previewOrDevelopmentHost ||
    hostname !== "poderdaconsciencia.zenly.cloud" ||
    isZenlyEditorPreview()
  );
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!active) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!active) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("O estado de autenticação não está disponível.");
  return auth;
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (canSkipAuth()) return <Outlet />;

  if (loading) {
    return <div className="min-h-screen bg-background" role="status" aria-label="Verificando acesso" />;
  }

  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/cadastro-login" replace state={{ from: location }} />
  );
}

function GuestOnly() {
  const { user, loading } = useAuth();

  if (canSkipAuth()) return <Outlet />;

  if (loading) {
    return <div className="min-h-screen bg-background" role="status" aria-label="Verificando acesso" />;
  }

  return user ? <Navigate to="/home" replace /> : <Outlet />;
}
import Login from "./pages/Login";
import Home from "./pages/Home";
import AllNews from "./pages/AllNews";
import Community from "./pages/Community";
import QG from "./pages/QG";
import Explore from "./pages/Explore";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/cadastro-login" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/todas-noticias" element={<AllNews />} />
            <Route path="/comunidade" element={<Community />} />
            <Route path="/qg" element={<QG />} />
            <Route path="/explorar" element={<Explore />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

