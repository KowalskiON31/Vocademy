import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getVocabLists, createVocabList } from "../services/vocab";

interface VocabList {
  id: number;
  name: string;
  description?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<VocabList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [translationsCount, setTranslationsCount] = useState(2);
  const [translationNames, setTranslationNames] = useState<string[]>(["", ""]);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    getVocabLists()
      .then((res) => setLists(res.data || []))
      .catch(() => setError("Fehler beim Laden der Listen"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const names = Array.from({ length: translationsCount }, (_, i) => translationNames[i] || "");
      const res = await createVocabList(
        name.trim(),
        description.trim(),
        translationsCount,
        names
      );
      setLists((prev) => [...prev, res.data]);
      setOpen(false);
      setName("");
      setDescription("");
      setTranslationsCount(2);
      setTranslationNames(["", ""]);
    } catch {
      setError("Erstellen fehlgeschlagen");
    }
  };

  const openEdit = (list: VocabList) => {
    setEditId(list.id);
    setEditName(list.name);
    setEditDescription(list.description || "");
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editId) return;
    try {
      const { updateVocabList } = await import("../services/vocab");
      const res = await updateVocabList(editId, { name: editName, description: editDescription });
      setLists((prev) => prev.map((l) => (l.id === editId ? { ...l, name: res.data.name, description: res.data.description } : l)));
      setEditOpen(false);
    } catch {
      setError("Aktualisieren fehlgeschlagen");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Liste wirklich löschen? Alle Einträge gehen verloren.")) return;
    try {
      const { deleteVocabList } = await import("../services/vocab");
      await deleteVocabList(id);
      setLists((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError("Löschen fehlgeschlagen");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Deine Vokabellisten</h1>
          <button
            onClick={() => setOpen(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
          >
            Neue Liste
          </button>
        </div>

        {loading && <div>Laden...</div>}
        {error && (
          <div className="mb-3 bg-red-100 text-red-700 border border-red-400 p-2 rounded text-sm">{error}</div>
        )}
        {notice && (
          <div className="mb-3 bg-emerald-100 text-emerald-700 border border-emerald-400 p-2 rounded text-sm">{notice}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {lists.map((l) => (
            <div key={l.id} className="bg-white border rounded-lg p-4 hover:shadow transition transform hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <div onClick={() => navigate(`/list/${l.id}`)} className="cursor-pointer">
                  <div className="font-semibold">{l.name}</div>
                  {l.description && (
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">{l.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(l)} className="text-sm px-2 py-1 rounded hover:bg-gray-100">Bearbeiten</button>
                  <button onClick={() => handleDelete(l.id)} className="text-sm text-red-600 px-2 py-1 rounded hover:bg-red-50">Löschen</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-semibold">Neue Vokabelliste</h2>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="w-full border rounded px-3 py-2"
              placeholder="Beschreibung (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div>
              <label className="block text-sm text-gray-600 mb-1">Anzahl Übersetzungen</label>
              <input
                type="number"
                min={1}
                max={6}
                className="border rounded px-3 py-2 w-28"
                value={translationsCount}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(6, Number(e.target.value)));
                  setTranslationsCount(v);
                  setTranslationNames((prev) => {
                    const next = prev.slice();
                    next.length = v;
                    for (let i = 0; i < v; i++) if (next[i] === undefined) next[i] = "";
                    return next;
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-gray-600">Namen der Übersetzungs-Spalten</label>
              {Array.from({ length: translationsCount }).map((_, i) => (
                <input
                  key={i}
                  className="w-full border rounded px-3 py-2"
                  placeholder={`Übersetzung ${i + 1} (z.B. Englisch)`}
                  value={translationNames[i] ?? ""}
                  onChange={(e) =>
                    setTranslationNames((prev) => {
                      const next = prev.slice();
                      next[i] = e.target.value;
                      return next;
                    })
                  }
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-2 rounded hover:bg-gray-100">Abbrechen</button>
              <button onClick={handleCreate} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-semibold">Liste bearbeiten</h2>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <textarea
              className="w-full border rounded px-3 py-2"
              placeholder="Beschreibung (optional)"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setEditOpen(false)} className="px-3 py-2 rounded hover:bg-gray-100">Abbrechen</button>
              <button onClick={handleEdit} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
