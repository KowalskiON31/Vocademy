import { useState } from "react";
import { login } from "../services/auth";

export default function Login() {
  // Eingaben & Zustände
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login-Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Eingabe prüfen
    if (!username.trim() || !password.trim()) {
      setError("Bitte Benutzername und Passwort eingeben!");
      return;
    }

    setLoading(true);

    try {
      // Login-Aufruf über auth.ts
      await login(username, password);
      alert("Login erfolgreich!");
      window.location.href = "/dashboard"; // Weiterleitung nach Erfolg
    } catch (err: any) {
      console.error("Login-Fehler:", err);
      setError("Login fehlgeschlagen! Benutzername oder Passwort ist falsch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-lg rounded-lg p-8 w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center mb-2">🔐 Login</h2>
        <p className="text-center text-gray-500 text-sm mb-4">
          Bitte melde dich mit deinem Benutzerkonto an.
        </p>

        {/* Fehlermeldung */}
        {error && (
          <div className="bg-red-100 text-red-700 border border-red-400 p-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* Benutzername */}
        <input
          type="text"
          placeholder="Benutzername"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* Passwort */}
        <input
          type="password"
          placeholder="Passwort"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Login-Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white ${
            loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Anmelden..." : "Anmelden"}
        </button>

        {/* Link zur Registrierung */}
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
