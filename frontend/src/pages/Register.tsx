import { useState } from "react";
import { register } from "../services/auth";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Bitte Benutzername und Passwort eingeben!");
      return;
    }
    try {
      setLoading(true);
      await register(username, password);
      alert("Registrierung erfolgreich! Bitte anmelden.");
      window.location.href = "/login";
    } catch (err: any) {
      setError("Registrierung fehlgeschlagen!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="bg-white shadow-lg rounded-lg p-8 w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center mb-2">👤 Registrieren</h2>
        {error && (
          <div className="bg-red-100 text-red-700 border border-red-400 p-2 rounded text-sm">
            {error}
          </div>
        )}
        <input
          type="text"
          placeholder="Benutzername"
          className="w-full border rounded px-3 py-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Passwort"
          className="w-full border rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white py-2 rounded ${loading ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"}`}
        >
          {loading ? "Registrieren..." : "Registrieren"}
        </button>
        <p className="text-center text-sm">
          Bereits ein Konto?{" "}
          <a href="/login" className="text-blue-500 underline">
            Anmelden
          </a>
        </p>
      </form>
    </div>
  );
}
