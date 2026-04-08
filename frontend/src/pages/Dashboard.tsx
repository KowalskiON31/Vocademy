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
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-slate-900">
      <Navbar />
      <Toaster toasts={toasts} onRemove={removeToast} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent mb-3">
            📚 Deine Vokabellisten
          </h1>
          <p className="text-base md:text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
            Organisiere und lerne deine Vokabeln effektiv
          </p>
          <button
            onClick={() => setOpen(true)}
            className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-base font-semibold shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label="Neue Vokabelliste erstellen"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Neue Liste erstellen
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400 mb-4"></div>
              <p className="text-lg text-gray-300 font-medium">Listen werden geladen...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
            <span className="text-3xl">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {notice && (
          <div className="mb-6 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
            <span className="text-3xl">✓</span>
            <span className="font-medium">{notice}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Gruppen Header */}
          <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-gray-600/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">📁</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">Deine Gruppen</h2>
              </div>
              <button
                onClick={() => setManageGroupsOpen(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Gruppen verwalten"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Gruppen verwalten
                </span>
              </button>
            </div>
          </div>

          {/* Render each group */}
          {groups.map((g) => {
            const key = String(g.id);
            const items = grouped[key] || [];
            const expanded = !!expandedGroups[key];
            return (
              <div key={key} className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 backdrop-blur-sm rounded-xl shadow-lg border border-gray-600/20 overflow-hidden">
                <button
                  onClick={() => toggleGroup(key)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                  aria-expanded={expanded}
                  aria-label={`Gruppe ${g.name} ${expanded ? 'einklappen' : 'ausklappen'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl" aria-hidden="true">{expanded ? '📂' : '📁'}</span>
                    <span className="text-lg md:text-xl font-semibold text-white">{g.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs md:text-sm font-medium border border-indigo-400/30">
                      {items.length} {items.length === 1 ? 'Liste' : 'Listen'}
                    </span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {expanded && (
                  <div className="px-5 pb-5 pt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((l) => (
                      <article
                        key={l.id}
                        className="bg-gradient-to-br from-gray-600/30 to-gray-700/30 backdrop-blur-sm p-4 rounded-xl border border-gray-500/20 hover:border-indigo-400/50 hover:shadow-lg transition-all group"
                      >
                        <button
                          onClick={() => navigate(`/list/${l.id}`)}
                          className="w-full text-left mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg"
                        >
                          <h3 className="text-base md:text-lg font-semibold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">
                            {l.name}
                          </h3>
                          {l.description && (
                            <p className="text-sm text-gray-300 line-clamp-2">{l.description}</p>
                          )}
                        </button>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-600/30">
                          <button
                            onClick={() => openEdit(l)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-sm font-medium transition-colors border border-indigo-400/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            aria-label={`Liste ${l.name} bearbeiten`}
                          >
                            <span className="flex items-center gap-1.5 justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Bearbeiten
                            </span>
                          </button>
                          {deletePendingListId === l.id ? (
                            <>
                              <button
                                onClick={() => handleDelete(l.id)}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium border border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                                aria-label="Löschen bestätigen"
                              >
                                ✓ Ja
                              </button>
                              <button
                                onClick={() => setDeletePendingListId(null)}
                                className="px-3 py-1.5 rounded-lg bg-gray-600/40 hover:bg-gray-600/60 text-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
                                aria-label="Löschen abbrechen"
                              >
                                ✗
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeletePendingListId(l.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-medium border border-red-400/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                              aria-label={`Liste ${l.name} löschen`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Sonstige / ungrouped */}
          <div className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 backdrop-blur-sm rounded-xl shadow-lg border border-gray-600/20 overflow-hidden">
            <button
              onClick={() => toggleGroup('ungrouped')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
              aria-expanded={!!expandedGroups['ungrouped']}
              aria-label={`Sonstige Listen ${expandedGroups['ungrouped'] ? 'einklappen' : 'ausklappen'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl" aria-hidden="true">{expandedGroups['ungrouped'] ? '📂' : '📁'}</span>
                <span className="text-lg md:text-xl font-semibold text-white">Sonstige</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs md:text-sm font-medium border border-gray-400/30">
                  {(grouped['ungrouped'] || []).length} {(grouped['ungrouped'] || []).length === 1 ? 'Liste' : 'Listen'}
                </span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedGroups['ungrouped'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {expandedGroups['ungrouped'] && (
              <div className="px-5 pb-5 pt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(grouped['ungrouped'] || []).map((l) => (
                  <article
                    key={l.id}
                    className="bg-gradient-to-br from-gray-600/30 to-gray-700/30 backdrop-blur-sm p-4 rounded-xl border border-gray-500/20 hover:border-indigo-400/50 hover:shadow-lg transition-all group"
                  >
                    <button
                      onClick={() => navigate(`/list/${l.id}`)}
                      className="w-full text-left mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg"
                    >
                      <h3 className="text-base md:text-lg font-semibold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">
                        {l.name}
                      </h3>
                      {l.description && (
                        <p className="text-sm text-gray-300 line-clamp-2">{l.description}</p>
                      )}
                    </button>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-600/30">
                      <button
                        onClick={() => openEdit(l)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-sm font-medium transition-colors border border-indigo-400/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        aria-label={`Liste ${l.name} bearbeiten`}
                      >
                        <span className="flex items-center gap-1.5 justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Bearbeiten
                        </span>
                      </button>
                      {deletePendingListId === l.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(l.id)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium border border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label="Löschen bestätigen"
                          >
                            ✓ Ja
                          </button>
                          <button
                            onClick={() => setDeletePendingListId(null)}
                            className="px-3 py-1.5 rounded-lg bg-gray-600/40 hover:bg-gray-600/60 text-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
                            aria-label="Löschen abbrechen"
                          >
                            ✗
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeletePendingListId(l.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-medium border border-red-400/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label={`Liste ${l.name} löschen`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </article>
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
