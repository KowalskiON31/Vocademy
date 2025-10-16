import { useEffect, useState } from "react";
import { getUsers, updateUser, deleteUser } from "../services/api";

interface User {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await getUsers();
      setUsers(res.data);
    } catch (e: any) {
      setError("Konnte Benutzer nicht laden (nur Admin).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onToggleActive = async (user: User) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      load();
    } catch {
      alert("Update fehlgeschlagen");
    }
  };

  const onToggleRole = async (user: User) => {
    try {
      const newRole = user.role === "Admin" ? "User" : "Admin";
      await updateUser(user.id, { role: newRole });
      load();
    } catch {
      alert("Rollenwechsel fehlgeschlagen");
    }
  };

  const onDelete = async (user: User) => {
    if (!confirm(`Benutzer ${user.username} löschen?`)) return;
    try {
      await deleteUser(user.id);
      load();
    } catch {
      alert("Löschen fehlgeschlagen");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Admin: Benutzerverwaltung</h1>
          <button onClick={load} className="bg-gray-100 px-3 py-1 rounded">Neu laden</button>
        </div>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        {loading ? (
          <div>Laden…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Rolle</th>
                  <th className="px-3 py-2">Aktiv</th>
                  <th className="px-3 py-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="px-3 py-2">{u.id}</td>
                    <td className="px-3 py-2">{u.username}</td>
                    <td className="px-3 py-2">{u.role}</td>
                    <td className="px-3 py-2">{u.is_active ? "Ja" : "Nein"}</td>
                    <td className="px-3 py-2 flex gap-2">
                      <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={() => onToggleRole(u)}>
                        Rolle wechseln
                      </button>
                      <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => onToggleActive(u)}>
                        {u.is_active ? "Deaktivieren" : "Aktivieren"}
                      </button>
                      <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => onDelete(u)}>
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


