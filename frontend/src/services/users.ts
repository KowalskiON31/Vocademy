import api from "./api";

export async function getUsers() {
  return api.get("/user/");
}

export async function toggleUserActivation(userId: number, activate: boolean) {
  const action = activate ? "activate" : "deactivate";
  return api.put(`/user/${userId}/${action}`);
}

export async function deleteUser(userId: number) {
  return api.delete(`/user/${userId}`);
}

export async function updateUser(userId: number, data: { username?: string; email?: string; role?: string; is_active?: boolean; firstname?: string; avatar?: string }) {
  return api.put(`/user/${userId}`, data);
}

export async function changePassword(userId: number, current_password: string, new_password: string) {
  return api.put(`/user/${userId}/password`, { current_password, new_password });
}

export async function changePasswordMe(current_password: string, new_password: string) {
  return api.put(`/user/me/password/`, { current_password, new_password });
}
