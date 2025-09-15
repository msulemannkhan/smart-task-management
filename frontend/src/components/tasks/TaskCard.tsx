import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  Icon,
  Avatar,
} from "@chakra-ui/react";
import { FiClock, FiMessageSquare, FiUsers } from "react-icons/fi";
import { type Task, TaskPriority, TaskStatus } from "../../types/task";
import { format, parseISO, differenceInDays } from "date-fns";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const priorityColors = {
    [TaskPriority.LOW]: "teal",
    [TaskPriority.MEDIUM]: "blue",
    [TaskPriority.HIGH]: "orange",
    [TaskPriority.URGENT]: "red",
    [TaskPriority.CRITICAL]: "red",
  };

  const statusColors = {
    [TaskStatus.BACKLOG]: "purple",
    [TaskStatus.TODO]: "gray",
    [TaskStatus.IN_PROGRESS]: "blue",
    [TaskStatus.IN_REVIEW]: "yellow",
    [TaskStatus.BLOCKED]: "red",
    [TaskStatus.DONE]: "green",
    [TaskStatus.CANCELLED]: "gray",
  };

  // Calculate days left from due date
  const daysLeft = task.due_date
    ? differenceInDays(parseISO(task.due_date), new Date())
    : undefined;

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

  return (
    <Box
      bg={{ base: "white", _dark: "gray.700" }}
      borderRadius="md"
      p={4}
      shadow="sm"
      border="1px"
      borderColor={{ base: "gray.200", _dark: "gray.600" }}
      _hover={{
        shadow: "md",
        borderColor: { base: "gray.300", _dark: "gray.500" },
      }}
      cursor="pointer"
      transition="all 0.2s"
    >
      <VStack align="stretch" spacing={3}>
        {/* Task Title */}
        <Text
          fontSize="sm"
          fontWeight="medium"
          lineHeight="short"
          color={{ base: "gray.900", _dark: "gray.100" }}
        >
          {task.title}
        </Text>

        {/* Priority Badge */}
        <HStack justify="flex-end">
          <Badge
            colorScheme={priorityColors[task.priority]}
            variant="subtle"
            fontSize="xs"
          >
            {getPriorityLabel(task.priority)}
          </Badge>
        </HStack>

        {/* Stats */}
        <HStack justify="space-between" align="center" flexWrap="wrap">
          {/* Days Left */}
          {daysLeft !== undefined && (
            <HStack spacing={1}>
              <Icon
                as={FiClock}
                boxSize={3}
                color={{ base: "gray.500", _dark: "gray.400" }}
              />
              <Text
                fontSize="xs"
                color={{ base: "gray.600", _dark: "gray.300" }}
              >
                {daysLeft > 0
                  ? `${daysLeft} Days left`
                  : daysLeft === 0
                  ? "Due today"
                  : `${Math.abs(daysLeft)} Days overdue`}
              </Text>
            </HStack>
          )}

          {/* Comments */}
          {task.comment_count > 0 && (
            <HStack spacing={1}>
              <Icon
                as={FiMessageSquare}
                boxSize={3}
                color={{ base: "gray.500", _dark: "gray.400" }}
              />
              <Text
                fontSize="xs"
                color={{ base: "gray.600", _dark: "gray.300" }}
              >
                {task.comment_count}
              </Text>
            </HStack>
          )}

          {/* Subtasks */}
          {task.subtask_count > 0 && (
            <HStack spacing={1}>
              <Icon
                as={FiUsers}
                boxSize={3}
                color={{ base: "gray.500", _dark: "gray.400" }}
              />
              <Text
                fontSize="xs"
                color={{ base: "gray.600", _dark: "gray.300" }}
              >
                {task.completed_subtasks}/{task.subtask_count}
              </Text>
            </HStack>
          )}

          {/* Progress badge for partially completed tasks */}
          {task.completed_percentage > 0 && task.completed_percentage < 100 && (
            <Badge colorScheme="blue" variant="subtle" fontSize="xs">
              {task.completed_percentage}%
            </Badge>
          )}
        </HStack>

        {/* Assignee Avatar */}
        {task.assignee && (
          <HStack justify="flex-end">
            <Avatar
              size="xs"
              name={task.assignee.full_name || task.assignee.username}
              src={task.assignee.avatar_url}
            />
          </HStack>
        )}
      </VStack>
    </Box>
  );
}
