import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { updateEntry, deleteEntry } from "../services/vocab";
import Navbar from "../components/Navbar";

interface Column {
  id: number;
  name: string;
}
interface FieldValue {
  column_id: number;
  value: string;
}
interface Entry {
  id: number;
  field_values: FieldValue[];
}

export default function VocabListFlexible() {
  const { id } = useParams();
  const [columns, setColumns] = useState<Column[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [newValues, setNewValues] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<number, string>>({});

  useEffect(() => {
    api.get(`/vocablist/${id}`).then((res) => {
      setColumns(res.data.columns || []);
      setEntries(res.data.entries || []);
    });
  }, [id]);

  const handleAddEntry = async () => {
    const data = {
      vocab_list_id: Number(id),
      field_values: Object.entries(newValues).map(([column_id, value]) => ({
        column_id: Number(column_id),
        value,
      })),
    };
    const res = await api.post("/vocab/entries", data);
    setEntries((prev) => [...prev, res.data]);
    setNewValues({});
  };

  const startEdit = (entry: Entry) => {
    setEditingId(entry.id);
    const map: Record<number, string> = {};
    entry.field_values.forEach((f) => (map[f.column_id] = f.value));
    setEditValues(map);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await updateEntry(editingId, editValues);
    setEntries((prev) => prev.map((e) => (e.id === editingId ? res.data : e)));
    setEditingId(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const removeEntry = async (entryId: number) => {
    if (!confirm("Eintrag wirklich löschen?")) return;
    await deleteEntry(entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Vokabeln verwalten</h1>
        </div>

        {/* Mobile: Kartenansicht */}
        <div className="md:hidden space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow p-4 transition transform hover:-translate-y-0.5">
              <div className="space-y-2">
                {columns.map((col) => {
                  const val = (editingId === entry.id
                    ? editValues[col.id]
                    : entry.field_values.find((f) => f.column_id === col.id)?.value) || "";
                  return (
                    <div key={col.id} className="text-sm">
                      <div className="text-gray-500">{col.name}</div>
                      {editingId === entry.id ? (
                        <input
                          className="mt-1 border px-2 py-1 rounded w-full"
                          value={val}
                          onChange={(e) => setEditValues({ ...editValues, [col.id]: e.target.value })}
                        />
                      ) : (
                        <div className="mt-1">{val || <span className="text-gray-400">(leer)</span>}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                {editingId === entry.id ? (
                  <>
                    <button onClick={saveEdit} className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700">Speichern</button>
                    <button onClick={cancelEdit} className="px-3 py-1 rounded hover:bg-gray-100">Abbrechen</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(entry)} className="px-3 py-1 rounded hover:bg-gray-100">Bearbeiten</button>
                    <button onClick={() => removeEntry(entry.id)} className="text-red-600 px-3 py-1 rounded hover:bg-red-50">Löschen</button>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Neue Vokabel (mobil) */}
          <div className="bg-white rounded-lg shadow p-4 transition">
            <div className="space-y-2">
              {columns.map((col) => (
                <div key={col.id} className="text-sm">
                  <div className="text-gray-500">{col.name}</div>
                  <input
                    className="mt-1 border px-2 py-1 rounded w-full"
                    placeholder={col.name}
                    value={newValues[col.id] || ""}
                    onChange={(e) => setNewValues({ ...newValues, [col.id]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button onClick={handleAddEntry} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 w-full">Vokabel hinzufügen</button>
            </div>
          </div>
        </div>

        {/* Desktop: Tabelle */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-200">
              <tr>
                {columns.map((col) => (
                  <th key={col.id} className="px-4 py-2 text-left">{col.name}</th>
                ))}
                <th className="px-4 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t">
                  {columns.map((col) => {
                    const val = (editingId === entry.id
                      ? editValues[col.id]
                      : entry.field_values.find((f) => f.column_id === col.id)?.value) || "";
                    return (
                      <td key={col.id} className="px-4 py-2">
                        {editingId === entry.id ? (
                          <input
                            className="border px-2 py-1 rounded w-full"
                            value={val}
                            onChange={(e) => setEditValues({ ...editValues, [col.id]: e.target.value })}
                          />
                        ) : (
                          val
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {editingId === entry.id ? (
                      <>
                        <button onClick={saveEdit} className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 mr-2">Speichern</button>
                        <button onClick={cancelEdit} className="px-3 py-1 rounded hover:bg-gray-100">Abbrechen</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(entry)} className="px-3 py-1 rounded hover:bg-gray-100 mr-2">Bearbeiten</button>
                        <button onClick={() => removeEntry(entry.id)} className="text-red-600 px-3 py-1 rounded hover:bg-red-50">Löschen</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                {columns.map((col) => (
                  <td key={col.id} className="px-4 py-2">
                    <input
                      type="text"
                      className="border px-2 py-1 rounded w-full"
                      placeholder={col.name}
                      value={newValues[col.id] || ""}
                      onChange={(e) => setNewValues({ ...newValues, [col.id]: e.target.value })}
                    />
                  </td>
                ))}
                <td className="px-4 py-2 text-right">
                  <button onClick={handleAddEntry} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">Hinzufügen</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Desktop: zusätzlicher Button (redundant) */}
        <div className="hidden md:block mt-4">
          <button
            onClick={handleAddEntry}
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
          >
            Vokabel hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}
