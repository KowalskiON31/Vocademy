import { useState } from "react";
import { register } from "../services/auth";

export default function Register() {
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const pwReq = {
    length: (v: string) => v.length >= 8,
    lower: (v: string) => /[a-z]/.test(v),
    upper: (v: string) => /[A-Z]/.test(v),
    digit: (v: string) => /\d/.test(v),
    special: (v: string) => /[^A-Za-z0-9]/.test(v),
  };
  const pwOk = pwReq.length(password) && pwReq.lower(password) && pwReq.upper(password) && pwReq.digit(password) && pwReq.special(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !firstname.trim() || !email.trim() || !password.trim()) {
      setError("Bitte Benutzername, Vorname, E-Mail und Passwort eingeben!");
      return;
    }

    setLoading(true);
    try {
      await register(username, password, email, firstname);
      setSuccess("Registrierung erfolgreich. Weiterleitung zum Login...");
      setTimeout(() => (window.location.href = "/login"), 800);
    } catch (err: any) {
      console.error("Registrierungsfehler:", err);
      setError("Registrierung fehlgeschlagen! Benutzername oder E-Mail existiert bereits.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md space-y-4 fade-in"
      >
        <h2 className="text-2xl font-bold text-center mb-2">Registrieren</h2>
        <p className="text-center text-gray-500 text-sm mb-4">
          Erstelle ein neues Benutzerkonto, um Vocademy zu nutzen.
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
            className={`w-full border rounded pl-10 pr-3 py-2 focus:outline-none focus:ring focus:ring-blue-200 ${error && !username.trim() ? 'border-red-500' : ''}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="relative">
          <span className="absolute left-3 top-2.5 text-gray-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-3-3.87"/><path d="M8 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
          <input
            type="text"
            placeholder="Vorname"
            className={`w-full border rounded pl-10 pr-3 py-2 focus:outline-none focus:ring focus:ring-blue-200 ${error && !firstname.trim() ? 'border-red-500' : ''}`}
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
          />
        </div>

        <div className="relative">
          <span className="absolute left-3 top-2.5 text-gray-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" fill="none"/><path d="M22 6l-10 7L2 6"/></svg>
          </span>
          <input
            type="email"
            placeholder="E-Mail"
            className={`w-full border rounded pl-10 pr-3 py-2 focus:outline-none focus:ring focus:ring-blue-200 ${error && !email.trim() ? 'border-red-500' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="relative">
          <span className="absolute left-3 top-2.5 text-gray-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </span>
          <input
            type={showPwd ? "text" : "password"}
            placeholder="Passwort"
            className={`w-full border rounded pl-10 pr-10 py-2 focus:outline-none focus:ring focus:ring-blue-200 ${error && !password.trim() ? 'border-red-500' : ''}`}
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

        <div className="text-xs space-y-1">
          <Req ok={pwReq.length(password)}>Mindestens 8 Zeichen</Req>
          <Req ok={pwReq.lower(password)}>Ein Kleinbuchstabe</Req>
          <Req ok={pwReq.upper(password)}>Ein Großbuchstabe</Req>
          <Req ok={pwReq.digit(password)}>Eine Ziffer</Req>
          <Req ok={pwReq.special(password)}>Ein Sonderzeichen</Req>
        </div>

        <button
          type="submit"
          disabled={loading || !pwOk}
          className={`w-full text-white py-2 rounded transition ${
            loading
              ? "bg-emerald-300 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {loading ? "Registrieren..." : "Registrieren"}
        </button>

        <p className="text-center text-sm">
          Bereits ein Konto?{" "}
          <a
            href="/login"
            className="text-blue-500 underline hover:text-blue-700"
          >
            Anmelden
          </a>
        </p>
      </form>
    </div>
  );
}

function Req({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-2 ${ok ? 'text-emerald-700' : 'text-gray-500'}`}>
      {ok ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
      )}
      <span>{children}</span>
    </div>
  );
}
