import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import {
  LayoutDashboard, CalendarCheck, UtensilsCrossed, Clock3,
  BarChart2, Users, Settings, LogOut, Bot
} from "lucide-react";

const NAV = [
  { to: "/dashboard",           icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dashboard/bookings",  icon: CalendarCheck,   label: "Bookings"  },
  { to: "/dashboard/menu",      icon: UtensilsCrossed, label: "Menu"      },
  { to: "/dashboard/slots",     icon: Clock3,          label: "Slots"     },
  { to: "/dashboard/analytics", icon: BarChart2,       label: "Analytics" },
  { to: "/dashboard/customers", icon: Users,           label: "Customers" },
  { to: "/dashboard/settings",  icon: Settings,        label: "Settings"  },
];

export default function Sidebar() {
  const { owner, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="flex flex-col h-full w-64 bg-[#161b27] border-r border-[#2a3347] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#2a3347]">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">StayBot AI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV.map((navItem) => {
          const IconComp = navItem.icon;
          return (
          <NavLink
            key={navItem.to}
            to={navItem.to}
            end={navItem.to === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ` +
              (isActive
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60")
            }
          >
            <IconComp size={17} />
            {navItem.label}
          </NavLink>
          );
        })}
      </nav>

      {/* Owner info + Logout */}
      <div className="border-t border-[#2a3347] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {owner?.full_name?.[0] ?? "O"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-200 truncate">{owner?.full_name ?? "Owner"}</p>
            <p className="text-xs text-slate-500 truncate">{owner?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400
                     hover:bg-red-500/10 rounded-lg transition-all duration-150"
        >
          <LogOut size={15} /> Log out
        </button>
      </div>
    </aside>
  );
}
