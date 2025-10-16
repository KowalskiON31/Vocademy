import api from "./api";

export async function login(username: string, password: string) {
  const res = await api.post(
    "/login/",
    new URLSearchParams({ username, password })
  );
  localStorage.setItem("token", res.data.access_token);
  return res.data;
}

export async function getCurrentUser() {
  const res = await api.get("/me/");
  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

export async function register(username: string, password: string) {
  const res = await api.post("/register/", { username, password });
  return res.data;
}