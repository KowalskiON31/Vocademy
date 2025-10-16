import axios from "axios";


const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getVocabLists = () => api.get("/vocablist/");
export const createVocabList = (name: string) => api.post("/vocablist/", { name });
export const updateVocabList = (id: number, name: string) => api.put(`/vocablist/${id}`, { name });
export const deleteVocabList = (id: number) => api.delete(`/vocablist/${id}`);
export const getEntriesTable = (vocabListId: number, langs?: string[]) => {
  const params: any = { vocab_list_id: vocabListId };
  if (langs && langs.length > 0) {
    params.langs = langs;
  }
  return api.get("/vocab/entries/table", { params });
};

export const getEntriesByList = (listId: number) => {
  return api.get(`/vocab/entries/list/${listId}`);
};
export const createEntry = (data: any) => api.post("/vocab/entries", data);
export const updateEntry = (id: number, data: any) => api.put(`/vocab/entries/${id}`, data);
export const deleteEntry = (id: number) => api.delete(`/vocab/entries/${id}`);
export const addTranslation = (entryId: number, tr: any) => api.post(`/vocab/entries/${entryId}/translations`, tr);
export const updateTranslation = (translationId: number, tr: any) => api.put(`/vocab/translations/${translationId}`, tr);
export const deleteTranslation = (translationId: number) => api.delete(`/vocab/translations/${translationId}`);

export default api;

// Admin APIs
export const getUsers = () => api.get("/user/");
export const getUserById = (id: number) => api.get(`/user/${id}`);
export const updateUser = (id: number, data: any) => api.put(`/user/${id}`, data);
export const deleteUser = (id: number) => api.delete(`/user/${id}`);
