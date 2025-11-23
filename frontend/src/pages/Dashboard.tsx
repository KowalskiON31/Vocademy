import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getVocabLists, createVocabList, getVocabGroups, createVocabGroup, updateVocabGroup, deleteVocabGroup } from "../services/vocab";
import Toaster from "../components/Toaster";
import type { Toast } from "../components/Toaster";

interface VocabList {
  id: number;
  name: string;
  description?: string;
  group_id?: number | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<VocabList[]>([]);
  const [groups, setGroups] = useState<Array<{ id: number; name: string; description?: string }>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice] = useState("");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [translationsCount, setTranslationsCount] = useState(2);
  const [translationNames, setTranslationNames] = useState<string[]>(["", ""]);
  const [translationsCountInput, setTranslationsCountInput] = useState(String(2));

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editGroupId, setEditGroupId] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false);
  const [manageNewGroupName, setManageNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [editingGroupDesc, setEditingGroupDesc] = useState<string | undefined>(undefined);
  const [deletePendingGroupId, setDeletePendingGroupId] = useState<number | null>(null);
  const [deletePendingListId, setDeletePendingListId] = useState<number | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast["type"] = "info", ttl = 3000) => {
    const id = String(Date.now()) + Math.random().toString(16).slice(2, 8);
    const t: Toast = { id, message, type };
    setToasts((s) => [t, ...s]);
    if (ttl) setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), ttl);
  };

  const removeToast = (id: string) => setToasts((s) => s.filter((t) => t.id !== id));

  useEffect(() => {
    getVocabLists()
      .then((res) => setLists(res.data || []))
      .catch(() => setError("Fehler beim Laden der Listen"))
      .finally(() => setLoading(false));

    // load groups
    getVocabGroups()
      .then((res) => setGroups(res.data || []))
      .catch(() => {/* ignore */});
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const names = Array.from({ length: translationsCount }, (_, i) => translationNames[i] || "");

      let groupIdToUse: number | null = selectedGroupId;
      if (newGroupName && newGroupName.trim()) {
        const g = await createVocabGroup(newGroupName.trim());
        groupIdToUse = g.data.id;
        // refresh groups list
        setGroups((prev) => [...prev, g.data]);
      }

      const res = await createVocabList(
        name.trim(),
        description.trim(),
        translationsCount,
        names,
        groupIdToUse
      );
      setLists((prev) => [...prev, res.data]);
      setOpen(false);
      setName("");
      setDescription("");
      setTranslationsCount(2);
      setTranslationNames(["", ""]);
      setSelectedGroupId(null);
      setNewGroupName("");
      addToast("Liste erstellt", "success");
    } catch {
      setError("Erstellen fehlgeschlagen");
      addToast("Erstellen fehlgeschlagen", "error");
    }
  };

  const openEdit = (list: VocabList) => {
    setEditId(list.id);
    setEditName(list.name);
    setEditDescription(list.description || "");
    setEditGroupId(list.group_id ?? null);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editId) return;
    try {
      const { updateVocabList } = await import("../services/vocab");
      const payload: any = { name: editName, description: editDescription };
      if (editGroupId !== undefined) payload.group_id = editGroupId;
      const res = await updateVocabList(editId, payload);
      // replace the whole list object so group_id changes are reflected immediately
      setLists((prev) => prev.map((l) => (l.id === editId ? res.data : l)));
      setEditOpen(false);
      addToast("Liste aktualisiert", "success");
    } catch {
      setError("Aktualisieren fehlgeschlagen");
      addToast("Aktualisieren fehlgeschlagen", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { deleteVocabList } = await import("../services/vocab");
      await deleteVocabList(id);
      setLists((prev) => prev.filter((l) => l.id !== id));
      addToast("Liste gelöscht", "success");
    } catch {
      setError("Löschen fehlgeschlagen");
      addToast("Löschen fehlgeschlagen", "error");
    } finally {
      setDeletePendingListId(null);
    }
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreateGroupInManage = async () => {
    if (!manageNewGroupName.trim()) return;
    try {
      const res = await createVocabGroup(manageNewGroupName.trim());
      setGroups((prev) => [...prev, res.data]);
      setManageNewGroupName("");
      addToast("Gruppe erstellt", "success");
    } catch {
      setError("Gruppe erstellen fehlgeschlagen");
      addToast("Gruppe erstellen fehlgeschlagen", "error");
    }
  };

  const handleUpdateGroup = async (id: number, name: string, description?: string) => {
    try {
      const res = await updateVocabGroup(id, { name, description });
      setGroups((prev) => prev.map((g) => (g.id === id ? res.data : g)));
      addToast("Gruppe aktualisiert", "success");
    } catch {
      setError("Gruppe aktualisieren fehlgeschlagen");
      addToast("Gruppe aktualisieren fehlgeschlagen", "error");
    }
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      await deleteVocabGroup(id);
      // remove group locally and set lists' group_id to null
      setGroups((prev) => prev.filter((g) => g.id !== id));
      setLists((prev) => prev.map((l) => (l.group_id === id ? { ...l, group_id: null } : l)));
      addToast("Gruppe gelöscht", "success");
    } catch {
      setError("Gruppe löschen fehlgeschlagen");
      addToast("Gruppe löschen fehlgeschlagen", "error");
    } finally {
      setDeletePendingGroupId(null);
    }
  };

  // grouping helper
  const grouped = useMemo(() => {
    const map: Record<string, VocabList[]> = {};
    // initialize with all known groups
    groups.forEach((g) => {
      map[String(g.id)] = [];
    });
    map["ungrouped"] = [];
    lists.forEach((l) => {
      const k = l.group_id ? String(l.group_id) : "ungrouped";
      if (!map[k]) map[k] = [];
      map[k].push(l);
    });
    return map;
  }, [lists, groups]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Toaster toasts={toasts} onRemove={removeToast} />
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Gruppen</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setManageGroupsOpen(true)} className="text-sm px-2 py-1 rounded hover:bg-gray-100">Gruppen verwalten</button>
            </div>
          </div>

          {/* Render each group */}
          {groups.map((g) => {
            const key = String(g.id);
            const items = grouped[key] || [];
            const expanded = !!expandedGroups[key];
            return (
              <div key={key} className="bg-white border rounded-lg">
                <button onClick={() => toggleGroup(key)} className="w-full text-left px-4 py-3 flex items-center justify-between">
                  <span className="font-semibold">{g.name}</span>
                  <span className="text-sm text-gray-600">{items.length} Einträge · {expanded ? '▲' : '▼'}</span>
                </button>
                {expanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {items.map((l) => (
                      <div key={l.id} className="bg-white p-3 border rounded flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <button onClick={() => navigate(`/list/${l.id}`)} className="font-semibold text-left w-full text-gray-900 break-words text-base" title={l.name}>
                            {l.name}
                          </button>
                          {l.description && (
                            <div className="text-sm text-gray-600 mt-1 line-clamp-3" title={l.description}>{l.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <button onClick={() => openEdit(l)} className="text-sm px-2 py-1 rounded hover:bg-gray-100">Bearbeiten</button>
                          {deletePendingListId === l.id ? (
                            <>
                              <button onClick={() => handleDelete(l.id)} className="text-sm text-red-600 px-2 py-1 rounded bg-red-50">Ja, löschen</button>
                              <button onClick={() => setDeletePendingListId(null)} className="text-sm px-2 py-1 rounded hover:bg-gray-100">Abbrechen</button>
                            </>
                          ) : (
                            <button onClick={() => setDeletePendingListId(l.id)} className="text-sm text-red-600 px-2 py-1 rounded hover:bg-red-50">Löschen</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Sonstige / ungrouped */}
          <div className="bg-white border rounded-lg">
            <button onClick={() => toggleGroup('ungrouped')} className="w-full text-left px-4 py-3 flex items-center justify-between">
              <span className="font-semibold">Sonstige</span>
              <span className="text-sm text-gray-600">{(grouped['ungrouped'] || []).length} Einträge · {expandedGroups['ungrouped'] ? '▲' : '▼'}</span>
            </button>
            {expandedGroups['ungrouped'] && (
              <div className="px-4 pb-4 space-y-3">
                {(grouped['ungrouped'] || []).map((l) => (
                  <div key={l.id} className="bg-white p-3 border rounded flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <button onClick={() => navigate(`/list/${l.id}`)} className="font-semibold text-left w-full text-gray-900 break-words text-base" title={l.name}>
                        {l.name}
                      </button>
                      {l.description && (
                        <div className="text-sm text-gray-600 mt-1 line-clamp-3" title={l.description}>{l.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button onClick={() => openEdit(l)} className="text-sm px-2 py-1 rounded hover:bg-gray-100">Bearbeiten</button>
                      {deletePendingListId === l.id ? (
                        <>
                          <button onClick={() => handleDelete(l.id)} className="text-sm text-red-600 px-2 py-1 rounded bg-red-50">Ja, löschen</button>
                          <button onClick={() => setDeletePendingListId(null)} className="text-sm px-2 py-1 rounded hover:bg-gray-100">Abbrechen</button>
                        </>
                      ) : (
                        <button onClick={() => setDeletePendingListId(l.id)} className="text-sm text-red-600 px-2 py-1 rounded hover:bg-red-50">Löschen</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
              <label className="block text-sm text-gray-600 mb-1">Gruppe (optional)</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedGroupId ?? ""}
                onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Keine Gruppe</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <div className="mt-2">
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Neue Gruppe erstellen (optional)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Anzahl Übersetzungen</label>
              <input
                type="number"
                min={1}
                max={6}
                inputMode="numeric"
                className="border rounded px-3 py-2 w-28 sm:w-32"
                value={translationsCountInput}
                onChange={(e) => {
                  // keep raw input to avoid jumping while typing on mobile
                  setTranslationsCountInput(e.target.value);
                }}
                onBlur={() => {
                  const parsed = Number(translationsCountInput);
                  const v = Number.isFinite(parsed) && parsed >= 1 ? Math.min(6, Math.max(1, Math.floor(parsed))) : 1;
                  setTranslationsCount(v);
                  setTranslationsCountInput(String(v));
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
            <div>
              <label className="block text-sm text-gray-600 mb-1">Gruppe (optional)</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={editGroupId ?? ""}
                onChange={(e) => setEditGroupId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Keine Gruppe</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setEditOpen(false)} className="px-3 py-2 rounded hover:bg-gray-100">Abbrechen</button>
              <button onClick={handleEdit} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">Speichern</button>
            </div>
          </div>
        </div>
      )}
      {manageGroupsOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Gruppen verwalten</h2>
            <div className="space-y-3">
              {groups.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    {editingGroupId === g.id ? (
                      <>
                        <input className="w-full border rounded px-2 py-1 mb-1" value={editingGroupName} onChange={(e) => setEditingGroupName(e.target.value)} />
                        <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Beschreibung (optional)" value={editingGroupDesc ?? ""} onChange={(e) => setEditingGroupDesc(e.target.value)} />
                      </>
                    ) : (
                      <>
                        <div className="font-semibold">{g.name}</div>
                        {g.description && <div className="text-sm text-gray-600">{g.description}</div>}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingGroupId === g.id ? (
                      <>
                        <button
                          onClick={async () => {
                            // save
                            await handleUpdateGroup(g.id, editingGroupName, editingGroupDesc);
                            setEditingGroupId(null);
                          }}
                          className="text-sm px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => {
                            setEditingGroupId(null);
                          }}
                          className="text-sm px-2 py-1 rounded hover:bg-gray-100"
                        >
                          Abbrechen
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingGroupId(g.id);
                            setEditingGroupName(g.name);
                            setEditingGroupDesc(g.description ?? undefined);
                          }}
                          className="text-sm px-2 py-1 rounded hover:bg-gray-100"
                        >
                          Bearbeiten
                        </button>
                        {deletePendingGroupId === g.id ? (
                          <>
                            <button onClick={() => { handleDeleteGroup(g.id); setDeletePendingGroupId(null); }} className="text-sm text-red-600 px-2 py-1 rounded bg-red-50">Ja, löschen</button>
                            <button onClick={() => setDeletePendingGroupId(null)} className="text-sm px-2 py-1 rounded hover:bg-gray-100">Abbrechen</button>
                          </>
                        ) : (
                          <button onClick={() => setDeletePendingGroupId(g.id)} className="text-sm text-red-600 px-2 py-1 rounded hover:bg-red-50">Löschen</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t mt-3">
              <input className="w-full border rounded px-3 py-2 mb-2" placeholder="Neue Gruppe" value={manageNewGroupName} onChange={(e) => setManageNewGroupName(e.target.value)} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setManageGroupsOpen(false)} className="px-3 py-2 rounded hover:bg-gray-100">Schließen</button>
                <button onClick={handleCreateGroupInManage} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">Erstellen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
