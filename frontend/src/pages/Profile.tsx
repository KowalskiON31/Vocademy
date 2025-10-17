import { useEffect, useState, type ReactNode } from "react";
import Navbar from "../components/Navbar";
import { getCurrentUser } from "../services/auth";
import { updateUser, changePasswordMe } from "../services/users";

export default function Profile() {
  const [id, setId] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [pwdMsg, setPwdMsg] = useState<string>("");
  const [pwdError, setPwdError] = useState<boolean>(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const pwReq = {
    length: (v: string) => v.length >= 8,
    lower: (v: string) => /[a-z]/.test(v),
    upper: (v: string) => /[A-Z]/.test(v),
    digit: (v: string) => /\d/.test(v),
    special: (v: string) => /[^A-Za-z0-9]/.test(v),
  };
  const pwOk = pwReq.length(newPwd) && pwReq.lower(newPwd) && pwReq.upper(newPwd) && pwReq.digit(newPwd) && pwReq.special(newPwd) && newPwd === newPwd2;

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setId(u.id);
        setUsername(u.username || "");
        setFirstname(u.firstname || "");
        setEmail(u.email || "");
        setAvatar(u.avatar || "color:emerald");
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!id) return;
    setSaving(true);
    setMsg("");
    try {
      await updateUser(id, { username, email, firstname, avatar });
      setMsg("Profil gespeichert.");
    } catch (e) {
      setMsg("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Profil</h1>
        {loading ? (
          <div>Laden…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Persönliche Daten */}
            <div className="bg-white rounded-xl shadow p-6 space-y-4">
              {msg && <div className="text-sm text-emerald-700">{msg}</div>}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Avatar</label>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {['emerald','sky','fuchsia','orange','slate'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setAvatar(`color:${c}`)}
                      className={`w-10 h-10 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${avatar===`color:${c}` ? 'border-emerald-600' : 'border-transparent'}`}
                      style={{ backgroundColor: c==='emerald'?'#059669': c==='sky'?'#0284c7': c==='fuchsia'?'#c026d3': c==='orange'?'#ea580c':'#334155' }}
                      title={c}
                    >
                      <span className="text-white font-semibold">{(firstname || username || '?').substring(0,1).toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm text-gray-600 mb-1">Benutzername</label>
                <span className="absolute left-3 top-9 text-gray-500 pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input className="w-full border rounded pl-10 pr-3 py-2 bg-white" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="relative">
                <label className="block text-sm text-gray-600 mb-1">Vorname</label>
                <span className="absolute left-3 top-9 text-gray-500 pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-3-3.87"/><path d="M8 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input className="w-full border rounded pl-10 pr-3 py-2 bg-white" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
              </div>
              <div className="relative">
                <label className="block text-sm text-gray-600 mb-1">E‑Mail</label>
                <span className="absolute left-3 top-9 text-gray-500 pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" fill="none"/><path d="M22 6l-10 7L2 6"/></svg>
                </span>
                <input className="w-full border rounded pl-10 pr-3 py-2 bg-white" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={save} disabled={saving} className="w-full sm:w-auto bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded hover:bg-emerald-700">{saving ? 'Speichern…' : 'Speichern'}</button>
              </div>
            </div>

            {/* Passwort ändern */}
            <div className="bg-white rounded-xl shadow p-6 space-y-3">
              {pwdMsg && (
                <div className={`text-sm ${pwdError ? 'text-red-700' : 'text-emerald-700'}`}>{pwdMsg}</div>
              )}
              <h2 className="font-semibold">Passwort ändern</h2>
              <PasswordRow label="Aktuelles Passwort" value={currentPwd} onChange={setCurrentPwd} />
              <PasswordRow label="Neues Passwort" value={newPwd} onChange={setNewPwd} />
              <PasswordRow label="Neues Passwort bestätigen" value={newPwd2} onChange={setNewPwd2} />
              <div className="text-xs space-y-1">
                <Req ok={pwReq.length(newPwd)}>Mindestens 8 Zeichen</Req>
                <Req ok={pwReq.lower(newPwd)}>Ein Kleinbuchstabe</Req>
                <Req ok={pwReq.upper(newPwd)}>Ein Großbuchstabe</Req>
                <Req ok={pwReq.digit(newPwd)}>Eine Ziffer</Req>
                <Req ok={pwReq.special(newPwd)}>Ein Sonderzeichen</Req>
                <Req ok={newPwd === newPwd2 && newPwd.length > 0}>Passwörter stimmen überein</Req>
              </div>
              <div className="flex items-center justify-end">
                <button
                  onClick={async () => {
                    setPwdMsg("");
                    setPwdError(false);
                    if (!currentPwd || !newPwd || newPwd !== newPwd2) {
                      setPwdMsg("Bitte Felder prüfen (Passwörter müssen übereinstimmen).");
                      setPwdError(true);
                      return;
                    }
                    try {
                      await changePasswordMe(currentPwd, newPwd);
                      setPwdMsg("Passwort geändert.");
                      setPwdError(false);
                      setCurrentPwd("");
                      setNewPwd("");
                      setNewPwd2("");
                    } catch {
                      setPwdMsg("Ändern fehlgeschlagen (aktuelles Passwort korrekt?).");
                      setPwdError(true);
                    }
                  }}
                  disabled={!pwOk}
                  className={`px-4 py-2 rounded text-white ${pwOk ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-300 cursor-not-allowed'}`}
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <span className="absolute left-3 top-9 text-gray-500 pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </span>
      <input
        type={show ? 'text' : 'password'}
        className="w-full border rounded pl-10 pr-10 py-2 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-9 text-gray-600 hover:text-gray-800">
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12a21.77 21.77 0 0 1 5-7"/><path d="M10.58 10.58a2 2 0 1 0 2.83 2.83"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        )}
      </button>
    </div>
  );
}

function Req({ ok, children }: { ok: boolean; children: ReactNode }) {
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
