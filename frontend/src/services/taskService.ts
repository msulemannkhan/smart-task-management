import api from './api'
import { 
  type Task, 
  type CreateTaskRequest, 
  type UpdateTaskRequest, 
  type TasksResponse, 
  TaskPriority,
  TaskStatus
} from '../types/task'

// Re-export Task type for components that import from this service
export type { Task } from '../types/task'

export class TaskService {
  // Get all tasks with optional filtering
  static async getTasks(params?: {
    project_id?: string
    status?: TaskStatus
    assignee_id?: string
    page?: number
    per_page?: number
    search?: string
    offset?: number
  }): Promise<TasksResponse> {
    const response = await api.get('/tasks/', { params })
    return response.data
  }

  // Get a single task by ID
  static async getTask(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`)
    return response.data
  }

  // Alias for getTask (for consistency)
  static async getById(id: string): Promise<Task> {
    return this.getTask(id)
  }

  // Create a new task
  static async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const response = await api.post('/tasks/', taskData)
    return response.data
  }

  // Update an existing task
  static async updateTask(id: string, taskData: UpdateTaskRequest): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, taskData)
    return response.data
  }

  // Alias for updateTask (for consistency)
  static async update(id: string, taskData: UpdateTaskRequest): Promise<Task> {
    return this.updateTask(id, taskData)
  }

  // Delete a task
  static async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`)
  }

  // Get task statistics
  static async getTaskStats(project_id?: string): Promise<{
    total: number
    completed: number
    in_progress: number
    todo: number
    overdue: number
    completion_rate: number
    priority_breakdown: Record<string, number>
  }> {
    const params = project_id ? { project_id } : {}
    const response = await api.get('/tasks/stats', { params })
    // Backend already returns the shape the Dashboard expects
    return response.data
  }

  // Fetch all tasks by paging until has_more is false
  static async getAllTasks(params?: {
    project_id?: string
    status?: TaskStatus
    assignee_id?: string
    per_page?: number
    search?: string
  }): Promise<TasksResponse> {
    const perPage = Math.min(params?.per_page ?? 100, 100)
    let offset = 0
    const all: TasksResponse = { tasks: [], total: 0, limit: perPage, offset: 0, has_more: false }
    // Loop with safety cap
    for (let i = 0; i < 20; i++) {
      const page = await this.getTasks({ ...params, per_page: perPage, offset })
      all.tasks = all.tasks.concat(page.tasks)
      all.total = page.total
      if (!page.has_more) {
        all.has_more = false
        break
      }
      offset += perPage
      all.has_more = true
    }
    return all
  }

  // Update task status (for drag and drop)
  static async updateTaskStatus(id: string, status: TaskStatus, position?: number): Promise<Task> {
    const updateData: UpdateTaskRequest = { status }
    if (position !== undefined) {
      updateData.position = position
    }
    return this.updateTask(id, updateData)
  }

  // Bulk update tasks
  static async bulkUpdateTasks(taskIds: string[], updates: UpdateTaskRequest): Promise<void> {
    await api.post('/bulk/update', {
      task_ids: taskIds,
      updates
    })
  }

  // Bulk complete tasks
  static async bulkCompleteTasks(taskIds: string[]): Promise<void> {
    await api.post('/bulk/complete', {
      task_ids: taskIds
    })
  }

  // Bulk change status
  static async bulkChangeStatus(taskIds: string[], status: TaskStatus): Promise<void> {
    await api.post('/bulk/status', {
      task_ids: taskIds,
      new_status: status
    })
  }

  // Search tasks with advanced filters
  static async searchTasks(params: {
    query?: string
    status?: TaskStatus[]
    priority?: TaskPriority[]
    assignee_id?: string
    category_id?: string
    project_id?: string
    start_date?: string
    due_date?: string
    completed?: boolean
    tags?: string[]
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }): Promise<TasksResponse> {
    const response = await api.get('/tasks/search', { params })
    return response.data
  }

  // Complete or uncomplete a task using dedicated endpoint
  static async completeTask(id: string, completed: boolean = true): Promise<Task> {
    const response = await api.post(`/tasks/${id}/complete`, null, {
      params: { completed }
    })
    return response.data
  }

  // Bulk delete tasks
  static async bulkDeleteTasks(taskIds: string[], hardDelete: boolean = false): Promise<void> {
    await api.post('/bulk/delete', {
      task_ids: taskIds,
      hard_delete: hardDelete
    })
  }

  // Bulk change priority
  static async bulkChangePriority(taskIds: string[], priority: TaskPriority): Promise<void> {
    await api.post('/bulk/priority', {
      task_ids: taskIds,
      new_priority: priority
    })
  }

  // Bulk assign category
  static async bulkAssignCategory(taskIds: string[], categoryId: string | null): Promise<void> {
    await api.post('/bulk/category', {
      task_ids: taskIds,
      category_id: categoryId
    })
  }
}