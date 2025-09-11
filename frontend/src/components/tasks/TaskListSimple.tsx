import { useEffect, useState } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { TaskService } from "../../services/taskService";
import type { Task } from "../../types/task";
import { TaskStatus, TaskPriority } from "../../types/task";
import { useTask } from "../../context/TaskContext";
import { sortTasks, type SortOption } from "../../utils/taskSort";

export function TaskListSimple({
  refreshTrigger,
  projectId,
  searchQuery,
  statusFilter,
  sortBy,
}: {
  refreshTrigger?: number;
  projectId?: string;
  searchQuery?: string;
  statusFilter?: TaskStatus | "ALL";
  sortBy?: SortOption;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { setSelectedTask } = useTask();

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all tasks first
      const response = await TaskService.getAllTasks({
        project_id: projectId,
        status: statusFilter && statusFilter !== "ALL" ? statusFilter : undefined,
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
      const message =
        err instanceof Error ? err.message : "Failed to load tasks";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, projectId, searchQuery, statusFilter, sortBy]);

  const priorityColor = (p: TaskPriority) => {
    return {
      [TaskPriority.LOW]: "gray",
      [TaskPriority.MEDIUM]: "blue",
      [TaskPriority.HIGH]: "orange",
      [TaskPriority.URGENT]: "red",
      [TaskPriority.CRITICAL]: "red",
    }[p];
  };

  if (isLoading) {
    return (
      <HStack justify="center" py={10}>
        <Spinner />
        <Text>Loading tasks…</Text>
      </HStack>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box overflowX="auto" px={4} pb={4}>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Title</Th>
            <Th>Status</Th>
            <Th>Priority</Th>
            <Th isNumeric>Comments</Th>
            <Th>Due</Th>
          </Tr>
        </Thead>
        <Tbody>
          {tasks.map((t) => (
            <Tr 
              key={t.id} 
              _hover={{ bg: "gray.50", cursor: "pointer" }}
              onClick={() => setSelectedTask(t)}
            >
              <Td maxW="420px">
                <Text fontWeight="medium" noOfLines={1} title={t.title}>
                  {t.title}
                </Text>
                {t.category && (
                  <Badge colorScheme="purple" ml={2}>
                    {t.category.name}
                  </Badge>
                )}
              </Td>
              <Td>
                <Badge>{t.status?.toLowerCase().replace("_", " ")}</Badge>
              </Td>
              <Td>
                <Badge colorScheme={priorityColor(t.priority)}>
                  {t.priority?.toLowerCase()}
                </Badge>
              </Td>
              <Td isNumeric>{t.comment_count || 0}</Td>
              <Td>
                {t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
