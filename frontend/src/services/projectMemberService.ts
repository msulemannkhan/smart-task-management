import api from './api'

export type ProjectMemberRole = "owner" | "admin" | "manager" | "member" | "guest";

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: ProjectMemberRole
  user?: {
    id: string
    email: string
    username?: string
    full_name?: string
    avatar_url?: string
  }
}

export interface ProjectMemberListResponse {
  members: ProjectMember[]
  total: number
}

export class ProjectMemberService {
  static async list(projectId: string): Promise<ProjectMemberListResponse> {
    const res = await api.get(`/projects/${projectId}/members`)
    return res.data
  }

  static async add(projectId: string, userId: string, role: string = 'member'): Promise<ProjectMember> {
    const res = await api.post(`/projects/${projectId}/members`, { user_id: userId, role })
    return res.data
  }

  static async update(projectId: string, memberId: string, role: string): Promise<ProjectMember> {
    const res = await api.put(`/projects/${projectId}/members/${memberId}`, { role })
    return res.data
  }

  static async remove(projectId: string, memberId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${memberId}`)
  }
}


