import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Award, House, MessageSquare, Search, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

const UNREAD_MESSAGES_KEY = "horizonte-unread-messages";

function isDevelopmentPreview() {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname.toLowerCase();
  const isLocalOrSandbox =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes("stackblitz") ||
    hostname.includes("webcontainer") ||
    hostname.includes("codesandbox");

  const isZenlyPreview = Array.from(window.location.ancestorOrigins ?? []).some(
    (origin) => {
      try {
        const ancestorHostname = new URL(origin).hostname;
        return ancestorHostname === "zenly.cloud" || ancestorHostname.endsWith(".zenly.cloud");
      } catch {
        return false;
      }
    },
  );

  return import.meta.env.DEV || isLocalOrSandbox || isZenlyPreview;
}

const tabs = [
  { label: "Início", to: "/", Icon: House },
  { label: "Chat", to: "/comunidade", Icon: MessageSquare },
  { label: "QG", to: "/qg", Icon: Shield },
  { label: "Explorar", to: "/explorar", Icon: Search },
  { label: "MFO", to: "/mfo", Icon: Award },
];

export default function AppNavigation() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMfo, setHasMfo] = useState(isDevelopmentPreview);

  useEffect(() => {
    if (isDevelopmentPreview()) return;

    if (!supabase) {
      setHasMfo(false);
      return;
    }

    let active = true;

    async function loadMfoAccess(userId: string | null) {
      if (!userId) {
        if (active) setHasMfo(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("has_mfo")
        .eq("id", userId)
        .maybeSingle();

      if (active) setHasMfo(!error && data?.has_mfo === true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadMfoAccess(session?.user.id ?? null);
    });

    void supabase.auth.getUser().then(({ data: { user } }) => {
      void loadMfoAccess(user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function updateUnreadCount() {
      try {
        const storedCount = Number(window.localStorage.getItem(UNREAD_MESSAGES_KEY) || 0);
        setUnreadCount(
          Number.isFinite(storedCount) ? Math.max(0, Math.floor(storedCount)) : 0,
        );
      } catch {
        setUnreadCount(0);
      }
    }

    updateUnreadCount();
    window.addEventListener("storage", updateUnreadCount);
    window.addEventListener("unread-messages-count-change", updateUnreadCount);

    return () => {
      window.removeEventListener("storage", updateUnreadCount);
      window.removeEventListener("unread-messages-count-change", updateUnreadCount);
    };
  }, []);

  const unreadLabel = unreadCount > 99 ? "+99" : String(unreadCount);
  const mobileTabs = [
    tabs[2],
    ...(hasMfo ? [tabs[4]] : []),
    tabs[3],
    tabs[0],
    tabs[1],
  ];

  return (
    <>
      <header className="hidden border-b border-border bg-background sm:block">
        <nav
          aria-label="Navegação principal"
          className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:gap-8 sm:px-5 lg:px-8"
        >
          {tabs.filter(({ to }) => to !== "/mfo").map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `inline-flex h-full items-center gap-2 border-b-2 px-1 text-sm font-medium transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive ${
                  isActive
                    ? "border-destructive text-destructive"
                    : "border-transparent text-muted-foreground"
                }`
              }
            >
              <span className="relative inline-flex">
                <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
                {to === "/comunidade" && unreadCount > 0 && (
                  <span
                    aria-label={`${unreadCount} mensagens não lidas`}
                    className="absolute -right-2 -top-1 min-w-[18px] rounded-full bg-destructive px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-destructive-foreground"
                  >
                    {unreadLabel}
                  </span>
                )}
              </span>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {isDevelopmentPreview() && (
        <button
          type="button"
          aria-pressed={hasMfo}
          onClick={() => setHasMfo((current) => !current)}
          className="fixed right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[9999] rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Teste MFO: {hasMfo ? "Ativo" : "Inativo"}
        </button>
      )}

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-50 flex h-16 rounded-full border border-[#D9D9DE] bg-[#F5F5F7] px-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.10)] sm:hidden"
      >
        {mobileTabs.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `relative flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[10px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                isActive ? "font-semibold text-destructive" : "text-[#62626A]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`relative inline-flex size-7 items-center justify-center rounded-full transition-colors ${
                    isActive ? "bg-destructive text-destructive-foreground" : ""
                  }`}
                >
                  <Icon className="size-[18px]" />
                </span>
                {to === "/comunidade" && unreadCount > 0 && (
                  <span
                    aria-label={`${unreadCount} mensagens não lidas`}
                    className="absolute right-1/4 top-1 min-w-[18px] rounded-full bg-destructive px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-destructive-foreground"
                  >
                    {unreadLabel}
                  </span>
                )}
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}