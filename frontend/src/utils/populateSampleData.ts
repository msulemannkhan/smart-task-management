/**
 * Utility to populate sample data through API endpoints
 * This can be called after login to create test data
 */
import api from '../services/api'
import { ProjectService } from '../services/projectService'
import { TaskPriority, TaskStatus } from '../types/task'

interface SampleTask {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date?: string
}

const sampleTasks: SampleTask[] = [
  // Development tasks
  {
    title: "Implement user authentication",
    description: "Set up JWT-based authentication with refresh tokens",
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    title: "Create REST API endpoints",
    description: "Build CRUD endpoints for tasks and categories",
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    title: "Implement WebSocket for real-time updates",
    description: "Add WebSocket support for live task updates",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  },
  {
    title: "Add data validation middleware",
    description: "Implement request validation using Pydantic models",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
  },
  // Design tasks
  {
    title: "Design dashboard layout",
    description: "Create wireframes for the main dashboard",
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
  {
    title: "Create task card components",
    description: "Design reusable task card UI components",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
  },
  {
    title: "Design mobile responsive layouts",
    description: "Ensure all pages work on mobile devices",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
  },
  // Testing tasks
  {
    title: "Write unit tests for API endpoints",
    description: "Create comprehensive unit tests for all endpoints",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  },
  {
    title: "Set up integration tests",
    description: "Create integration tests for critical workflows",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
  },
  {
    title: "Performance testing",
    description: "Test API performance under load",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
  },
]

export async function populateSampleData(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Starting to populate sample data...')
    
    // Determine a real project to attach tasks to (first accessible), else omit project_id
    let targetProjectId: string | undefined
    try {
      const projects = await ProjectService.list()
      targetProjectId = projects.projects[0]?.id
    } catch {}

    // Create tasks
    let created = 0
    let failed = 0
    
    for (const taskData of sampleTasks) {
      try {
        // Set a default project_id - this should match your backend's expectation
        const payload: any = { ...taskData }
        if (targetProjectId) {
          payload.project_id = targetProjectId
        }
        
        await api.post('/tasks/', payload)
        created++
        console.log(`Created task: ${taskData.title}`)
      } catch (error) {
        console.error(`Failed to create task "${taskData.title}":`, error)
        failed++
      }
    }
    
    const message = `Sample data population complete! Created ${created} tasks, ${failed} failed.`
    console.log(message)
    
    return {
      success: failed === 0,
      message
    }
  } catch (error) {
    const message = `Failed to populate sample data: ${error}`
    console.error(message)
    return {
      success: false,
      message
    }
  }
}

// Check if there are any tasks
export async function hasExistingTasks(): Promise<boolean> {
  try {
    const response = await api.get('/tasks/stats')
    return response.data.total > 0
  } catch (error) {
    console.error('Failed to check existing tasks:', error)
    return false
  }
}