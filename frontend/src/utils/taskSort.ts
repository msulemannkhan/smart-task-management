import { Task, TaskPriority } from '../types/task';

const priorityOrder = {
  [TaskPriority.CRITICAL]: 5,
  [TaskPriority.URGENT]: 4,
  [TaskPriority.HIGH]: 3,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.LOW]: 1,
};

export type SortOption = 'created_asc' | 'created_desc' | 'alpha_asc' | 'alpha_desc' | 
                         'priority_high' | 'priority_low' | 'due_soon' | 'due_late';

export function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  const tasksCopy = [...tasks];
  
  switch (sortBy) {
    case 'created_desc':
      return tasksCopy.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    
    case 'created_asc':
      return tasksCopy.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    
    case 'alpha_asc':
      return tasksCopy.sort((a, b) => 
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      );
    
    case 'alpha_desc':
      return tasksCopy.sort((a, b) => 
        b.title.toLowerCase().localeCompare(a.title.toLowerCase())
      );
    
    case 'priority_high':
      return tasksCopy.sort((a, b) => 
        priorityOrder[b.priority] - priorityOrder[a.priority]
      );
    
    case 'priority_low':
      return tasksCopy.sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    
    case 'due_soon':
      return tasksCopy.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    
    case 'due_late':
      return tasksCopy.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      });
    
    default:
      return tasksCopy;
  }
}

export function getSortLabel(sortBy: SortOption): string {
  switch (sortBy) {
    case 'created_desc': return 'Newest First';
    case 'created_asc': return 'Oldest First';
    case 'alpha_asc': return 'A → Z';
    case 'alpha_desc': return 'Z → A';
    case 'priority_high': return 'Priority ↓';
    case 'priority_low': return 'Priority ↑';
    case 'due_soon': return 'Due Soon';
    case 'due_late': return 'Due Later';
    default: return 'Sort';
  }
}