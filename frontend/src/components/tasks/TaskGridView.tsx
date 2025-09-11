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
  IconButton,
  Grid,
  GridItem,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { FiClock, FiMessageSquare, FiCalendar, FiChevronRight, FiChevronLeft, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { format, parseISO, differenceInDays } from "date-fns";
import { useTask } from "../../context/TaskContext";
import { TaskStatus, TaskPriority } from "../../types/task";
import { TaskService } from "../../services/taskService";
import type { Task as ApiTask } from "../../types/task";
import { sortTasks, type SortOption } from "../../utils/taskSort";

type Task = ApiTask;

interface StatusRow {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
}

// Task Card Component optimized for grid layout
function GridTaskCard({ task }: { task: Task }) {
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

  const daysLeft = task.due_date
    ? differenceInDays(parseISO(task.due_date), new Date())
    : undefined;

  const isOverdue = daysLeft !== undefined && daysLeft < 0;
  const isDueSoon = daysLeft !== undefined && daysLeft >= 0 && daysLeft <= 3;

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBorderColor = useColorModeValue("blue.300", "blue.500");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      p={3}
      shadow="sm"
      border="1px"
      borderColor={borderColor}
      _hover={{
        shadow: "md",
        borderColor: hoverBorderColor,
        transform: "translateY(-2px)",
      }}
      cursor="pointer"
      transition="all 0.2s ease"
      onClick={() => setSelectedTask(task)}
      h="160px"
      display="flex"
      flexDirection="column"
      position="relative"
      overflow="hidden"
    >
      {/* Priority indicator bar */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="2px"
        bg={`${priorityColors[task.priority]}.400`}
      />

      <VStack align="stretch" spacing={2} flex={1}>
        {/* Task Title */}
        <Box flex={1}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color={textColor}
            noOfLines={2}
            mb={1}
          >
            {task.title}
          </Text>
          {task.description && (
            <Text
              fontSize="xs"
              color={mutedColor}
              noOfLines={1}
            >
              {task.description}
            </Text>
          )}
        </Box>

        {/* Category badge */}
        {task.category && (
          <Badge
            colorScheme="purple"
            variant="subtle"
            fontSize="xs"
            alignSelf="flex-start"
            px={2}
            py={0.5}
            borderRadius="md"
          >
            {task.category.name}
          </Badge>
        )}

        {/* Bottom Row */}
        <HStack justify="space-between" align="center" spacing={1}>
          {/* Priority Badge */}
          <Badge
            colorScheme={priorityColors[task.priority]}
            variant="solid"
            fontSize="xs"
            px={2}
            py={0.5}
            borderRadius="md"
          >
            {getPriorityLabel(task.priority)}
          </Badge>

          {/* Stats */}
          <HStack spacing={1}>
            {task.comment_count > 0 && (
              <HStack spacing={0.5}>
                <Icon as={FiMessageSquare} boxSize={3} color={mutedColor} />
                <Text fontSize="xs" color={mutedColor}>
                  {task.comment_count}
                </Text>
              </HStack>
            )}

            {task.assignee && (
              <Avatar
                size="xs"
                name={task.assignee.full_name || task.assignee.username}
                src={task.assignee.avatar_url}
              />
            )}
          </HStack>
        </HStack>

        {/* Due date */}
        {task.due_date && (
          <HStack spacing={1} justify="flex-end">
            <Icon
              as={FiCalendar}
              boxSize={3}
              color={
                isOverdue ? "red.500" : isDueSoon ? "orange.500" : mutedColor
              }
            />
            <Text
              fontSize="xs"
              color={
                isOverdue ? "red.500" : isDueSoon ? "orange.500" : mutedColor
              }
              fontWeight={isOverdue || isDueSoon ? "semibold" : "normal"}
            >
              {isOverdue
                ? `${Math.abs(daysLeft)}d overdue`
                : isDueSoon
                ? `${daysLeft}d left`
                : format(parseISO(task.due_date), "MMM d")}
            </Text>
          </HStack>
        )}
      </VStack>
    </Box>
  );
}

// Status Row Component
function StatusGridRow({ row, onScroll }: { row: StatusRow; onScroll?: (status: TaskStatus, direction: 'left' | 'right') => void }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem(`task-status-collapsed-${row.status}`);
    return saved === 'true';
  });
  
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const headerBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.700", "gray.200");

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(`task-status-collapsed-${row.status}`, isCollapsed.toString());
  }, [isCollapsed, row.status]);

  // Calculate if we need pagination
  const tasksPerPage = 6; // 2 rows x 3 columns
  const totalPages = Math.ceil(row.tasks.length / tasksPerPage);
  const currentPage = Math.floor(scrollPosition / tasksPerPage);
  
  // Get visible tasks
  const startIdx = currentPage * tasksPerPage;
  const visibleTasks = row.tasks.slice(startIdx, startIdx + tasksPerPage);

  useEffect(() => {
    setCanScrollLeft(currentPage > 0);
    setCanScrollRight(currentPage < totalPages - 1);
  }, [currentPage, totalPages]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (direction === 'left' && canScrollLeft) {
      setScrollPosition(Math.max(0, scrollPosition - tasksPerPage));
    } else if (direction === 'right' && canScrollRight) {
      setScrollPosition(Math.min(row.tasks.length - 1, scrollPosition + tasksPerPage));
    }
  };

  if (row.tasks.length === 0) {
    return null;
  }

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      overflow="hidden"
      mb={4}
    >
      {/* Status Header */}
      <Box
        p={3}
        bg={headerBg}
        borderBottom="1px"
        borderBottomColor={borderColor}
      >
        <HStack justify="space-between">
          <HStack spacing={3}>
            <IconButton
              aria-label={isCollapsed ? "Expand" : "Collapse"}
              icon={<Icon as={isCollapsed ? FiChevronRight : FiChevronDown} />}
              size="xs"
              variant="ghost"
              onClick={() => setIsCollapsed(!isCollapsed)}
            />
            <Box w={3} h={3} bg={`${row.color}.400`} borderRadius="full" />
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color={textColor}
              textTransform="uppercase"
              letterSpacing="wide"
            >
              {row.title}
            </Text>
            <Badge
              colorScheme={row.color}
              variant="subtle"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="md"
            >
              {row.tasks.length} {row.tasks.length === 1 ? 'task' : 'tasks'}
            </Badge>
          </HStack>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <HStack spacing={2}>
              <IconButton
                aria-label="Previous page"
                icon={<FiChevronLeft />}
                size="xs"
                variant="ghost"
                onClick={() => handleScroll('left')}
                isDisabled={!canScrollLeft}
              />
              <Text fontSize="xs" color={textColor}>
                {currentPage + 1} / {totalPages}
              </Text>
              <IconButton
                aria-label="Next page"
                icon={<FiChevronRight />}
                size="xs"
                variant="ghost"
                onClick={() => handleScroll('right')}
                isDisabled={!canScrollRight}
              />
            </HStack>
          )}
        </HStack>
      </Box>

      {/* Tasks Grid - Only show when not collapsed */}
      {!isCollapsed && (
        <Box p={4}>
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
            gap={3}
          >
            {visibleTasks.map((task) => (
              <GridItem key={task.id}>
                <GridTaskCard task={task} />
              </GridItem>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export function TaskGridView({
  refreshTrigger,
  projectId,
  searchQuery,
  selectedStatuses,
  sortBy,
}: {
  refreshTrigger?: number;
  projectId?: string;
  searchQuery?: string;
  selectedStatuses?: TaskStatus[];
  sortBy?: SortOption;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue("gray.50", "gray.900");

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all tasks first
      const response = await TaskService.getAllTasks({
        project_id: projectId,
        per_page: 100,
      });
      
      let filteredTasks = response.tasks;
      
      // Apply client-side search filter
      if (searchQuery && searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
        );
      }
      
      // Apply status filter
      if (selectedStatuses && selectedStatuses.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          selectedStatuses.includes(task.status)
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
  }, [refreshTrigger, projectId, searchQuery, selectedStatuses, sortBy]);

  const statusRows: StatusRow[] = useMemo(() => {
    const tasksByStatus = tasks.reduce((acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);

    const getStatusColor = (status: TaskStatus) => {
      switch (status) {
        case TaskStatus.TODO:
          return "blue";
        case TaskStatus.IN_PROGRESS:
          return "yellow";
        case TaskStatus.DONE:
          return "green";
        case TaskStatus.BLOCKED:
          return "red";
        case TaskStatus.IN_REVIEW:
          return "purple";
        case TaskStatus.BACKLOG:
          return "gray";
        case TaskStatus.CANCELLED:
          return "gray";
        default:
          return "gray";
      }
    };

    const getStatusTitle = (status: TaskStatus) => {
      switch (status) {
        case TaskStatus.TODO:
          return "TO DO";
        case TaskStatus.IN_PROGRESS:
          return "IN PROGRESS";
        case TaskStatus.DONE:
          return "COMPLETED";
        case TaskStatus.BLOCKED:
          return "BLOCKED";
        case TaskStatus.IN_REVIEW:
          return "IN REVIEW";
        case TaskStatus.BACKLOG:
          return "BACKLOG";
        case TaskStatus.CANCELLED:
          return "CANCELLED";
        default:
          return status.toUpperCase();
      }
    };

    // Define the order of statuses to display
    const statusOrder = [
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
      TaskStatus.IN_REVIEW,
      TaskStatus.BLOCKED,
      TaskStatus.BACKLOG,
      TaskStatus.DONE,
      TaskStatus.CANCELLED,
    ];

    const rows: StatusRow[] = [];
    
    // Show selected statuses or default to TODO and IN_PROGRESS
    const statusesToShow = selectedStatuses && selectedStatuses.length > 0
      ? statusOrder.filter(status => selectedStatuses.includes(status))
      : [TaskStatus.TODO, TaskStatus.IN_PROGRESS];

    statusesToShow.forEach(status => {
      if (tasksByStatus[status] && tasksByStatus[status].length > 0) {
        rows.push({
          status,
          title: getStatusTitle(status),
          tasks: tasksByStatus[status],
          color: getStatusColor(status),
        });
      }
    });

    return rows;
  }, [tasks, selectedStatuses]);

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
  if (tasks.length === 0) {
    return (
      <Box p={6}>
        <Alert status="info">
          <AlertIcon />
          {searchQuery
            ? `No tasks found matching "${searchQuery}"`
            : "No tasks found. Click 'New Task' to create your first task!"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box h="full" bg={bgColor} p={4} overflowY="auto">
      <VStack align="stretch" spacing={0}>
        {statusRows.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            No tasks in selected statuses. Try selecting different status filters.
          </Alert>
        ) : (
          statusRows.map((row) => (
            <StatusGridRow key={row.status} row={row} />
          ))
        )}
      </VStack>
    </Box>
  );
}