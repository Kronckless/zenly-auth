import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  const [viewportWidth, setViewportWidth] = useState(
    () => (typeof window === "undefined" ? 1000 : window.innerWidth),
  );

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", updateViewportWidth);
    return () => window.removeEventListener("resize", updateViewportWidth);
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
  const location = useLocation();
  const mobileTabs = [tabs[2], tabs[3], tabs[0], tabs[1]];
  const activeMobileIndex = mobileTabs.findIndex(
    ({ to }) =>
      location.pathname === to ||
      (to !== "/" && location.pathname.startsWith(`${to}/`)),
  );
  const waveIndex = activeMobileIndex >= 0 ? activeMobileIndex : 2;
  const waveCenter = ((waveIndex + 0.5) / mobileTabs.length) * viewportWidth;
  const waveHalfWidth = Math.min(52, waveCenter, viewportWidth - waveCenter);
  const waveRadius = 22;
  const waveCenterY = 12;
  const waveRadiusY = 22;
  const waveSide = Math.max(0, waveHalfWidth - waveRadius);
  const wavePath = `M -2 16 H ${waveCenter - waveHalfWidth} C ${waveCenter - waveHalfWidth + waveSide * 0.35} 16 ${waveCenter - waveRadius} ${waveCenterY + 8} ${waveCenter - waveRadius} ${waveCenterY} A ${waveRadius} ${waveRadiusY} 0 0 0 ${waveCenter + waveRadius} ${waveCenterY} C ${waveCenter + waveRadius} ${waveCenterY + 8} ${waveCenter + waveHalfWidth - waveSide * 0.35} 16 ${waveCenter + waveHalfWidth} 16 H ${viewportWidth + 2}`;
  const waveBorderPath = `M -2 16 H ${waveCenter - waveHalfWidth} C ${waveCenter - waveHalfWidth + waveSide * 0.35} 16 ${waveCenter - waveRadius} ${waveCenterY + 8} ${waveCenter - waveRadius} ${waveCenterY} M ${waveCenter + waveRadius} ${waveCenterY} C ${waveCenter + waveRadius} ${waveCenterY + 8} ${waveCenter + waveHalfWidth - waveSide * 0.35} 16 ${waveCenter + waveHalfWidth} 16 H ${viewportWidth + 2}`;

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

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(4rem+env(safe-area-inset-bottom))] bg-transparent pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-12px_rgba(0,0,0,0.25)] sm:hidden"
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox={`0 -28 ${viewportWidth} 92`}
        >
          <path d={`${wavePath} V 64 H 0 Z`} fill="var(--background)" />
          <path
            d={waveBorderPath}
            fill="none"
            stroke="#DC2626"
            strokeWidth="2.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ transition: "d 320ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[-10px] z-10 size-11 -translate-x-1/2 rounded-full shadow-lg transition-[left] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            left: `${((waveIndex + 0.5) / mobileTabs.length) * 100}%`,
            backgroundColor: "#DC2626",
          }}
        />
        {mobileTabs.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative z-20 flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-1 text-[11px] font-medium transition-colors duration-200 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-destructive ${
                isActive ? "font-semibold text-[#DC2626]" : "text-muted-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`relative inline-flex items-center justify-center rounded-full transition-all duration-200 ${
                    isActive
                      ? "-mt-5 size-11 text-destructive-foreground"
                      : "size-7"
                  }`}
                >
                  <Icon className={isActive ? "h-6 w-6" : "h-5 w-5"} />
                </span>
                {to === "/comunidade" && unreadCount > 0 && (
                  <span
                    aria-label={`${unreadCount} mensagens não lidas`}
                    className="absolute right-1/4 top-2 min-w-[18px] rounded-full bg-destructive px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-destructive-foreground"
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