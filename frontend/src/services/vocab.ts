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
  translationNames?: string[]
) {
  const columns = [] as Array<any>;
  columns.push({ name: "Begriff", column_type: "custom", position: 0, is_primary: true });
  for (let i = 0; i < translationsCount; i++) {
    const idx = i + 1;
    const colName = translationNames?.[i] ?? `Übersetzung ${idx}`;
    columns.push({ name: colName, column_type: "custom", position: idx });
  }
  const payload = { name, description, columns };
  return api.post("/vocablist/", payload);
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
  data: { name?: string; description?: string }
) {
  return api.put(`/vocablist/${id}`, data);
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
