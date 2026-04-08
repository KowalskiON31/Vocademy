import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { updateEntry, deleteEntry, addColumnToList, deleteColumn, updateColumn } from "../services/vocab";
import Navbar from "../components/Navbar";
import Toaster from "../components/Toaster";
import type { Toast } from "../components/Toaster";

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
  const [deletePendingEntryId, setDeletePendingEntryId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Column Management State
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [deletePendingColumnId, setDeletePendingColumnId] = useState<number | null>(null);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [editColumnName, setEditColumnName] = useState("");

  const addToast = (message: string, type: Toast["type"] = "info", ttl = 3000) => {
    const id = String(Date.now()) + Math.random().toString(16).slice(2, 8);
    const t: Toast = { id, message, type };
    setToasts((s) => [t, ...s]);
    if (ttl) setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), ttl);
  };

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
    addToast("Eintrag erstellt", "success");
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
    try {
      await deleteEntry(entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      addToast("Eintrag gelöscht", "success");
    } catch {
      addToast("Löschen fehlgeschlagen", "error");
    } finally {
      setDeletePendingEntryId(null);
    }
  };

  // Column Management Functions
  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      addToast("Bitte Spaltenname eingeben", "error");
      return;
    }
    try {
      const position = columns.length;
      const res = await addColumnToList(Number(id), {
        name: newColumnName.trim(),
        column_type: "custom",
        position,
      });
      setColumns((prev) => [...prev, res.data]);
      setNewColumnName("");
      setShowAddColumnModal(false);
      setShowColumnManager(true);
      addToast("Spalte hinzugefügt", "success");
    } catch {
      addToast("Spalte konnte nicht hinzugefügt werden", "error");
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    try {
      await deleteColumn(columnId);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      // Entferne auch die Werte aus den Einträgen (nur im Frontend-State)
      setEntries((prev) =>
        prev.map((entry) => ({
          ...entry,
          field_values: entry.field_values.filter((fv) => fv.column_id !== columnId),
        }))
      );
      setDeletePendingColumnId(null);
      addToast("Spalte gelöscht", "success");
    } catch {
      addToast("Spalte konnte nicht gelöscht werden", "error");
      setDeletePendingColumnId(null);
    }
  };

  const startEditColumn = (col: Column) => {
    setEditingColumnId(col.id);
    setEditColumnName(col.name);
    setDeletePendingColumnId(null);
  };

  const saveColumnEdit = async () => {
    if (!editingColumnId || !editColumnName.trim()) {
      addToast("Bitte Spaltenname eingeben", "error");
      return;
    }
    try {
      const res = await updateColumn(editingColumnId, { name: editColumnName.trim() });
      setColumns((prev) =>
        prev.map((c) => (c.id === editingColumnId ? res.data : c))
      );
      setEditingColumnId(null);
      setEditColumnName("");
      addToast("Spalte umbenannt", "success");
    } catch {
      addToast("Umbenennen fehlgeschlagen", "error");
    }
  };

  const cancelColumnEdit = () => {
    setEditingColumnId(null);
    setEditColumnName("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Toaster toasts={toasts} onRemove={(id) => setToasts((s) => s.filter((t) => t.id !== id))} />

      {/* Add Column Modal */}
      {showAddColumnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Neue Spalte hinzufügen</h2>
            <input
              type="text"
              className="border px-3 py-2 rounded w-full mb-4"
              placeholder="Spaltenname (z.B. Beispielsatz, Notiz...)"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddColumnModal(false);
                  setNewColumnName("");
                  setShowColumnManager(true);
                }}
                className="px-4 py-2 rounded hover:bg-gray-100"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddColumn}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Manager Modal */}
      {showColumnManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold mb-4">Spalten verwalten</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {columns.map((col, index) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-gray-400 text-sm w-6">{index + 1}.</span>
                    {editingColumnId === col.id ? (
                      <input
                        type="text"
                        className="border px-2 py-1 rounded flex-1"
                        value={editColumnName}
                        onChange={(e) => setEditColumnName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveColumnEdit();
                          if (e.key === "Escape") cancelColumnEdit();
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{col.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {editingColumnId === col.id ? (
                      <>
                        <button
                          onClick={saveColumnEdit}
                          className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded hover:bg-emerald-100 text-sm"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={cancelColumnEdit}
                          className="px-3 py-1 rounded hover:bg-gray-200 text-sm"
                        >
                          Abbrechen
                        </button>
                      </>
                    ) : deletePendingColumnId === col.id ? (
                      <>
                        <span className="text-sm text-red-600">Löschen?</span>
                        <button
                          onClick={() => handleDeleteColumn(col.id)}
                          className="text-red-600 bg-red-50 px-3 py-1 rounded hover:bg-red-100 text-sm"
                        >
                          Ja
                        </button>
                        <button
                          onClick={() => setDeletePendingColumnId(null)}
                          className="px-3 py-1 rounded hover:bg-gray-200 text-sm"
                        >
                          Nein
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditColumn(col)}
                          className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm"
                          title="Spalte umbenennen"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => setDeletePendingColumnId(col.id)}
                          className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm"
                          title="Spalte löschen"
                        >
                          Löschen
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {columns.length === 0 && (
                <div className="text-gray-500 text-center py-4">Keine Spalten vorhanden</div>
              )}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => {
                  setShowColumnManager(false);
                  setShowAddColumnModal(true);
                  setEditingColumnId(null);
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
              >
                + Neue Spalte
              </button>
              <button
                onClick={() => {
                  setShowColumnManager(false);
                  setDeletePendingColumnId(null);
                  setEditingColumnId(null);
                }}
                className="px-4 py-2 rounded hover:bg-gray-100"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Vokabeln verwalten</h1>
          <button
            onClick={() => setShowColumnManager(true)}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            Spalten
          </button>
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
                    {deletePendingEntryId === entry.id ? (
                      <>
                        <button onClick={() => removeEntry(entry.id)} className="text-red-600 px-3 py-1 rounded bg-red-50">Ja, löschen</button>
                        <button onClick={() => setDeletePendingEntryId(null)} className="px-3 py-1 rounded hover:bg-gray-100">Abbrechen</button>
                      </>
                    ) : (
                      <button onClick={() => setDeletePendingEntryId(entry.id)} className="text-red-600 px-3 py-1 rounded hover:bg-red-50">Löschen</button>
                    )}
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
                            {deletePendingEntryId === entry.id ? (
                              <>
                                <button onClick={() => removeEntry(entry.id)} className="text-red-600 px-3 py-1 rounded bg-red-50 mr-2">Ja, löschen</button>
                                <button onClick={() => setDeletePendingEntryId(null)} className="px-3 py-1 rounded hover:bg-gray-100">Abbrechen</button>
                              </>
                            ) : (
                              <button onClick={() => setDeletePendingEntryId(entry.id)} className="text-red-600 px-3 py-1 rounded hover:bg-red-50">Löschen</button>
                            )}
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
