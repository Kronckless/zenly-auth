import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { House, MessageSquare } from "lucide-react";

const UNREAD_MESSAGES_KEY = "horizonte-unread-messages";

const tabs = [
  { label: "Início", to: "/home", Icon: House },
  { label: "Chat", to: "/comunidade", Icon: MessageSquare },
];

export default function AppNavigation() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function updateUnreadCount() {
      const storedCount = Number(window.localStorage.getItem(UNREAD_MESSAGES_KEY) || 0);
      setUnreadCount(
        Number.isFinite(storedCount) ? Math.max(0, Math.floor(storedCount)) : 0,
      );
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
          className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-5 lg:px-8"
        >
          {tabs.map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex h-full items-center gap-2 border-b-2 px-1 text-sm font-medium transition-colors hover:text-primary ${
                  isActive
                    ? "border-primary text-primary"
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
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-background/95 shadow-[0_-4px_16px_-12px_rgba(0,0,0,0.25)] backdrop-blur sm:hidden"
      >
        {tabs.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <span className="relative inline-flex">
              <Icon className="h-5 w-5" />
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