import api from './api'

export interface Project {
  id: string
  name: string
  slug: string
  description?: string
  status: string
  color: string
  icon?: string
  created_at: string
  updated_at: string
}

export interface ProjectListResponse {
  projects: Project[]
  total: number
}

export interface ProjectCreateRequest {
  name: string
  description?: string
  status: string
  color: string
  icon?: string
}

export interface ProjectUpdateRequest {
  name?: string
  description?: string
  status?: string
  color?: string
  icon?: string
}

export class ProjectService {
  static async list(): Promise<ProjectListResponse> {
    const res = await api.get('/projects/')
    return res.data
  }

  static async get(projectId: string): Promise<Project> {
    const res = await api.get(`/projects/${projectId}`)
    return res.data
  }

  static async create(data: ProjectCreateRequest): Promise<Project> {
    const res = await api.post('/projects/', data)
    return res.data
  }

  static async update(projectId: string, data: ProjectUpdateRequest): Promise<Project> {
    const res = await api.put(`/projects/${projectId}`, data)
    return res.data
  }

  static async delete(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`)
  }
}


