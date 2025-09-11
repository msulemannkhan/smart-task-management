import api from './api'

export interface Activity {
  id: string
  user_id: string
  user_name?: string
  action_type: string
  entity_type: string
  entity_id?: string
  entity_name?: string
  description: string
  target_user_id?: string
  target_user_name?: string
  project_id?: string
  project_name?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface ActivityListResponse {
  activities: Activity[]
  total: number
  limit: number
  offset: number
}

export class ActivityService {
  static async getRecentActivities(
    projectId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ActivityListResponse> {
    const params = new URLSearchParams()
    if (projectId) params.append('project_id', projectId)
    params.append('limit', limit.toString())
    params.append('offset', offset.toString())
    
    const res = await api.get(`/activities/?${params.toString()}`)
    return res.data
  }

  static async getProjectActivities(
    projectId: string,
    limit: number = 20
  ): Promise<ActivityListResponse> {
    return this.getRecentActivities(projectId, limit)
  }
  
  static async clearActivities(): Promise<{ message: string; count: number }> {
    const response = await api.delete('/activities/')
    return response.data
  }

  // Helper to get activity icon/color based on type
  static getActivityStyle(activity: Activity): { icon: string; color: string } {
    const styles: Record<string, { icon: string; color: string }> = {
      task_created: { icon: 'FiPlus', color: 'green' },
      task_completed: { icon: 'FiCheckCircle', color: 'blue' },
      task_deleted: { icon: 'FiTrash', color: 'red' },
      task_updated: { icon: 'FiEdit', color: 'orange' },
      task_assigned: { icon: 'FiUser', color: 'purple' },
      project_created: { icon: 'FiFolder', color: 'teal' },
      project_updated: { icon: 'FiEdit2', color: 'cyan' },
      project_member_added: { icon: 'FiUserPlus', color: 'purple' },
      project_member_removed: { icon: 'FiUserMinus', color: 'red' },
      status_changed: { icon: 'FiActivity', color: 'orange' },
      priority_changed: { icon: 'FiFlag', color: 'yellow' },
      due_date_changed: { icon: 'FiCalendar', color: 'blue' },
      comment_added: { icon: 'FiMessageCircle', color: 'gray' },
    }
    
    return styles[activity.action_type] || { icon: 'FiActivity', color: 'gray' }
  }
}
