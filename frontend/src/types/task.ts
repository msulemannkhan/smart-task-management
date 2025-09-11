export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo', 
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  BLOCKED = 'blocked',
  DONE = 'done',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export interface User {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
}

export interface Project {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  icon?: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon?: string
  description?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  project_id: string
  category_id?: string
  creator_id: string
  assignee_id?: string
  parent_task_id?: string
  start_date?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  completed: boolean
  completed_percentage: number
  position: number
  tags?: string[]
  created_at: string
  updated_at: string
  completed_at?: string
  
  // Relationships
  project?: Project
  category?: Category
  creator?: User
  assignee?: User
  
  // Counts
  subtask_count: number
  completed_subtasks: number
  comment_count: number
  attachment_count: number
}

export interface CreateTaskRequest {
  title: string
  description?: string
  project_id: string
  category_id?: string
  assignee_id?: string
  status?: TaskStatus
  priority?: TaskPriority
  start_date?: string
  due_date?: string
  estimated_hours?: number
  tags?: string[]
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string
  category_id?: string
  start_date?: string
  due_date?: string
  estimated_hours?: number
  completed_percentage?: number
  position?: number
  tags?: string[]
}

export interface TasksResponse {
  tasks: Task[]
  total: number
  // Support both pagination formats
  page?: number
  per_page?: number
  total_pages?: number
  // Alternative format from backend
  limit?: number
  offset?: number
  has_more?: boolean
}

export interface TaskStats {
  total: number
  completed: number
  in_progress: number
  todo: number
  overdue: number
  completion_rate: number
  priority_breakdown: Record<string, number>
}

