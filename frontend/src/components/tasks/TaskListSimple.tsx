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

export function TaskListSimple({
  refreshTrigger,
  projectId,
  searchQuery,
  statusFilter,
}: {
  refreshTrigger?: number;
  projectId?: string;
  searchQuery?: string;
  statusFilter?: TaskStatus | "ALL";
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const baseParams: any = {};
      if (projectId) baseParams.project_id = projectId;
      if (statusFilter && statusFilter !== "ALL")
        baseParams.status = statusFilter;

      let response;
      const q = (searchQuery || "").trim();
      if (q.length > 0) {
        response = await TaskService.searchTasks({
          project_id: projectId,
          status:
            statusFilter && statusFilter !== "ALL" ? [statusFilter] : undefined,
          query: q,
          limit: 100,
          offset: 0,
        } as any);
      } else {
        response = await TaskService.getAllTasks({
          ...baseParams,
          per_page: 100,
        });
      }
      setTasks(response.tasks);
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
  }, [refreshTrigger, projectId, searchQuery, statusFilter]);

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
            <Tr key={t.id} _hover={{ bg: "gray.50" }}>
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
