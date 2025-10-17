import api from "./api";

// Login
export async function login(username: string, password: string) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);

  const res = await api.post("/login/", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const token = res.data.access_token;
  if (token) localStorage.setItem("token", token);

  return res.data;
}

// Register
export async function register(username: string, password: string, email?: string, firstname?: string) {
  const payload: any = { username, password, email };
  if (firstname) payload.firstname = firstname;
  const res = await api.post("/register/", payload);
  return res.data;
}

// Aktuellen Benutzer laden
export async function getCurrentUser() {
  const res = await api.get("/me/");
  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
}
