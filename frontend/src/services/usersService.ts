import api from "./api";

export interface PublicUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserListResponse {
  users: PublicUser[];
  total: number;
}

export const UsersService = {
  async list(): Promise<UserListResponse> {
    const response = await api.get("/users");
    return response.data;
  },

  async get(userId: string): Promise<PublicUser> {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Keep old names for backward compatibility
  async listUsers(): Promise<UserListResponse> {
    return this.list();
  },

  async getUser(userId: string): Promise<PublicUser> {
    return this.get(userId);
  },
};
