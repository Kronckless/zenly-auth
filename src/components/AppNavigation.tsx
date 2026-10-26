import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { House, MessageSquare, Search, Shield } from "lucide-react";

const UNREAD_MESSAGES_KEY = "horizonte-unread-messages";

const tabs = [
  { label: "Início", to: "/", Icon: House },
  { label: "Chat", to: "/comunidade", Icon: MessageSquare },
  { label: "QG", to: "/qg", Icon: Shield },
  { label: "Explorar", to: "/explorar", Icon: Search },
];

export default function AppNavigation() {
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <>
      <header className="hidden border-b border-border bg-background sm:block">
        <nav
          aria-label="Navegação principal"
          className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:gap-8 sm:px-5 lg:px-8"
        >
          {tabs.map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex h-full items-center gap-2 border-b-2 px-1 text-sm font-medium transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive ${
                  isActive
                    ? "border-destructive text-destructive"
                    : "border-transparent text-muted-foreground"
                }`
              }
            >
              <span className="relative inline-flex">
                <Icon className="h-4 w-4" />
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

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(3.5rem+env(safe-area-inset-bottom))] border-t-2 border-destructive bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-12px_rgba(0,0,0,0.25)] backdrop-blur sm:hidden"
      >
        {tabs.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-1 text-[11px] font-medium transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-destructive ${
                isActive ? "font-semibold text-destructive" : "text-muted-foreground"
              }`
            }
          >
            <span className="relative inline-flex">
              <Icon className="h-4 w-4" />
              {to === "/comunidade" && unreadCount > 0 && (
                <span
                  aria-label={`${unreadCount} mensagens não lidas`}
                  className="absolute -right-2 -top-1 min-w-[18px] rounded-full bg-destructive px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-destructive-foreground"
                >
                  {unreadLabel}
                </span>
              )}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}