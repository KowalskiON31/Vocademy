import { useState } from "react";
import { login } from "../services/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Bitte Benutzername und Passwort eingeben!");
      return;
    }

    setLoading(true);
    try {
      const data = await login(username, password);
      if (data?.access_token) {
        localStorage.setItem("token", data.access_token);
        setSuccess("Login erfolgreich. Weiterleitung...");
        setTimeout(() => (window.location.href = "/dashboard"), 600);
      } else {
        throw new Error("Kein Token erhalten");
      }
    } catch (err: any) {
      console.error("Login-Fehler:", err);
      setError("❌ Login fehlgeschlagen! Benutzername oder Passwort ist falsch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md space-y-4 fade-in"
      >
        <h2 className="text-2xl font-bold text-center mb-2">🔐 Login</h2>
        <p className="text-center text-gray-500 text-sm mb-4">
          Bitte melde dich mit deinem Benutzerkonto an.
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 border border-red-400 p-2 rounded text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-100 text-emerald-700 border border-emerald-400 p-2 rounded text-sm">
            {success}
          </div>
        )}

        <div className="relative">
          <span className="absolute left-3 top-2.5 text-gray-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
          <input
            type="text"
            placeholder="Benutzername"
            className="w-full border rounded pl-10 pr-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="relative">
          <span className="absolute left-3 top-2.5 text-gray-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </span>
          <input
            type={showPwd ? "text" : "password"}
            placeholder="Passwort"
            className="w-full border rounded pl-10 pr-10 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-800">
            {showPwd ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12a21.77 21.77 0 0 1 5-7"/><path d="M10.58 10.58a2 2 0 1 0 2.83 2.83"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white transition ${
            loading
              ? "bg-emerald-300 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {loading ? "Anmelden..." : "Anmelden"}
        </button>

        <p className="text-center text-sm">
          Noch kein Konto?{" "}
          <a
            href="/register"
            className="text-blue-500 underline hover:text-blue-700"
          >
            Registrieren
          </a>
        </p>
      </form>
    </div>
  );
}
