import { useEffect, useState } from "react";
import {
  getVocabLists,
  createVocabList,
  getEntriesByList,
  createEntry,
  updateEntry,
  deleteEntry,
} from "../services/api";

/**
 * Jeder Nutzer kann beim Erstellen einer Liste ein beliebiges Schema (Spalten) definieren.
 * Die Spaltennamen werden einfach als Array gespeichert (z.B. ["Deutsch 1", "Latein 2", "Fachsprache"]).
 * In den Einträgen werden die Werte als { [spaltenname]: text } gespeichert.
 */

const schemaKey = (listId: number) => `flex-schema-${listId}`;

function loadSchema(listId: number): string[] {
  try {
    const raw = localStorage.getItem(schemaKey(listId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSchema(listId: number, schema: string[]) {
  localStorage.setItem(schemaKey(listId), JSON.stringify(schema));
}

interface VocabList {
  id: number;
  name: string;
}

interface EntryRow {
  id: number;
  fields: Record<string, string>; // {"Deutsch 1": "Baum", "Latein 2": "arbor", ...}
}

export default function VocabListFlexible() {
  const [lists, setLists] = useState<VocabList[]>([]);
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [schema, setSchema] = useState<string[]>([]);
  const [draftSchema, setDraftSchema] = useState<string[]>(["Spalte 1", "Spalte 2"]);
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [newRow, setNewRow] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [listName, setListName] = useState("");

  const loadLists = async () => {
    try {
      const res = await getVocabLists();
      setLists(res.data);
    } catch {
      alert("Fehler beim Laden der Listen");
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  const loadEntries = async (id: number) => {
    const schema = loadSchema(id);
    setSchema(schema);
    try {
      const res = await getEntriesByList(id);
      const entries = (res.data || []).map((e: any) => ({
        id: e.id,
        fields: { ...schema.reduce((obj, s) => ({ ...obj, [s]: "" }), {}), ...e.fields },
      }));
      setRows(entries);
    } catch {
      alert("Fehler beim Laden der Einträge");
    }
  };

  const handleCreateList = async () => {
    if (!listName.trim()) return alert("Bitte einen Listennamen eingeben");
    if (draftSchema.length < 2) return alert("Mindestens 2 Spalten definieren!");
    try {
      const res = await createVocabList(listName.trim());
      const id = res.data.id;
      saveSchema(id, draftSchema);
      setLists((prev) => [...prev, { id, name: listName.trim() }]);
      setSelectedList(id);
      setSchema(draftSchema);
      setListName("");
    } catch {
      alert("Fehler beim Erstellen der Liste");
    }
  };

  const addColumn = () => {
    const name = prompt("Name der neuen Spalte:");
    if (!name) return;
    setDraftSchema((prev) => [...prev, name.trim()]);
  };

  const addRow = async () => {
    if (!selectedList) return;
    for (const s of schema) {
      if (!newRow[s] || newRow[s].trim() === "") return alert("Bitte alle Felder ausfüllen!");
    }
    try {
      const payload = { fields: newRow, vocab_list_id: selectedList };
      const res = await createEntry(payload);
      const id = res.data?.id || Math.random();
      setRows((r) => [...r, { id, fields: { ...newRow } }]);
      const empty: Record<string, string> = {};
      schema.forEach((s) => (empty[s] = ""));
      setNewRow(empty);
    } catch {
      alert("Fehler beim Erstellen des Eintrags");
    }
  };

  const updateRow = async (row: EntryRow) => {
    if (!selectedList) return;
    try {
      await updateEntry(row.id, { fields: row.fields });
      setEditingId(null);
    } catch {
      alert("Fehler beim Aktualisieren");
    }
  };

  const deleteRow = async (id: number) => {
    if (!confirm("Eintrag löschen?")) return;
    try {
      await deleteEntry(id);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch {
      alert("Fehler beim Löschen");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">🧠 Flexible Vokabellisten</h1>

        {/* Listenauswahl */}
        <div className="flex flex-wrap gap-2 mb-4">
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setSelectedList(l.id);
                loadEntries(l.id);
              }}
              className={`px-3 py-1 rounded border ${
                selectedList === l.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>

        {/* Neue Liste */}
        <div className="border rounded p-4 mb-6 bg-gray-50">
          <h2 className="font-semibold mb-2">Neue Liste erstellen</h2>
          <input
            type="text"
            placeholder="Name der Liste"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            className="border rounded px-3 py-2 mb-3 w-full"
          />
          <p className="text-sm mb-2">Spalten definieren (beliebig, z. B. „Deutsch 1“, „Latein 2“, …)</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {draftSchema.map((s, i) => (
              <span key={i} className="px-2 py-1 bg-gray-100 rounded border">
                {s}
              </span>
            ))}
            <button onClick={addColumn} className="bg-gray-200 px-3 py-1 rounded">
              + Spalte
            </button>
          </div>
          <button
            onClick={handleCreateList}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Liste erstellen
          </button>
        </div>

        {/* Einträge */}
        {selectedList && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-3">
              Einträge in „{lists.find((l) => l.id === selectedList)?.name}“
            </h2>

            {/* Neuer Eintrag */}
            {schema.length > 0 && (
              <div className="border rounded p-4 bg-gray-50 mb-6">
                <h3 className="font-semibold mb-3">Neuen Eintrag hinzufügen</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                  {schema.map((s) => (
                    <div key={s}>
                      <label className="text-xs text-gray-500">{s}</label>
                      <input
                        type="text"
                        value={newRow[s] || ""}
                        onChange={(e) =>
                          setNewRow((prev) => ({ ...prev, [s]: e.target.value }))
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={addRow}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Hinzufügen
                </button>
              </div>
            )}

            {/* Tabelle */}
            {rows.length === 0 ? (
              <p className="text-gray-500">Noch keine Einträge.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      {schema.map((s) => (
                        <th key={s} className="text-left px-3 py-2 border-b">
                          {s}
                        </th>
                      ))}
                      <th className="px-3 py-2 border-b text-center">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b">
                        {schema.map((s) => (
                          <td key={s} className="px-3 py-1">
                            {editingId === r.id ? (
                              <input
                                type="text"
                                value={r.fields[s] || ""}
                                onChange={(e) =>
                                  setRows((prev) =>
                                    prev.map((x) =>
                                      x.id === r.id
                                        ? {
                                            ...x,
                                            fields: {
                                              ...x.fields,
                                              [s]: e.target.value,
                                            },
                                          }
                                        : x
                                    )
                                  )
                                }
                                className="border rounded px-2 py-1 w-full"
                              />
                            ) : (
                              r.fields[s] || "-"
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-1 text-center">
                          {editingId === r.id ? (
                            <>
                              <button
                                onClick={() => updateRow(r)}
                                className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                              >
                                ✔
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-gray-400 text-white px-2 py-1 rounded"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingId(r.id)}
                                className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => deleteRow(r.id)}
                                className="bg-red-500 text-white px-2 py-1 rounded"
                              >
                                🗑
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}