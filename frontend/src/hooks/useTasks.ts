import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TaskService } from '../services/taskService'
import { 
  type Task, 
  type CreateTaskRequest, 
  type UpdateTaskRequest, 
  type TasksResponse, 
  type TaskStats,
  TaskStatus 
} from '../types/task'
import { useToast } from '@chakra-ui/react'

// Query keys
export const TASK_KEYS = {
  all: ['tasks'] as const,
  lists: () => [...TASK_KEYS.all, 'list'] as const,
  list: (filters: string) => [...TASK_KEYS.lists(), filters] as const,
  details: () => [...TASK_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TASK_KEYS.details(), id] as const,
  stats: (projectId?: string) => ['tasks', 'stats', projectId] as const,
}

// Fetch tasks with filters
export function useTasks(params?: {
  project_id?: string
  status?: TaskStatus
  assignee_id?: string
  page?: number
  per_page?: number
  search?: string
}) {
  const filtersKey = JSON.stringify(params || {})
  
  return useQuery({
    queryKey: TASK_KEYS.list(filtersKey),
    queryFn: () => TaskService.getTasks(params),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

// Fetch single task
export function useTask(id: string) {
  return useQuery({
    queryKey: TASK_KEYS.detail(id),
    queryFn: () => TaskService.getTask(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  })
}

// Fetch task statistics
export function useTaskStats(projectId?: string) {
  return useQuery({
    queryKey: TASK_KEYS.stats(projectId),
    queryFn: () => TaskService.getTaskStats(projectId),
    staleTime: 60 * 1000, // 1 minute
  })
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (taskData: CreateTaskRequest) => TaskService.createTask(taskData),
    onSuccess: (newTask) => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.stats() })
      
      toast({
        title: 'Task created',
        description: `"${newTask.title}" has been created successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating task',
        description: error.response?.data?.detail || 'Something went wrong.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

// Update task mutation
export function useUpdateTask() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      TaskService.updateTask(id, data),
    onSuccess: (updatedTask) => {
      // Update the task in the cache
      queryClient.setQueryData(TASK_KEYS.detail(updatedTask.id), updatedTask)
      
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.stats() })
      
      toast({
        title: 'Task updated',
        description: `"${updatedTask.title}" has been updated.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating task',
        description: error.response?.data?.detail || 'Something went wrong.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: string) => TaskService.deleteTask(id),
    onSuccess: (_, deletedTaskId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: TASK_KEYS.detail(deletedTaskId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.stats() })
      
      toast({
        title: 'Task deleted',
        description: 'Task has been deleted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting task',
        description: error.response?.data?.detail || 'Something went wrong.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

// Update task status (for drag and drop)
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, position }: { id: string; status: TaskStatus; position?: number }) =>
      TaskService.updateTaskStatus(id, status, position),
    onMutate: async ({ id, status, position }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: TASK_KEYS.lists() })

      // Optimistically update the UI
      const previousTasks = queryClient.getQueriesData({ queryKey: TASK_KEYS.lists() })
      
      queryClient.setQueriesData({ queryKey: TASK_KEYS.lists() }, (old: any) => {
        if (!old?.tasks) return old
        
        return {
          ...old,
          tasks: old.tasks.map((task: Task) =>
            task.id === id 
              ? { ...task, status, position: position ?? task.position }
              : task
          )
        }
      })

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Always refetch after success or error
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.stats() })
    },
  })
}

// Bulk operations
export function useBulkUpdateTasks() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ taskIds, updates }: { taskIds: string[]; updates: UpdateTaskRequest }) =>
      TaskService.bulkUpdateTasks(taskIds, updates),
    onSuccess: (_, { taskIds }) => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.stats() })
      
      toast({
        title: 'Tasks updated',
        description: `${taskIds.length} tasks have been updated.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating tasks',
        description: error.response?.data?.detail || 'Something went wrong.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}