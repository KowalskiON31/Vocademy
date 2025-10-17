import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [firstname, setFirstname] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setRole(u.role);
        setUsername(u.username);
        setFirstname(u.firstname || null);
        setAvatar(u.avatar || null);
      })
      .catch(() => {
        setRole(null);
      });
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkBase = "px-3 py-2 rounded hover:bg-gray-100";
  const linkActive = ({ isActive }: { isActive: boolean }) =>
    `${linkBase} ${isActive ? "bg-gray-100" : ""}`;

  const displayName = firstname || username || "Benutzer";
  const initial = (firstname || username || "?").substring(0, 1).toUpperCase();
  const isAdmin = String(role || "").toLowerCase() === "admin";

  function avatarClasses(): string {
    if (!avatar) return "bg-emerald-600";
    if (avatar.startsWith("color:")) {
      const c = avatar.split(":")[1];
      const map: Record<string, string> = {
        emerald: "bg-emerald-600",
        sky: "bg-sky-600",
        fuchsia: "bg-fuchsia-600",
        orange: "bg-orange-600",
        slate: "bg-slate-700",
      };
      return map[c] || "bg-emerald-600";
    }
    return "bg-emerald-600";
  }

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button className="font-semibold" onClick={() => navigate("/dashboard")}>
            Vocademy
          </button>
          <nav className="hidden sm:flex items-center gap-2">
            <NavLink to="/dashboard" className={linkActive}>Listen</NavLink>
            <NavLink to="/test" className={linkActive}>Test</NavLink>
            {isAdmin && <NavLink to="/admin" className={linkActive}>Admin</NavLink>}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="sm:hidden inline-flex items-center justify-center p-2 rounded hover:bg-gray-100"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menü öffnen"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          {(username || firstname) && (
            <button onClick={() => navigate('/profile')} className="hidden sm:inline-flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm ${avatarClasses()}`}>{initial}</span>
              <span className="text-sm text-gray-600 flex items-center gap-2">
                {displayName}
                {role && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                    {role}
                  </span>
                )}
              </span>
            </button>
          )}
          <button onClick={handleLogout} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded">Logout</button>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 opacity-70"></div>
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
            <NavLink to="/dashboard" className={linkActive} onClick={() => setMenuOpen(false)}>Listen</NavLink>
            <NavLink to="/test" className={linkActive} onClick={() => setMenuOpen(false)}>Test</NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={linkActive} onClick={() => setMenuOpen(false)}>Admin</NavLink>
            )}
            {(username || firstname) && (
              <span className="px-3 py-1 text-sm text-gray-600 flex items-center gap-2">
                {displayName}
                {role && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                    {role}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
