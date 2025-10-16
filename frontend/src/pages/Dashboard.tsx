import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../services/auth";
import {
  getVocabLists,
  createVocabList,
  updateVocabList,
  deleteVocabList,
  getEntriesTable,
  getEntriesByList,
  createEntry,
  deleteEntry,
  updateEntry,
} from "../services/api";

interface EntryRow {
  entry_id: number;
  term: string;
  source_language: string;
  [lang: string]: any;
}

interface VocabList {
  id: number;
  name: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [lists, setLists] = useState<VocabList[]>([]);
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [langsInput, setLangsInput] = useState("");
  
  // Form States
  const [newListName, setNewListName] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [newSourceLang, setNewSourceLang] = useState("de");
  const [newTranslations, setNewTranslations] = useState<{ text: string; language: string }[]>([
    { text: "", language: "en" },
  ]);
  
  // Edit States
  const [editingEntry, setEditingEntry] = useState<number | null>(null);
  const [editTerm, setEditTerm] = useState("");
  const [editSourceLang, setEditSourceLang] = useState("de");
  const [editingList, setEditingList] = useState<number | null>(null);
  const [editListName, setEditListName] = useState("");
  
  // Modal States
  const [showListModal, setShowListModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUser(u))
      .catch(() => {
        alert("Bitte melde dich erneut an!");
        logout();
      });
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const res = await getVocabLists();
      setLists(res.data);
    } catch (err) {
      console.error("Fehler beim Laden der Listen:", err);
    }
  };

  const loadEntries = async (listId: number) => {
    try {
      console.log("Loading entries for list:", listId);
      
      // Try simple endpoint first
      try {
        const simpleRes = await getEntriesByList(listId);
        console.log("Simple API Response:", simpleRes.data);
        
        // Convert to table format
        const tableRows = simpleRes.data.map((entry: any) => {
          const row: any = {
            entry_id: entry.id,
            term: entry.term,
            source_language: entry.source_language,
          };
          
          // Add translations as columns
          if (entry.translations) {
            entry.translations.forEach((trans: any) => {
              row[trans.language] = trans.text;
            });
          }
          
          return row;
        });
        
        console.log("Converted table rows:", tableRows);
        setRows(tableRows);
        return;
      } catch (simpleErr) {
        console.log("Simple endpoint failed, trying table endpoint:", simpleErr);
      }
      
      // Fallback to table endpoint
      const langs = langsInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => !!s);
      console.log("Languages filter:", langs);
      const res = await getEntriesTable(listId, langs.length ? langs : undefined);
      console.log("Table API Response:", res.data);
      setRows(res.data);
    } catch (err) {
      console.error("Fehler beim Laden der Einträge:", err);
      setRows([]);
    }
  };

  const handleAddList = async () => {
    if (!newListName.trim()) return alert("Bitte einen Listennamen eingeben!");
    try {
      await createVocabList(newListName);
      setNewListName("");
      setShowListModal(false);
      loadLists();
    } catch {
      alert("Fehler beim Erstellen der Liste!");
    }
  };

  const handleEditList = async (listId: number) => {
    if (!editListName.trim()) return alert("Bitte einen Namen eingeben!");
    try {
      await updateVocabList(listId, editListName);
      setEditingList(null);
      loadLists();
    } catch {
      alert("Fehler beim Bearbeiten der Liste!");
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (!confirm("Liste wirklich löschen? Alle Vokabeln gehen verloren!")) return;
    try {
      await deleteVocabList(listId);
      if (selectedList === listId) {
        setSelectedList(null);
        setRows([]);
      }
      loadLists();
    } catch {
      alert("Fehler beim Löschen der Liste!");
    }
  };

  const handleAddEntry = async () => {
    if (!selectedList) return alert("Bitte zuerst eine Liste auswählen!");
    if (!newTerm.trim()) return alert("Bitte ein Wort eingeben!");
    try {
      const entryData = {
        term: newTerm,
        source_language: newSourceLang || undefined,
        vocab_list_id: selectedList,
        translations: newTranslations.filter((t) => t.text.trim()),
      };
      console.log("Creating entry with data:", entryData);
      const result = await createEntry(entryData);
      console.log("Entry created:", result.data);
      setNewTerm("");
      setNewSourceLang("de");
      setNewTranslations([{ text: "", language: "en" }]);
      setShowEntryModal(false);
      loadEntries(selectedList);
    } catch (err) {
      console.error("Error creating entry:", err);
      alert("Fehler beim Hinzufügen des Eintrags!");
    }
  };

  const handleEditEntry = async (entryId: number) => {
    if (!editTerm.trim()) return alert("Bitte ein Wort eingeben!");
    try {
      await updateEntry(entryId, { term: editTerm, source_language: editSourceLang });
      setEditingEntry(null);
      if (selectedList) loadEntries(selectedList);
    } catch {
      alert("Fehler beim Bearbeiten des Eintrags!");
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!confirm("Vokabel wirklich löschen?")) return;
    try {
      await deleteEntry(id);
      if (selectedList) loadEntries(selectedList);
    } catch {
      alert("Fehler beim Löschen der Vokabel!");
    }
  };

  const startEdit = (row: EntryRow) => {
    setEditingEntry(row.entry_id);
    setEditTerm(row.term);
    setEditSourceLang(row.source_language);
  };

  const startEditList = (list: VocabList) => {
    setEditingList(list.id);
    setEditListName(list.name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
              V
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Vokabel-Trainer</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-700 font-medium">{user.username}</span>
              </div>
            )}
            {user?.role === "Admin" && (
              <a href="/admin" className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors duration-200 font-medium">
                Admin
              </a>
            )}
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Listen-Sektion */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Meine Vokabellisten</h2>
            <button
              onClick={() => setShowListModal(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md"
            >
              + Neue Liste
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lists.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500 text-lg">Noch keine Vokabellisten vorhanden.</p>
                <p className="text-gray-400 text-sm mt-2">Erstelle deine erste Liste!</p>
              </div>
            )}
            {lists.map((list) => (
              <div
                key={list.id}
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-2 ${
                  selectedList === list.id ? "border-blue-500" : "border-transparent"
                }`}
              >
                {editingList === list.id ? (
                  <div className="p-4">
                    <input
                      type="text"
                      value={editListName}
                      onChange={(e) => setEditListName(e.target.value)}
                      className="w-full border-2 border-blue-500 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditList(list.id)}
                        className="flex-1 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={() => setEditingList(null)}
                        className="flex-1 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSelectedList(list.id);
                        setRows([]); // Reset rows before loading
                        loadEntries(list.id);
                      }}
                      className="w-full p-4 text-left"
                    >
                      <h3 className="font-semibold text-gray-800 text-lg mb-1">{list.name}</h3>
                      <p className="text-sm text-gray-500">Klicken zum Anzeigen</p>
                    </button>
                    <div className="border-t border-gray-200 p-3 flex gap-2">
                      <button
                        onClick={() => startEditList(list)}
                        className="flex-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm transition-colors"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="flex-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm transition-colors"
                      >
                        Löschen
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vokabel-Sektion */}
        {selectedList && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Vokabeln in{" "}
                <span className="text-blue-600">
                  {lists.find((l) => l.id === selectedList)?.name}
                </span>
              </h2>
              <button
                onClick={() => setShowEntryModal(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-md"
              >
                + Eintrag hinzufügen
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-gray-600">Spalten (Sprachcodes, Komma-getrennt):</label>
              <input
                type="text"
                value={langsInput}
                onChange={(e) => setLangsInput(e.target.value)}
                placeholder="z.B. en,fr,es"
                className="border rounded px-3 py-1"
              />
              <button onClick={() => selectedList && loadEntries(selectedList)} className="bg-gray-200 px-3 py-1 rounded">Anwenden</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Wort</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Quelle</th>
                    {rows[0] && Object.keys(rows[0])
                      .filter((k) => !["entry_id", "term", "source_language"].includes(k))
                      .map((langKey) => (
                        <th key={langKey} className="px-4 py-3 text-left font-semibold text-gray-700">{langKey.toUpperCase()}</th>
                      ))}
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={rows[0] ? Object.keys(rows[0]).length + 2 : 5} className="text-center py-12 text-gray-500">
                        Noch keine Vokabeln in dieser Liste. Füge deine erste Vokabel hinzu!
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.entry_id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        {editingEntry === row.entry_id ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={editTerm}
                                onChange={(e) => setEditTerm(e.target.value)}
                                className="w-full border-2 border-blue-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={editSourceLang}
                                onChange={(e) => setEditSourceLang(e.target.value)}
                                className="w-full border-2 border-blue-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                              />
                            </td>
                            {Object.keys(row)
                              .filter((k) => !["entry_id", "term", "source_language"].includes(k))
                              .map((langKey) => (
                                <td key={langKey} className="px-4 py-3 text-gray-700">{row[langKey] ?? "-"}</td>
                              ))}
                            <td className="px-4 py-3">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleEditEntry(row.entry_id)}
                                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                                >
                                  Speichern
                                </button>
                                <button
                                  onClick={() => setEditingEntry(null)}
                                  className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm"
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-medium text-gray-800">{row.term}</td>
                            <td className="px-4 py-3 text-gray-700">{row.source_language}</td>
                            {Object.keys(row)
                              .filter((k) => !["entry_id", "term", "source_language"].includes(k))
                              .map((langKey) => (
                                <td key={langKey} className="px-4 py-3 text-gray-700">{row[langKey] ?? "-"}</td>
                              ))}
                            <td className="px-4 py-3">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => startEdit(row)}
                                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm transition-colors"
                                >
                                  Bearbeiten
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(row.entry_id)}
                                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm transition-colors"
                                >
                                  Löschen
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Neue Liste */}
      {showListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-96">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Neue Vokabelliste erstellen</h3>
            <input
              type="text"
              placeholder="Listenname eingeben..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleAddList}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Erstellen
              </button>
              <button
                onClick={() => {
                  setShowListModal(false);
                  setNewListName("");
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Neuer Eintrag */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-96">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Neuen Eintrag hinzufügen</h3>
            <input
              type="text"
              placeholder="Wort"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 mb-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
            <input
              type="text"
              placeholder="Quellsprache (z.B. de)"
              value={newSourceLang}
              onChange={(e) => setNewSourceLang(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 mb-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <div className="mb-3">
              <div className="font-semibold mb-2">Übersetzungen</div>
              {newTranslations.map((t, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Sprache (z.B. en)"
                    value={t.language}
                    onChange={(e) => {
                      const next = [...newTranslations];
                      next[idx] = { ...next[idx], language: e.target.value };
                      setNewTranslations(next);
                    }}
                    className="w-24 border-2 border-gray-300 rounded-lg px-2 py-1"
                  />
                  <input
                    type="text"
                    placeholder="Text"
                    value={t.text}
                    onChange={(e) => {
                      const next = [...newTranslations];
                      next[idx] = { ...next[idx], text: e.target.value };
                      setNewTranslations(next);
                    }}
                    className="flex-1 border-2 border-gray-300 rounded-lg px-2 py-1"
                  />
                  <button
                    onClick={() => setNewTranslations(newTranslations.filter((_, i) => i !== idx))}
                    className="bg-red-100 text-red-600 px-2 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => setNewTranslations([...newTranslations, { text: "", language: "" }])}
                className="bg-gray-100 px-3 py-1 rounded"
              >
                + Zeile
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddEntry}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Hinzufügen
              </button>
              <button
                onClick={() => {
                  setShowEntryModal(false);
                  setNewTerm("");
                  setNewSourceLang("de");
                  setNewTranslations([{ text: "", language: "en" }]);
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}