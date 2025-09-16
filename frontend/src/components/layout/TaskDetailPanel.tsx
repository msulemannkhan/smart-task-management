import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  Divider,
  Tabs,
  Tab,
  TabList,
  Input,
  Textarea,
  Select,
  useToast,
  Slide,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  IconButton,
} from "@chakra-ui/react";
import api from '../../services/api';
import {
  FiCheckSquare,
  FiShare2,
  FiPaperclip,
  FiMaximize2,
  FiMoreHorizontal,
  FiX,
  FiSend,
  FiCalendar,
  FiEdit3,
  FiUser,
} from "react-icons/fi";
import { format } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTask } from "../../context/TaskContext";
import { TaskService } from "../../services/taskService";
import { UserAvatar } from "../common/UserAvatar";
import { TaskStatus, TaskPriority } from "../../types/task";
import { useEffect } from "react";

interface TaskDetailPanelProps {
  onTaskUpdate?: () => void;
}

export function TaskDetailPanel({ onTaskUpdate }: TaskDetailPanelProps) {
  const { selectedTask, setSelectedTask } = useTask();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "updates">(
    "comments"
  );
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const toast = useToast();
  const currentDate = new Date();

  // Theme-consistent color values
  const bgColor = useColorModeValue('white', 'dark.bg.tertiary');
  const borderColor = useColorModeValue('gray.200', 'dark.border.subtle');
  const headerBg = useColorModeValue('gray.50', 'dark.bg.secondary');
  const textColor = useColorModeValue('gray.900', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const sectionBg = useColorModeValue('white', 'dark.bg.tertiary');
  const hoverBg = useColorModeValue('gray.50', 'dark.bg.hover');

  // Handler functions for header buttons
  const handleShare = () => {
    // Copy task link to clipboard
    const taskUrl = `${window.location.origin}/tasks/${selectedTask.id}`;
    navigator.clipboard
      .writeText(taskUrl)
      .then(() => {
        toast({
          title: "Link copied",
          description: "Task link copied to clipboard",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Could not copy task link to clipboard",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      });
  };

  const handleExpand = () => {
    // Navigate to the full task detail view
    if (selectedTask) {
      navigate(`/tasks/${selectedTask.id}`);
    }
  };

  const handleAttach = () => {
    // Create a file input element and trigger it
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "*/*";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        toast({
          title: "Files selected",
          description: `${files.length} file(s) selected for upload`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    input.click();
  };

  const handleMenuAction = (action: string) => {
    if (action === "Edit") {
      setIsEditingTask(true);
      setEditedTitle(selectedTask.title);
      setEditedDescription(selectedTask.description || "");
    } else {
      toast({
        title: "Action selected",
        description: `${action} (feature coming soon)`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedTask || isUpdating) return;

    try {
      setIsUpdating(true);

      await TaskService.updateTask(selectedTask.id, {
        status: TaskStatus.DONE,
      });

      // Update the selected task in context
      const updatedTask = {
        ...selectedTask,
        status: TaskStatus.DONE,
      };
      setSelectedTask(updatedTask);

      toast({
        title: "Task completed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onTaskUpdate?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete task";
      toast({
        title: "Failed to complete task",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTask || isUpdating) return;

    try {
      setIsUpdating(true);

      await TaskService.updateTask(selectedTask.id, {
        title: editedTitle,
        description: editedDescription,
      });

      // Update the selected task in context
      const updatedTask = {
        ...selectedTask,
        title: editedTitle,
        description: editedDescription,
      };
      setSelectedTask(updatedTask);

      setIsEditingTask(false);
      toast({
        title: "Task updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onTaskUpdate?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update task";
      toast({
        title: "Failed to update task",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchComments = async (taskId: string) => {
    try {
      setIsLoadingComments(true);
      const response = await api.get(`/tasks/${taskId}/comments`);
      if (response.data) {
        setComments(response.data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask || isAddingComment) return;

    try {
      setIsAddingComment(true);

      const response = await api.post(`/tasks/${selectedTask.id}/comments`, {
        content: newComment,
      });

      if (response.data) {
        setComments(prev => [...prev, response.data]);
        setNewComment("");
        toast({
          title: "Comment added",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add comment";
      toast({
        title: "Failed to add comment",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleCommentKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return "gray";
      case TaskPriority.MEDIUM:
        return "blue";
      case TaskPriority.HIGH:
        return "orange";
      case TaskPriority.URGENT:
        return "red";
      case TaskPriority.CRITICAL:
        return "red";
      default:
        return "gray";
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  };

  const getStatusLabel = (status: TaskStatus) => {
    return status.replace("_", " ").toUpperCase();
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return "gray";
      case TaskStatus.IN_PROGRESS:
        return "blue";
      case TaskStatus.IN_REVIEW:
        return "orange";
      case TaskStatus.DONE:
        return "green";
      case TaskStatus.BLOCKED:
        return "red";
      default:
        return "gray";
    }
  };

  useEffect(() => {
    if (selectedTask) {
      setEditedTitle(selectedTask.title);
      setEditedDescription(selectedTask.description || "");
      fetchComments(selectedTask.id);
    } else {
      setComments([]);
    }
  }, [selectedTask]);

  if (!selectedTask) {
    return null;
  }

  return (
    <Box
      position="fixed"
      top={0}
      right={selectedTask ? 0 : "-420px"}
      w={{ base: "100%", md: "420px" }}
      maxW="420px"
      h="100vh"
      bg={bgColor}
      borderLeft="1px"
      borderLeftColor={borderColor}
      display={selectedTask ? "flex" : "none"}
      flexDirection="column"
      transition="right 0.3s ease-in-out"
      shadow={useColorModeValue('xl', 'dark-lg')}
      zIndex={1000}
      overflowY="auto"
    >
      {/* Header */}
      <Box px={4} py={3} borderBottom="1px" borderBottomColor={borderColor} bg={headerBg}>
        <HStack justify="space-between" mb={3}>
          <HStack spacing={2}>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<FiShare2 />}
              aria-label="Share task"
              onClick={handleShare}
            />
            <IconButton
              size="sm"
              variant="ghost"
              icon={<FiPaperclip />}
              aria-label="Attach file"
              onClick={handleAttach}
            />
            <IconButton
              size="sm"
              variant="ghost"
              icon={<FiMaximize2 />}
              aria-label="Expand"
              onClick={handleExpand}
            />
            <Menu>
              <MenuButton
                as={IconButton}
                size="sm"
                variant="ghost"
                icon={<FiMoreHorizontal />}
                aria-label="More actions"
              />
              <MenuList>
                <MenuItem onClick={() => handleMenuAction("Edit")}>
                  Edit Task
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction("Duplicate")}>
                  Duplicate
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction("Archive")}>
                  Archive
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction("Delete")}>
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
          <IconButton
            size="sm"
            variant="ghost"
            icon={<FiX />}
            aria-label="Close"
            onClick={() => setSelectedTask(null)}
          />
        </HStack>

        {/* Task Title */}
        {isEditingTask ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            fontSize="lg"
            fontWeight="600"
            variant="unstyled"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") setIsEditingTask(false);
            }}
          />
        ) : (
          <Text
            fontSize="lg"
            fontWeight="600"
            color={textColor}
            lineHeight="tight"
            cursor="pointer"
            onClick={() => setIsEditingTask(true)}
            _hover={{ opacity: 0.8 }}
          >
            {selectedTask.title}
          </Text>
        )}
      </Box>

      {/* Content */}
      <Box flex={1} p={4}>
        <VStack spacing={4} align="stretch">
          {/* Status and Priority */}
          <HStack spacing={3} justify="space-between">
            <Badge
              colorScheme={getStatusColor(selectedTask.status)}
              size="sm"
              px={3}
              py={1}
              borderRadius="md"
            >
              {getStatusLabel(selectedTask.status)}
            </Badge>
            <Badge
              colorScheme={getPriorityColor(selectedTask.priority)}
              size="sm"
              px={3}
              py={1}
              borderRadius="md"
            >
              {getPriorityLabel(selectedTask.priority)}
            </Badge>
          </HStack>

          {/* Action Buttons */}
          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={handleMarkComplete}
              isLoading={isUpdating}
              fontSize="xs"
              px={3}
              h={7}
              borderRadius="md"
              fontWeight="medium"
            >
              Mark Complete
            </Button>
            {isEditingTask && (
              <>
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={handleSaveEdit}
                  isLoading={isUpdating}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingTask(false)}
                >
                  Cancel
                </Button>
              </>
            )}
          </HStack>

          <Divider />

          {/* Description */}
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
              Description
            </Text>
            {isEditingTask ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Add a description..."
                resize="vertical"
                minH="100px"
                borderColor={borderColor}
                _focus={{ borderColor: 'blue.500' }}
              />
            ) : (
              <Box
                p={3}
                borderRadius="md"
                bg={hoverBg}
                cursor="pointer"
                onClick={() => setIsEditingTask(true)}
                _hover={{ opacity: 0.8 }}
                transition="all 0.2s"
              >
                <Text
                  fontSize="sm"
                  color={selectedTask.description ? textColor : secondaryTextColor}
                >
                  {selectedTask.description || "Click to add description..."}
                </Text>
              </Box>
            )}
          </Box>

          {/* Task Details */}
          {(selectedTask.assignee || selectedTask.due_date || selectedTask.project) && (
            <>
              <Divider />
              <VStack spacing={3} align="stretch">
                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  Details
                </Text>

                {/* Assignee */}
                {selectedTask.assignee && (
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Icon as={FiUser} color={secondaryTextColor} />
                      <Text fontSize="sm" color={secondaryTextColor}>
                        Assignee
                      </Text>
                    </HStack>
                    <HStack spacing={2}>
                      <UserAvatar
                        user={selectedTask.assignee}
                        size="xs"
                        src={selectedTask.assignee.avatar_url}
                      />
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        {selectedTask.assignee.full_name || selectedTask.assignee.username}
                      </Text>
                    </HStack>
                  </HStack>
                )}

                {/* Due Date */}
                {selectedTask.due_date && (
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Icon as={FiCalendar} color={secondaryTextColor} />
                      <Text fontSize="sm" color={secondaryTextColor}>
                        Due Date
                      </Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      {format(new Date(selectedTask.due_date), "MMM dd, yyyy")}
                    </Text>
                  </HStack>
                )}

                {/* Project */}
                {selectedTask.project && (
                  <HStack justify="space-between">
                    <Text fontSize="sm" color={secondaryTextColor}>
                      Project
                    </Text>
                    <Badge colorScheme="purple" size="sm">
                      {selectedTask.project.name}
                    </Badge>
                  </HStack>
                )}
              </VStack>
            </>
          )}

          <Divider />

          {/* Comments Section */}
          <Box flex={1}>
            <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={3}>
              Comments
            </Text>

            {/* Comments List */}
            <VStack spacing={3} align="stretch" mb={4} maxH="300px" overflowY="auto">
              {isLoadingComments ? (
                <Text fontSize="sm" color={secondaryTextColor} textAlign="center" py={4}>
                  Loading comments...
                </Text>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <HStack key={comment.id} align="start" spacing={3}>
                    <UserAvatar
                      user={{ full_name: comment.user_name }}
                      size="sm"
                    />
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack spacing={2} align="center">
                        <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                          {comment.user_name}
                        </Text>
                        <Text fontSize="xs" color={secondaryTextColor}>
                          {format(new Date(comment.created_at), "MMM dd")}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color={textColor}>
                        {comment.content}
                      </Text>
                    </VStack>
                  </HStack>
                ))
              ) : (
                <Text fontSize="sm" color={secondaryTextColor} textAlign="center" py={4}>
                  No comments yet. Be the first to comment!
                </Text>
              )}
            </VStack>

            {/* Comment Input */}
            <HStack spacing={2}>
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleCommentKeyPress}
                size="sm"
                flex={1}
                borderColor={borderColor}
                _focus={{ borderColor: 'blue.500' }}
              />
              <IconButton
                size="sm"
                colorScheme="blue"
                icon={<FiSend />}
                aria-label="Send comment"
                onClick={handleAddComment}
                isLoading={isAddingComment}
                isDisabled={!newComment.trim()}
              />
            </HStack>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}