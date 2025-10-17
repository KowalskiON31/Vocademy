import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Trash2 } from "lucide-react";
import { getUsers, toggleUserActivation, deleteUser, updateUser } from "../services/users";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    getUsers()
      .then((res) => setUsers(res.data))
      .catch(() => setError("Fehler beim Laden"));
  }, []);

  const normalized = (r: string) => (/^admin$/i.test(r) ? 'Admin' : 'User');

  const handleDeleteRequest = (id: number) => setConfirmId(id);
  const handleDeleteConfirm = async () => {
    if (!confirmId) return;
    try {
      await deleteUser(confirmId);
      setUsers((u) => u.filter((x) => x.id !== confirmId));
    } catch {
      setError("Löschen fehlgeschlagen");
    } finally {
      setConfirmId(null);
    }
  };

  const handleToggle = async (id: number, current: boolean) => {
    await toggleUserActivation(id, !current);
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, is_active: !current } : x)));
  };

  const handleRoleChange = async (id: number, roleSel: string) => {
    const newRole = normalized(roleSel);
    await updateUser(id, { role: newRole });
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, role: newRole } : x)));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>
          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">Admin-Bereich</span>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Mobile: Kartenliste */}
        <div className="md:hidden space-y-3">
          {users.map((u) => {
            const roleLabel = normalized(u.role);
            const confirming = confirmId === u.id;
            return (
            <div key={u.id} className="bg-white rounded-lg shadow p-4 transition transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{u.username}</div>
                  <div className="text-sm text-gray-600">{u.email}</div>
                  <div className="mt-1 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 mr-2">{roleLabel}</span>
                    <span className={`px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{u.is_active ? 'aktiv' : 'inaktiv'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {confirming ? (
                    <>
                      <button onClick={handleDeleteConfirm} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Löschen</button>
                      <button onClick={() => setConfirmId(null)} className="px-3 py-1 rounded border hover:bg-gray-50">Abbrechen</button>
                    </>
                  ) : (
                    <>
                      <select value={roleLabel} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="border rounded px-2 py-1">
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleToggle(u.id, u.is_active)}
                        className="px-3 py-1 rounded bg-white border hover:bg-gray-50"
                      >
                        Toggle
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(u.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );})}
        </div>

        {/* Desktop: Tabelle */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Benutzername</th>
                <th className="px-4 py-2 text-left">E-Mail</th>
                <th className="px-4 py-2 text-left">Rolle</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const roleLabel = normalized(u.role);
                const confirming = confirmId === u.id;
                return (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">
                    <select value={roleLabel} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="border rounded px-2 py-1">
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleToggle(u.id, u.is_active)}
                      className={`px-3 py-1 rounded ${u.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {u.is_active ? "aktiv" : "inaktiv"}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {confirming ? (
                      <div className="inline-flex items-center gap-2">
                        <button onClick={handleDeleteConfirm} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Löschen</button>
                        <button onClick={() => setConfirmId(null)} className="px-3 py-1 rounded border hover:bg-gray-50">Abbrechen</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteRequest(u.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

