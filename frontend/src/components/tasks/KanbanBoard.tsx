import {
  Box,
  Flex,
  Text,
  VStack,
  Badge,
  HStack,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  useBreakpointValue,
} from "@chakra-ui/react"
import { TaskCard } from "./TaskCard"
import { useMemo, useState } from "react"
import { type Task, TaskStatus } from "../../types/task"
import { useTasks, useUpdateTaskStatus } from "../../hooks/useTasks"
import { arrayMove } from "@dnd-kit/sortable"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"

interface KanbanColumn {
  id: TaskStatus
  title: string
  tasks: Task[]
}

// Draggable Task Component
function DraggableTask({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition,
    opacity: isDragging ? 0.5 : 1,
  } : undefined

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  )
}

// Droppable Column Component  
function DroppableColumn({ column }: { column: KanbanColumn }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <Box
      ref={setNodeRef}
      flex={{ base: "none", lg: 1 }}
      minW={{ base: "280px", md: "320px", lg: "auto" }}
      bg={{ base: isOver ? "gray.100" : "gray.50", _dark: isOver ? "gray.700" : "gray.800" }}
      borderRadius="md"
      minH={{ base: "400px", md: "500px" }}
      transition="backgroundColor 0.2s"
    >
      {/* Column Header */}
      <HStack justify="space-between" p={{ base: 3, md: 4 }} borderBottom="1px" borderBottomColor={{ base: "gray.200", _dark: "gray.700" }}>
        <HStack>
          <Text fontSize="sm" fontWeight="semibold" color={{ base: "gray.600", _dark: "gray.400" }} textTransform="uppercase">
            {column.title}
          </Text>
          <Badge variant="subtle" colorScheme="gray">
            {column.tasks.length}
          </Badge>
        </HStack>
      </HStack>

      {/* Tasks */}
      <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <VStack spacing={3} p={{ base: 3, md: 4 }} align="stretch" minH={{ base: "300px", md: "400px" }}>
          {column.tasks.map((task) => (
            <DraggableTask key={task.id} task={task} />
          ))}
        </VStack>
      </SortableContext>
    </Box>
  )
}

export function KanbanBoard() {
  // Fetch tasks from API
  const { data: tasksResponse, isLoading, error } = useTasks()
  const updateTaskStatus = useUpdateTaskStatus()
  const isMobile = useBreakpointValue({ base: true, md: false })
  
  // Extract tasks from response or use empty array as fallback
  const [tasks, setTasks] = useState<Task[]>([])
  const [localTaskOrder, setLocalTaskOrder] = useState<Record<string, string[]>>({})  // Track task order per column
  
  // Update local state when API data changes
  useMemo(() => {
    if (tasksResponse?.tasks) {
      setTasks(tasksResponse.tasks)
    }
  }, [tasksResponse])

  // Drag and drop state
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  
  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  const columns: KanbanColumn[] = useMemo(() => {
    const tasksByStatus = tasks.reduce((acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = []
      }
      acc[task.status].push(task)
      return acc
    }, {} as Record<TaskStatus, Task[]>)

    return [
      {
        id: TaskStatus.TODO,
        title: "TODO",
        tasks: tasksByStatus[TaskStatus.TODO] || [],
      },
      {
        id: TaskStatus.IN_PROGRESS,
        title: "IN PROGRESS",
        tasks: tasksByStatus[TaskStatus.IN_PROGRESS] || [],
      },
      {
        id: TaskStatus.DONE,
        title: "COMPLETED", 
        tasks: tasksByStatus[TaskStatus.DONE] || [],
      },
    ]
  }, [tasks])

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the active task
    const activeTask = tasks.find(t => t.id === activeId)
    if (!activeTask) return

    // Check if we're dropping on another task or a column
    const overTask = tasks.find(t => t.id === overId)
    
    if (overTask) {
      // Reordering within the same column
      if (activeTask.status === overTask.status) {
        const column = columns.find(col => col.id === activeTask.status)
        if (!column) return

        const oldIndex = column.tasks.findIndex(t => t.id === activeId)
        const newIndex = column.tasks.findIndex(t => t.id === overId)
        
        if (oldIndex !== newIndex) {
          // Update local task order
          const newTasks = arrayMove(column.tasks, oldIndex, newIndex)
          const newTaskOrder = { ...localTaskOrder, [activeTask.status]: newTasks.map(t => t.id) }
          setLocalTaskOrder(newTaskOrder)
          
          // Update the tasks array to reflect the new order
          const updatedTasks = tasks.map(t => {
            const orderIndex = newTasks.findIndex(nt => nt.id === t.id)
            if (orderIndex !== -1) {
              return { ...t, order: orderIndex }
            }
            return t
          })
          setTasks(updatedTasks)
          
          // TODO: Persist order to backend
          // updateTaskOrder.mutate({ taskId: activeId, newOrder: newIndex })
        }
      } else {
        // Moving to a different column (status change)
        updateTaskStatus.mutate({
          id: activeTask.id,
          status: overTask.status
        })
      }
    } else if (Object.values(TaskStatus).includes(overId as TaskStatus)) {
      // Dropped on a column (not on a task)
      const newStatus = overId as TaskStatus
      
      if (activeTask.status !== newStatus) {
        updateTaskStatus.mutate({
          id: activeTask.id,
          status: newStatus
        })
      }
    }
  }

  // Handle loading state
  if (isLoading) {
    return (
      <Center h="full">
        <Spinner size="xl" color="primary.500" thickness="4px" />
      </Center>
    )
  }

  // Handle error state
  if (error) {
    return (
      <Center h="full" p={6}>
        <Alert status="error" borderRadius="md" maxW="md">
          <AlertIcon />
          Failed to load tasks. Please try again later.
        </Alert>
      </Center>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Flex 
        gap={{ base: 4, md: 6 }} 
        p={{ base: 4, md: 6 }} 
        h="full" 
        align="start"
        overflowX={{ base: "auto", lg: "visible" }}
        overflowY="hidden"
        direction={{ base: "row", lg: "row" }}
      >
        {columns.map((column) => (
          <DroppableColumn key={column.id} column={column} />
        ))}
      </Flex>
      
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  )
}