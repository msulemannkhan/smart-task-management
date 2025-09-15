import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Avatar,
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
} from "@chakra-ui/react";
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
} from "react-icons/fi";
import { format } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTask } from "../../context/TaskContext";
import { TaskService } from "../../services/taskService";
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
  const [isExpanded, setIsExpanded] = useState(false);
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
          description: `${files.length} file(s) selected (attachment feature coming soon)`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    input.click();
  };

  const handleExpand = () => {
    if (selectedTask) {
      // Close the panel first, then navigate
      setSelectedTask(null);
      navigate(`/tasks/${selectedTask.id}`);
    }
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

  const handleSaveEdit = async () => {
    if (!selectedTask || !editedTitle.trim()) return;

    try {
      setIsUpdating(true);
      await TaskService.updateTask(selectedTask.id, {
        title: editedTitle.trim(),
        description: editedDescription.trim() || undefined,
      });

      const updatedTask = {
        ...selectedTask,
        title: editedTitle.trim(),
        description: editedDescription.trim() || undefined,
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
      toast({
        title: "Failed to update task",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handler functions
  const handleMarkComplete = async () => {
    if (!selectedTask || isUpdating) return;

    try {
      setIsUpdating(true);
      const newStatus =
        selectedTask.status === TaskStatus.DONE
          ? TaskStatus.TODO
          : TaskStatus.DONE;

      await TaskService.updateTask(selectedTask.id, {
        status: newStatus,
        completed_percentage: newStatus === TaskStatus.DONE ? 100 : 0,
      });

      // Update the selected task in context
      const updatedTask = {
        ...selectedTask,
        status: newStatus,
        completed_percentage: newStatus === TaskStatus.DONE ? 100 : 0,
      };
      setSelectedTask(updatedTask);

      toast({
        title:
          newStatus === TaskStatus.DONE ? "Task completed" : "Task reopened",
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

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!selectedTask || isUpdating) return;

    try {
      setIsUpdating(true);

      await TaskService.updateTask(selectedTask.id, { status: newStatus });

      // Update the selected task in context
      const updatedTask = { ...selectedTask, status: newStatus };
      setSelectedTask(updatedTask);

      toast({
        title: "Status updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onTaskUpdate?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update task status";
      toast({
        title: "Failed to update status",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    if (!selectedTask || isUpdating) return;

    try {
      setIsUpdating(true);

      await TaskService.updateTask(selectedTask.id, { priority: newPriority });

      // Update the selected task in context
      const updatedTask = { ...selectedTask, priority: newPriority };
      setSelectedTask(updatedTask);

      toast({
        title: "Priority updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onTaskUpdate?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update task priority";
      toast({
        title: "Failed to update priority",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
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

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.BACKLOG:
        return "Backlog";
      case TaskStatus.TODO:
        return "To Do";
      case TaskStatus.IN_PROGRESS:
        return "In Progress";
      case TaskStatus.IN_REVIEW:
        return "In Review";
      case TaskStatus.BLOCKED:
        return "Blocked";
      case TaskStatus.DONE:
        return "Completed";
      case TaskStatus.CANCELLED:
        return "Cancelled";
      default:
        return "To Do";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.BACKLOG:
        return "gray";
      case TaskStatus.TODO:
        return "gray";
      case TaskStatus.IN_PROGRESS:
        return "blue";
      case TaskStatus.IN_REVIEW:
        return "purple";
      case TaskStatus.BLOCKED:
        return "red";
      case TaskStatus.DONE:
        return "green";
      case TaskStatus.CANCELLED:
        return "red";
      default:
        return "gray";
    }
  };

  // Fetch comments for the current task
  const fetchComments = async (taskId: string) => {
    try {
      setIsLoadingComments(true);
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:9200";
      const response = await fetch(
        `${baseUrl}/api/v1/tasks/${taskId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      } else {
        console.error(
          "Failed to fetch comments:",
          response.status,
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim() || isAddingComment) return;

    try {
      setIsAddingComment(true);

      // Submit comment to API
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:9200";
      const response = await fetch(
        `${baseUrl}/api/v1/tasks/${selectedTask.id}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newComment }),
        }
      );

      if (response.ok) {
        toast({
          title: "Comment added",
          description: "Your comment has been added successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Clear the comment input
        setNewComment("");

        // Refresh comments
        await fetchComments(selectedTask.id);

        onTaskUpdate?.();
      } else {
        throw new Error(`Failed to add comment: ${response.status}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add comment";
      toast({
        title: "Failed to add comment",
        description: errorMessage,
        status: "error",
        duration: 5000,
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

  // Fetch comments when task changes
  useEffect(() => {
    if (selectedTask) {
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
      right={selectedTask ? 0 : "-400px"}
      w={{ base: "100%", md: "400px" }}
      maxW="400px"
      h="100vh"
      bg={useColorModeValue("white", "dark.bg.tertiary")}
      borderLeft="1px"
      borderLeftColor={useColorModeValue("gray.200", "gray.700")}
      display={selectedTask ? "flex" : "none"}
      flexDirection="column"
      transition="right 0.3s ease-in-out"
      shadow="xl"
      zIndex={1000}
      overflowY="auto"
    >
      {/* Header */}
      <Box px={6} py={4} borderBottom="1px" borderBottomColor="gray.100">
        {/* Top Row - Actions and Close */}
        <HStack justify="space-between" mb={3}>
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
            <Button
              variant="ghost"
              size="sm"
              p={1.5}
              minW={6}
              h={7}
              onClick={handleShare}
            >
              <Icon as={FiShare2} boxSize={3.5} color="gray.500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              p={1.5}
              minW={6}
              h={7}
              onClick={handleAttach}
            >
              <Icon as={FiPaperclip} boxSize={3.5} color="gray.500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              p={1.5}
              minW={6}
              h={7}
              onClick={handleExpand}
            >
              <Icon as={FiMaximize2} boxSize={3.5} color="gray.500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              p={1.5}
              minW={6}
              h={7}
              onClick={() => handleMenuAction("Edit")}
            >
              <Icon as={FiEdit3} boxSize={3.5} color="gray.500" />
            </Button>
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                size="sm"
                p={1.5}
                minW={6}
                h={7}
              >
                <Icon as={FiMoreHorizontal} boxSize={3.5} color="gray.500" />
              </MenuButton>
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
          <Button
            variant="ghost"
            size="sm"
            p={1.5}
            minW={6}
            h={7}
            onClick={() => setSelectedTask(null)}
          >
            <Icon as={FiX} boxSize={4} color="gray.500" />
          </Button>
        </HStack>

        {/* Task Title */}
        {isEditingTask ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            fontSize="xl"
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
            fontSize="xl"
            fontWeight="600"
            color="gray.900"
            lineHeight="tight"
          >
            {selectedTask.title}
          </Text>
        )}
      </Box>

      {/* Content */}
      <Box flex={1} overflow="auto">
        {/* Assignee Section */}
        {selectedTask.assignee && (
          <Box px={6} py={3} borderBottom="1px" borderBottomColor="gray.50">
            <HStack justify="space-between" align="center">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Assignee
              </Text>
              <HStack spacing={2}>
                <Avatar
                  size="sm"
                  name={
                    selectedTask.assignee.full_name ||
                    selectedTask.assignee.username
                  }
                  src={selectedTask.assignee.avatar_url}
                />
                <Text fontSize="sm" fontWeight="medium" color="gray.900">
                  {selectedTask.assignee.full_name ||
                    selectedTask.assignee.username}
                </Text>
              </HStack>
            </HStack>
          </Box>
        )}

        {/* Due Date Section */}
        {selectedTask.due_date && (
          <Box px={6} py={3} borderBottom="1px" borderBottomColor="gray.50">
            <HStack justify="space-between" align="center">
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Due Date
              </Text>
              <HStack spacing={2} bg="gray.50" px={3} py={1} borderRadius="md">
                <Icon as={FiCalendar} boxSize={3} color="gray.500" />
                <Text fontSize="sm" fontWeight="medium" color="gray.800">
                  {format(new Date(selectedTask.due_date), "MMM dd - dd")}
                </Text>
              </HStack>
            </HStack>
          </Box>
        )}

        {/* Projects Section */}
        <Box px={6} py={3} borderBottom="1px" borderBottomColor="gray.50">
          <HStack justify="space-between" align="center">
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              Projects
            </Text>
            <Badge
              bg="purple.500"
              color="white"
              fontSize="xs"
              px={3}
              py={1.5}
              borderRadius="md"
              textTransform="uppercase"
              letterSpacing="wide"
              fontWeight="bold"
            >
              EVENT PLANNING
            </Badge>
          </HStack>
        </Box>

        {/* Fields Section */}
        <Box px={6} py={4}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
            Fields
          </Text>

          {/* Status Field */}
          <HStack justify="space-between" align="center" py={2}>
            <HStack spacing={2}>
              <Text color="gray.400" fontSize="lg">
                •
              </Text>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Status
              </Text>
            </HStack>
            <Badge
              bg={
                selectedTask.status === TaskStatus.IN_PROGRESS
                  ? "blue.500"
                  : selectedTask.status === TaskStatus.DONE
                  ? "green.500"
                  : "gray.500"
              }
              color="white"
              fontSize="xs"
              px={3}
              py={1.5}
              borderRadius="md"
              textTransform="uppercase"
              letterSpacing="wide"
              fontWeight="bold"
            >
              {getStatusLabel(selectedTask.status)}
            </Badge>
          </HStack>

          {/* Priority Field */}
          <HStack justify="space-between" align="center" py={2}>
            <HStack spacing={2}>
              <Text color="gray.400" fontSize="lg">
                •
              </Text>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Priority
              </Text>
            </HStack>
            <Badge
              bg={
                selectedTask.priority === TaskPriority.HIGH
                  ? "orange.50"
                  : selectedTask.priority === TaskPriority.LOW
                  ? "gray.50"
                  : "blue.50"
              }
              color={
                selectedTask.priority === TaskPriority.HIGH
                  ? "orange.700"
                  : selectedTask.priority === TaskPriority.LOW
                  ? "gray.600"
                  : "blue.700"
              }
              fontSize="xs"
              px={3}
              py={1.5}
              borderRadius="md"
              textTransform="uppercase"
              letterSpacing="wide"
              fontWeight="bold"
            >
              {getPriorityLabel(selectedTask.priority)}
            </Badge>
          </HStack>
        </Box>

        {/* Description Section */}
        <Box px={6} py={4} borderBottom="1px" borderBottomColor="gray.50">
          <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
            Description
          </Text>
          {isEditingTask ? (
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              fontSize="sm"
              lineHeight="1.6"
              bg="gray.50"
              p={3}
              borderRadius="md"
              minH="100px"
              resize="vertical"
            />
          ) : (
            <Text
              fontSize="sm"
              color="gray.700"
              lineHeight="1.6"
              bg="gray.50"
              p={3}
              borderRadius="md"
            >
              {selectedTask.description || "No description provided"}
            </Text>
          )}
          {isEditingTask && (
            <HStack mt={3} spacing={2}>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={handleSaveEdit}
                isLoading={isUpdating}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingTask(false)}
                isDisabled={isUpdating}
              >
                Cancel
              </Button>
            </HStack>
          )}
        </Box>

        {/* Comments Section */}
        <Box px={6} py={4}>
          {/* Tab Headers */}
          <HStack
            spacing={8}
            mb={4}
            borderBottom="1px"
            borderBottomColor="gray.100"
            pb={2}
          >
            <Box
              position="relative"
              cursor="pointer"
              onClick={() => setActiveTab("comments")}
            >
              <Text
                fontSize="sm"
                fontWeight={activeTab === "comments" ? "semibold" : "medium"}
                color={activeTab === "comments" ? "blue.600" : "gray.500"}
                pb={2}
              >
                Comments
              </Text>
              {activeTab === "comments" && (
                <Box
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  h="2px"
                  bg="blue.500"
                  borderRadius="1px"
                />
              )}
            </Box>
            <Box
              position="relative"
              cursor="pointer"
              onClick={() => setActiveTab("updates")}
            >
              <Text
                fontSize="sm"
                fontWeight={activeTab === "updates" ? "semibold" : "medium"}
                color={activeTab === "updates" ? "blue.600" : "gray.500"}
                pb={2}
              >
                Updates
              </Text>
              {activeTab === "updates" && (
                <Box
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  h="2px"
                  bg="blue.500"
                  borderRadius="1px"
                />
              )}
            </Box>
          </HStack>

          {/* Comments/Updates List */}
          <VStack spacing={4} align="stretch" mb={4}>
            {activeTab === "comments" ? (
              isLoadingComments ? (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                  Loading comments...
                </Text>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <HStack key={comment.id} align="start" spacing={3}>
                    <Avatar
                      size="sm"
                      name={comment.user_name}
                      bg="purple.500"
                      color="white"
                    />
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack spacing={2} align="center">
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="gray.900"
                        >
                          {comment.user_name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {format(new Date(comment.created_at), "d MMM yyyy")}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.700" lineHeight="1.5">
                        {comment.content}
                      </Text>
                    </VStack>
                  </HStack>
                ))
              ) : (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                  No comments yet. Be the first to comment!
                </Text>
              )
            ) : (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                Activity updates will appear here when changes are made to this
                task.
              </Text>
            )}
          </VStack>

          {/* Comment Input */}
          <HStack spacing={3}>
            <Avatar size="sm" name="Current User" bg="gray.400" />
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleCommentKeyPress}
              size="md"
              flex={1}
              variant="outline"
              borderRadius="md"
              bg="white"
              border="1px"
              borderColor="gray.200"
              _focus={{
                borderColor: "blue.400",
                boxShadow: "0 0 0 1px blue.400",
              }}
              fontSize="sm"
              disabled={isAddingComment}
            />
            <Button
              colorScheme="blue"
              size="md"
              px={4}
              borderRadius="md"
              onClick={handleAddComment}
              isLoading={isAddingComment}
              isDisabled={!newComment.trim()}
            >
              <Icon as={FiSend} boxSize={4} />
            </Button>
          </HStack>
        </Box>
      </Box>
    </Box>
  );
}
