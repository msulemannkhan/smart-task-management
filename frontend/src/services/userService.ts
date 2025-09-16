import api from "./api";

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  department?: string;
  location?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  bio?: string;
  department?: string;
  location?: string;
  website?: string;
}

export interface UpdateSettingsRequest {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  weeklyReports?: boolean;
  taskReminders?: boolean;
  mentionNotifications?: boolean;
  projectUpdates?: boolean;
  notificationSound?: boolean;
  profileVisibility?: string;
  showEmail?: boolean;
  showActivity?: boolean;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  weekStart?: string;
}

export class UserService {
  static async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await api.put("/users/profile", data);
    return response.data;
  }

  static async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  static async getCurrentUser(): Promise<UserProfile> {
    const response = await api.get("/users/me");
    return response.data;
  }

  static async updateSettings(settings: UpdateSettingsRequest): Promise<void> {
    // For now, store settings in localStorage
    // In production, this would be saved to the backend
    localStorage.setItem("userSettings", JSON.stringify(settings));
    return Promise.resolve();
  }

  static async getSettings(): Promise<UpdateSettingsRequest> {
    // For now, get settings from localStorage
    // In production, this would be fetched from the backend
    const settings = localStorage.getItem("userSettings");
    if (settings) {
      return JSON.parse(settings);
    }
    return {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      taskReminders: true,
      mentionNotifications: true,
      projectUpdates: true,
      notificationSound: true,
      profileVisibility: "public",
      showEmail: false,
      showActivity: true,
      language: "en",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      weekStart: "sunday",
    };
  }

  static async changePassword(data: {
    current_password: string;
    new_password: string;
  }): Promise<void> {
    // This would typically go through Supabase auth
    // For now, we'll make a direct API call
    await api.post("/auth/change-password", data);
  }

  static async deleteAccount(): Promise<void> {
    // This would delete the user account
    // Should be implemented with proper confirmation
    await api.delete("/users/account");
  }
}