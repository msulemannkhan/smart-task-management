import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  Icon,
  Card,
  CardBody,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react";
import {
  FiClock,
  FiMessageSquare,
  FiUsers,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiFlag,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
} from "react-icons/fi";
import { type Task, TaskPriority, TaskStatus } from "../../types/task";
import { format, parseISO, differenceInDays, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../common/Avatar";
import { OnlineStatusIndicator } from "../common/OnlineStatus";
import { useTask } from "../../context/TaskContext";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: string) => void;
  showProject?: boolean;
  compact?: boolean;
  interactive?: boolean;
  onTaskClick?: (task: Task) => void;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  showProject = false,
  compact = false,
  interactive = true,
  onTaskClick,
}: TaskCardProps) {
  const navigate = useNavigate();
  const { setSelectedTask } = useTask();
  const cardBg = useColorModeValue('white', 'dark.bg.tertiary');
  const borderColor = useColorModeValue('gray.200', 'dark.border.subtle');
  const hoverBg = useColorModeValue('gray.50', 'dark.bg.hover');
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  const priorityColors = {
    [TaskPriority.LOW]: "green",
    [TaskPriority.MEDIUM]: "yellow",
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

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE: return FiCheckCircle;
      case TaskStatus.IN_PROGRESS: return FiClock;
      default: return FiAlertCircle;
    }
  };

  // Calculate days left from due date
  const daysLeft = task.due_date
    ? differenceInDays(parseISO(task.due_date), new Date())
    : undefined;

  const isOverdue = task.due_date && daysLeft !== undefined && daysLeft < 0 && task.status !== TaskStatus.DONE;

  const handleCardClick = () => {
    if (interactive) {
      if (onTaskClick) {
        onTaskClick(task);
      } else {
        // Check if we're on the tasks page and use side panel, otherwise navigate
        const currentPath = window.location.pathname;
        if (currentPath === '/tasks' || currentPath.startsWith('/projects/')) {
          setSelectedTask(task);
        } else {
          navigate(`/tasks/${task.id}`);
        }
      }
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <Card
      bg={cardBg}
      borderRadius={compact ? 'lg' : 'xl'}
      border="1px solid"
      borderColor={borderColor}
      cursor={interactive ? 'pointer' : 'default'}
      transition="all 0.2s ease"
      _hover={interactive ? {
        borderColor: 'blue.300',
        shadow: 'md',
        bg: hoverBg,
        transform: 'translateY(-1px)'
      } : {}}
      onClick={handleCardClick}
      position="relative"
      overflow="hidden"
      shadow="sm"
    >
      {/* Priority indicator */}
      <Box
        position="absolute"
        top={0}
        left={0}
        w={1}
        h="full"
        bg={`${priorityColors[task.priority]}.400`}
      />

      {/* Overdue indicator */}
      {isOverdue && (
        <Box
          position="absolute"
          top={2}
          right={2}
          w={2}
          h={2}
          bg="red.400"
          borderRadius="full"
          animation="pulse 2s infinite"
        />
      )}

      <CardBody p={compact ? 4 : 5}>
        <VStack align="stretch" spacing={compact ? 2 : 3}>
          {/* Header */}
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={1} flex={1}>
              <Text
                fontSize={compact ? 'md' : 'lg'}
                fontWeight="semibold"
                color={textColor}
                noOfLines={2}
              >
                {task.title}
              </Text>
              {task.description && (
                <Text
                  fontSize="sm"
                  color={mutedColor}
                  noOfLines={compact ? 1 : 2}
                >
                  {task.description}
                </Text>
              )}
            </VStack>

            {/* Actions menu */}
            {(onEdit || onDelete) && (
              <Menu onClick={handleMenuClick}>
                <MenuButton
                  as={IconButton}
                  icon={<FiMoreVertical />}
                  variant="ghost"
                  size="sm"
                  color={mutedColor}
                  _hover={{ bg: cardBg }}
                />
                <MenuList>
                  {onEdit && (
                    <MenuItem icon={<FiEdit2 />} onClick={() => onEdit(task)}>
                      Edit Task
                    </MenuItem>
                  )}
                  {onDelete && (
                    <MenuItem
                      icon={<FiTrash2 />}
                      color="red.500"
                      onClick={() => onDelete(task)}
                    >
                      Delete Task
                    </MenuItem>
                  )}
                </MenuList>
              </Menu>
            )}
          </HStack>

          {/* Metadata */}
          <HStack justify="space-between" flexWrap="wrap" gap={2}>
            <HStack spacing={2} flexWrap="wrap">
              {/* Status */}
              <Badge
                colorScheme={statusColors[task.status]}
                borderRadius="full"
                px={2}
                py={1}
                fontSize="xs"
              >
                <Icon as={getStatusIcon(task.status)} boxSize={3} mr={1} />
                {task.status.replace('_', ' ')}
              </Badge>

              {/* Priority */}
              <Badge
                colorScheme={priorityColors[task.priority]}
                variant="subtle"
                borderRadius="full"
                px={2}
                py={1}
                fontSize="xs"
              >
                <Icon as={FiFlag} boxSize={3} mr={1} />
                {getPriorityLabel(task.priority)}
              </Badge>

              {/* Project */}
              {showProject && task.project && (
                <Badge
                  colorScheme="purple"
                  variant="outline"
                  borderRadius="full"
                  px={2}
                  py={1}
                  fontSize="xs"
                >
                  {task.project.name}
                </Badge>
              )}
            </HStack>

            {/* Due date */}
            {task.due_date && (
              <HStack spacing={1}>
                <Icon as={FiCalendar} boxSize={3} color={isOverdue ? 'red.500' : mutedColor} />
                <Text
                  fontSize="xs"
                  color={isOverdue ? 'red.500' : mutedColor}
                  fontWeight={isOverdue ? 'semibold' : 'normal'}
                >
                  {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                </Text>
              </HStack>
            )}
          </HStack>

          {/* Assignee and stats */}
          {!compact && (
            <HStack justify="space-between" align="center">
              {/* Assignee */}
              <HStack spacing={2}>
                <Icon as={FiUser} boxSize={3} color={mutedColor} />
                {task.assignee ? (
                  <HStack spacing={2}>
                    <Avatar
                      src={task.assignee.avatar_url}
                      name={task.assignee.full_name || task.assignee.username}
                      email={task.assignee.email}
                      id={task.assignee.id}
                      size="xs"
                      showInitials
                      fallbackIcon={false}
                    />
                    <OnlineStatusIndicator userId={task.assignee.id} size="xs" />
                    <Text fontSize="xs" color={textColor}>
                      {task.assignee.full_name || task.assignee.username || 'Assigned'}
                    </Text>
                  </HStack>
                ) : (
                  <Text fontSize="xs" color={mutedColor}>
                    Unassigned
                  </Text>
                )}
              </HStack>

              {/* Stats */}
              <HStack spacing={3}>
                {/* Comments */}
                {task.comment_count && task.comment_count > 0 && (
                  <HStack spacing={1}>
                    <Icon as={FiMessageSquare} boxSize={3} color={mutedColor} />
                    <Text fontSize="xs" color={mutedColor}>
                      {task.comment_count}
                    </Text>
                  </HStack>
                )}
              </HStack>
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

export default TaskCard;
