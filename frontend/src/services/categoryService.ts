import api from './api'
import type { Category } from '../types/task'

export interface CategoryResponse extends Category {
  task_count?: number
  completed_tasks?: number
  position?: number
  created_at?: string
  updated_at?: string
}

export interface CategoryListResponse {
  categories: CategoryResponse[]
  total: number
  has_tasks?: number
}

export interface CategoryStatsResponse {
  total_categories: number
  total_tasks: number
  categories_with_tasks: number
  average_tasks_per_category: number
  most_used_colors: { color: string; count: number }[]
}

export interface CategoryCreateRequest {
  name: string
  description?: string
  color: string
  project_id: string
  position?: number
}

export interface CategoryUpdateRequest {
  name?: string
  description?: string
  color?: string
  position?: number
}

export class CategoryService {
  // Get all categories across all user's projects
  static async list(): Promise<CategoryListResponse> {
    try {
      const response = await api.get('/categories/')
      return response.data
    } catch (error) {
      console.error('Failed to fetch all categories:', error)
      // Return empty list as fallback
      return {
        categories: [],
        total: 0,
        has_tasks: 0
      }
    }
  }

  // Get all categories for a project
  static async getProjectCategories(projectId: string): Promise<CategoryListResponse> {
    try {
      const response = await api.get(`/categories/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Return empty list as fallback
      return {
        categories: [],
        total: 0,
        has_tasks: 0
      }
    }
  }

  // Get category statistics
  static async getCategoryStats(): Promise<CategoryStatsResponse> {
    try {
      const response = await api.get('/categories/stats')
      return response.data
    } catch (error) {
      console.error('Failed to fetch category stats:', error)
      // Return default stats as fallback
      return {
        total_categories: 0,
        total_tasks: 0,
        categories_with_tasks: 0,
        average_tasks_per_category: 0,
        most_used_colors: []
      }
    }
  }

  // Get a single category by ID
  static async getCategory(id: string): Promise<CategoryResponse> {
    const response = await api.get(`/categories/${id}`)
    return response.data
  }

  // Create a new category
  static async createCategory(data: CategoryCreateRequest): Promise<CategoryResponse> {
    const response = await api.post('/categories/', data)
    return response.data
  }

  // Update an existing category
  static async updateCategory(id: string, data: CategoryUpdateRequest): Promise<CategoryResponse> {
    const response = await api.put(`/categories/${id}`, data)
    return response.data
  }

  // Delete a category
  static async deleteCategory(id: string, moveTasksTo?: string): Promise<void> {
    const params = moveTasksTo ? { move_tasks_to_category_id: moveTasksTo } : {}
    await api.delete(`/categories/${id}`, { params })
  }

  // Reorder a category
  static async reorderCategory(id: string, newPosition: number): Promise<CategoryResponse> {
    const response = await api.post(`/categories/${id}/reorder`, {
      new_position: newPosition
    })
    return response.data
  }
}