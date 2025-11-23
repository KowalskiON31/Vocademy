import api from "./api";

export async function getVocabLists() {
  return api.get("/vocablist/");
}

export async function getVocabList(id: number) {
  return api.get(`/vocablist/${id}`);
}

export async function createVocabList(
  name: string,
  description: string,
  translationsCount: number,
  translationNames?: string[],
  groupId?: number | null
) {
  const columns = [] as Array<any>;
  columns.push({ name: "Begriff", column_type: "custom", position: 0, is_primary: true });
  for (let i = 0; i < translationsCount; i++) {
    const idx = i + 1;
    const colName = translationNames?.[i] ?? `Übersetzung ${idx}`;
    columns.push({ name: colName, column_type: "custom", position: idx });
  }
  const payload: any = { name, description, columns };
  if (groupId) payload.group_id = groupId;
  return api.post("/vocablist/", payload);
}

export async function getVocabGroups() {
  return api.get("/vocabgroup/");
}

export async function createVocabGroup(name: string, description?: string) {
  return api.post("/vocabgroup/", { name, description });
}

export async function createEntry(
  vocabListId: number,
  valuesByColumnId: Record<number, string>
) {
  const field_values = Object.entries(valuesByColumnId).map(([column_id, value]) => ({
    column_id: Number(column_id),
    value,
  }));
  return api.post("/vocab/entries", { vocab_list_id: vocabListId, field_values });
}

export async function getEntriesByList(listId: number) {
  return api.get(`/vocab/entries/list/${listId}`);
}

export async function updateVocabList(
  id: number,
  data: { name?: string; description?: string; group_id?: number | null }
) {
  return api.put(`/vocablist/${id}`, data);
}

export async function updateVocabGroup(id: number, data: { name?: string; description?: string }) {
  return api.put(`/vocabgroup/${id}`, data);
}

export async function deleteVocabGroup(id: number) {
  return api.delete(`/vocabgroup/${id}`);
}

export async function deleteVocabList(id: number) {
  return api.delete(`/vocablist/${id}`);
}

export async function updateEntry(
  entryId: number,
  valuesByColumnId: Record<number, string>
) {
  const field_values = Object.entries(valuesByColumnId).map(([column_id, value]) => ({
    column_id: Number(column_id),
    value,
  }));
  return api.put(`/vocab/entries/${entryId}`, { field_values });
}

export async function deleteEntry(entryId: number) {
  return api.delete(`/vocab/entries/${entryId}`);
}
