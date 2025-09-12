import {
  Box,
  Flex,
  Text,
  VStack,
  Badge,
  HStack,
  Icon,
  Avatar,
  Spinner,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { FiClock, FiMessageSquare, FiUsers, FiCalendar } from "react-icons/fi";
import { format, parseISO, differenceInDays } from "date-fns";
import { useTask } from "../../context/TaskContext";
import { TaskStatus, TaskPriority } from "../../types/task";
import { TaskService } from "../../services/taskService";
import type { Task as ApiTask } from "../../types/task";
import { sortTasks, type SortOption } from "../../utils/taskSort";

// Use API Task type for consistency
type Task = ApiTask;

interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

// Enhanced TaskCard component with modern design
function SimpleTaskCard({ task }: { task: Task }) {
  const { setSelectedTask } = useTask();
  const priorityColors = {
    [TaskPriority.LOW]: "teal",
    [TaskPriority.MEDIUM]: "blue",
    [TaskPriority.HIGH]: "orange",
    [TaskPriority.URGENT]: "red",
    [TaskPriority.CRITICAL]: "red",
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return "Low";
      case TaskPriority.MEDIUM:
        return "Medium";
      case TaskPriority.HIGH:
        return "High";
      case TaskPriority.URGENT:
        return "Urgent";
      case TaskPriority.CRITICAL:
        return "Critical";
      default:
        return "Low";
    }
  };

  // Calculate days left from due date
  const daysLeft = task.due_date
    ? differenceInDays(parseISO(task.due_date), new Date())
    : undefined;

  const isOverdue = daysLeft !== undefined && daysLeft < 0;
  const isDueSoon = daysLeft !== undefined && daysLeft >= 0 && daysLeft <= 3;

  return (
    <Box
      bg="white"
      borderRadius="lg"
      p={4}
      shadow="sm"
      border="1px"
      borderColor="gray.200"
      _hover={{
        shadow: "lg",
        borderColor: "blue.300",
        transform: "translateY(-2px)",
      }}
      cursor="pointer"
      transition="all 0.3s ease"
      onClick={() => setSelectedTask(task)}
      mb={3}
      position="relative"
      overflow="hidden"
    >
      {/* Priority indicator bar */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="3px"
        bg={`${priorityColors[task.priority]}.400`}
      />

      <VStack align="stretch" spacing={3}>
        {/* Task Title with description preview */}
        <Box>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            lineHeight="short"
            color="gray.800"
            noOfLines={2}
            mb={1}
          >
            {task.title}
          </Text>
          {task.description && (
            <Text
              fontSize="xs"
              color="gray.500"
              noOfLines={2}
              lineHeight="short"
            >
              {task.description}
            </Text>
          )}
        </Box>

        {/* Category badge if exists */}
        {task.category && (
          <Badge
            colorScheme="purple"
            variant="subtle"
            fontSize="xs"
            alignSelf="flex-start"
            px={2}
            py={1}
            borderRadius="md"
          >
            {task.category.name}
          </Badge>
        )}

        {/* Bottom Row - Priority, stats, and due date */}
        <HStack justify="space-between" align="center">
          {/* Priority Badge */}
          <Badge
            colorScheme={priorityColors[task.priority]}
            variant="solid"
            fontSize="xs"
            textTransform="capitalize"
            px={2}
            py={1}
            borderRadius="md"
          >
            {getPriorityLabel(task.priority)}
          </Badge>

          {/* Stats and assignee */}
          <HStack spacing={2}>
            {/* Comments */}
            {task.comment_count > 0 && (
              <HStack spacing={1} px={2} py={1} bg="gray.50" borderRadius="md">
                <Icon as={FiMessageSquare} boxSize={3} color="gray.500" />
                <Text fontSize="xs" color="gray.600" fontWeight="medium">
                  {task.comment_count}
                </Text>
              </HStack>
            )}

            {/* Assignee Avatar */}
            {task.assignee && (
              <Avatar
                size="sm"
                name={task.assignee.full_name || task.assignee.username}
                src={task.assignee.avatar_url}
                border="2px solid"
                borderColor="white"
                boxShadow="sm"
              />
            )}
          </HStack>
        </HStack>

        {/* Due date indicator */}
        {task.due_date && (
          <HStack spacing={1} justify="flex-end">
            <Icon
              as={FiCalendar}
              boxSize={3}
              color={
                isOverdue ? "red.500" : isDueSoon ? "orange.500" : "gray.400"
              }
            />
            <Text
              fontSize="xs"
              color={
                isOverdue ? "red.500" : isDueSoon ? "orange.500" : "gray.500"
              }
              fontWeight={isOverdue || isDueSoon ? "semibold" : "normal"}
            >
              {isOverdue
                ? `${Math.abs(daysLeft)} days overdue`
                : isDueSoon
                ? `${daysLeft} days left`
                : format(parseISO(task.due_date), "MMM d")}
            </Text>
          </HStack>
        )}
      </VStack>
    </Box>
  );
}

// Enhanced Column Component with modern design
function SimpleColumn({ column }: { column: KanbanColumn }) {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return "gray";
      case TaskStatus.IN_PROGRESS:
        return "blue";
      case TaskStatus.DONE:
        return "green";
      case TaskStatus.BLOCKED:
        return "red";
      case TaskStatus.IN_REVIEW:
        return "purple";
      default:
        return "gray";
    }
  };

  const statusColor = getStatusColor(column.id);

  return (
    <Box
      w="280px"
      minW="280px"
      bg="white"
      display="flex"
      flexDirection="column"
      maxH="calc(100vh - 200px)"
      borderRadius="lg"
      border="1px"
      borderColor="gray.200"
      overflow="hidden"
      shadow="sm"
    >
      {/* Enhanced Column Header */}
      <Box
        p={4}
        flexShrink={0}
        bg="gray.50"
        borderBottom="1px"
        borderBottomColor="gray.200"
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            {/* Status indicator dot */}
            <Box w={3} h={3} bg={`${statusColor}.400`} borderRadius="full" />
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="gray.700"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              {column.title}
            </Text>
          </HStack>
          <Badge
            colorScheme={statusColor}
            variant="subtle"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="md"
            fontWeight="semibold"
          >
            {column.tasks.length}
          </Badge>
        </HStack>
      </Box>

      {/* Tasks - Scrollable with better spacing */}
      <Box
        flex={1}
        overflowY="auto"
        p={4}
        bg="gray.50"
        _scrollbar={{
          width: "6px",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "gray.300",
            borderRadius: "3px",
          },
        }}
      >
        {column.tasks.length === 0 ? (
          <Box textAlign="center" py={8} color="gray.400" fontSize="sm">
            No tasks in this column
          </Box>
        ) : (
          column.tasks.map((task) => (
            <SimpleTaskCard key={task.id} task={task} />
          ))
        )}
      </Box>
    </Box>
  );
}

export function KanbanBoardSimple({
  refreshTrigger,
  projectId,
  searchQuery,
  statusFilter,
  sortBy,
}: {
  refreshTrigger?: number;
  projectId?: string;
  searchQuery?: string;
  statusFilter?: TaskStatus | string | undefined;
  sortBy?: SortOption;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all tasks first
      const response = await TaskService.getAllTasks({
        project_id: projectId,
        status: statusFilter && statusFilter !== "ALL" ? statusFilter as TaskStatus : undefined,
        per_page: 100,
      });
      
      let filteredTasks = response.tasks;
      
      // Apply client-side search filter for better reliability
      if (searchQuery && searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query)) ||
          (task.category && task.category.name.toLowerCase().includes(query))
        );
      }
      
      // Apply sorting
      if (sortBy) {
        filteredTasks = sortTasks(filteredTasks, sortBy);
      }
      
      setTasks(filteredTasks);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch tasks";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, projectId, searchQuery, statusFilter, sortBy]);

  const columns: KanbanColumn[] = useMemo(() => {
    const tasksByStatus = tasks.reduce((acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);

    // Default columns to always show
    const defaultColumns = [TaskStatus.BACKLOG, TaskStatus.TODO, TaskStatus.IN_PROGRESS];
    
    // Additional columns to show if they have tasks
    const additionalColumns = [TaskStatus.IN_REVIEW, TaskStatus.BLOCKED, TaskStatus.DONE, TaskStatus.CANCELLED];
    
    // Build columns array
    const columnsToShow: KanbanColumn[] = [];
    
    // Add default columns
    defaultColumns.forEach(status => {
      const title = status === TaskStatus.IN_PROGRESS ? "IN PROGRESS" : 
                   status === TaskStatus.TODO ? "TODO" : 
                   status === TaskStatus.BACKLOG ? "BACKLOG" : status.toUpperCase();
      columnsToShow.push({
        id: status,
        title,
        tasks: tasksByStatus[status] || [],
      });
    });
    
    // Add additional columns only if they have tasks or if specifically filtered
    additionalColumns.forEach(status => {
      // Only show if there are tasks OR if we're specifically filtering for this status
      if ((tasksByStatus[status] && tasksByStatus[status].length > 0) || statusFilter === status) {
        const title = status === TaskStatus.IN_REVIEW ? "IN REVIEW" :
                     status === TaskStatus.DONE ? "COMPLETED" :
                     status === TaskStatus.BLOCKED ? "BLOCKED" :
                     status === TaskStatus.CANCELLED ? "CANCELLED" : status.toUpperCase();
        columnsToShow.push({
          id: status,
          title,
          tasks: tasksByStatus[status] || [],
        });
      }
    });

    return columnsToShow;
  }, [tasks, statusFilter]);

  // Loading state
  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <VStack spacing={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Loading tasks...</Text>
        </VStack>
      </Flex>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  // Empty state
  if (tasks.length === 0 && !isLoading) {
    return (
      <Box p={6}>
        <Alert status="info">
          <AlertIcon />
          No tasks found. Click "New Task" to create your first task!
        </Alert>
      </Box>
    );
  }

  return (
    <Box h="full" bg="gray.50" p={4}>
      <Box
        overflowX="auto"
        overflowY="hidden"
        h="full"
        sx={{
          "&::-webkit-scrollbar": {
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "gray.300",
            borderRadius: "4px",
          },
        }}
      >
        <Flex gap={4} h="full" align="stretch" minH="600px" minW={columns.length <= 3 ? "800px" : `${columns.length * 300}px`}>
          {columns.map((column) => (
            <SimpleColumn key={column.id} column={column} />
          ))}
        </Flex>
      </Box>
    </Box>
  );
}
