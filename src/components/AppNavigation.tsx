import { NavLink } from "react-router-dom";
import { House, MessageSquare } from "lucide-react";

const tabs = [
  { label: "Início", to: "/home", Icon: House },
  { label: "Chat", to: "/comunidade", Icon: MessageSquare },
];

export default function AppNavigation() {
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
              <Icon className="h-4 w-4" />
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
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}