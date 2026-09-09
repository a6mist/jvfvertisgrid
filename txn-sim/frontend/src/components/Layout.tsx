import { NavLink, Outlet } from "react-router-dom";
import { SimulationBanner } from "./SimulationBanner";
import { useAuth } from "../state/authContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/transactions", label: "Transactions" },
  { to: "/verify", label: "DATA VERIFIED BY JVF VISA/MASTERCARD" },
  { to: "/controls", label: "Controls" },
  { to: "/audit-logs", label: "Audit Logs" },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-console-bg text-console-text">
      <SimulationBanner />
      <div className="flex flex-1 min-h-0">
        <aside className="w-60 shrink-0 border-r border-console-border bg-console-panel flex flex-col">
          <div className="px-4 py-4 border-b border-console-border">
            <div className="text-sm font-semibold tracking-tight">Protocol Console</div>
            <div className="text-[11px] text-console-textFaint mt-0.5">Console v1.0.0</div>
          </div>
          <nav className="flex-1 py-3 px-2 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-accent-teal/10 text-accent-teal font-medium"
                      : "text-console-textDim hover:bg-console-panelAlt hover:text-console-text"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-console-border px-4 py-3">
            <div className="text-xs text-console-textDim truncate">{user?.name}</div>
            <div className="text-[11px] text-console-textFaint">{user?.role}</div>
            <button
              onClick={logout}
              className="mt-2 text-xs text-console-textDim hover:text-accent-red transition-colors"
            >
              Sign out
            </button>
          </div>
        </aside>
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
