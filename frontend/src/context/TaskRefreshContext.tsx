import { createContext, useContext, useState, ReactNode } from "react"

interface TaskRefreshContextType {
  refreshTrigger: number
  triggerRefresh: () => void
}

const TaskRefreshContext = createContext<TaskRefreshContextType | undefined>(undefined)

export function useTaskRefresh() {
  const context = useContext(TaskRefreshContext)
  if (context === undefined) {
    throw new Error("useTaskRefresh must be used within a TaskRefreshProvider")
  }
  return context
}

interface TaskRefreshProviderProps {
  children: ReactNode
}

export function TaskRefreshProvider({ children }: TaskRefreshProviderProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <TaskRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </TaskRefreshContext.Provider>
  )
}