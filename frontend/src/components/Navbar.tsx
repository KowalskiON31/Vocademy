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

  const linkBase = "px-4 py-2 rounded-xl transition-all font-medium";
  const linkActive = ({ isActive }: { isActive: boolean }) =>
    `${linkBase} ${isActive ? "bg-white/20 backdrop-blur-sm text-white" : "text-white/80 hover:bg-white/10"}`;

  const displayName = firstname || username || "Benutzer";
  const initial = (firstname || username || "?").substring(0, 1).toUpperCase();
  const isAdmin = String(role || "").toLowerCase() === "admin";

  function avatarClasses(): string {
    if (!avatar) return "bg-gradient-to-br from-purple-500 to-pink-500";
    if (avatar.startsWith("color:")) {
      const c = avatar.split(":")[1];
      const map: Record<string, string> = {
        emerald: "bg-gradient-to-br from-emerald-500 to-teal-500",
        sky: "bg-gradient-to-br from-sky-500 to-blue-500",
        fuchsia: "bg-gradient-to-br from-fuchsia-500 to-purple-500",
        orange: "bg-gradient-to-br from-orange-500 to-red-500",
        slate: "bg-gradient-to-br from-slate-600 to-slate-800",
      };
      return map[c] || "bg-gradient-to-br from-purple-500 to-pink-500";
    }
    return "bg-gradient-to-br from-purple-500 to-pink-500";
  }

  return (
    <>
      <header className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              className="text-2xl font-black text-white flex items-center gap-2 hover:scale-105 transition-transform"
              onClick={() => navigate("/dashboard")}
            >
              📚 Vocademy
            </button>
            <nav className="hidden md:flex items-center gap-2">
              <NavLink to="/dashboard" className={linkActive}>📋 Listen</NavLink>
              <NavLink to="/test" className={linkActive}>🎯 Test</NavLink>
              {isAdmin && <NavLink to="/admin" className={linkActive}>⚙️ Admin</NavLink>}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menü öffnen"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            {(username || firstname) && (
              <button
                onClick={() => navigate('/profile')}
                className="hidden md:inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/20 transition-all"
              >
                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-white text-base font-bold shadow-lg ${avatarClasses()}`}>
                  {initial}
                </span>
                <span className="text-white flex items-center gap-2 font-medium">
                  {displayName}
                  {role && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      isAdmin
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-white/20 text-white'
                    }`}>
                      {role}
                    </span>
                  )}
                </span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-all hover:scale-105 shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-sm border-t border-white/20">
            <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-1">
              <NavLink to="/dashboard" className={linkActive} onClick={() => setMenuOpen(false)}>📋 Listen</NavLink>
              <NavLink to="/test" className={linkActive} onClick={() => setMenuOpen(false)}>🎯 Test</NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={linkActive} onClick={() => setMenuOpen(false)}>⚙️ Admin</NavLink>
              )}
              {(username || firstname) && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  <button
                    onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-white rounded-xl hover:bg-white/10"
                  >
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-white text-base font-bold ${avatarClasses()}`}>
                      {initial}
                    </span>
                    <span className="flex items-center gap-2">
                      {displayName}
                      {role && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          isAdmin
                            ? 'bg-yellow-400 text-yellow-900'
                            : 'bg-white/20 text-white'
                        }`}>
                          {role}
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      {/* spacer so page content doesn't sit under fixed header */}
      <div className="h-16" />
    </>
  );
}
